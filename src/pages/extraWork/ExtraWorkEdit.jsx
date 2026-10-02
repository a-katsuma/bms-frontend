import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import ExtraWorkFields from "../../components/extraWork/ExtraWorkFields";
import { extraWorkApi } from "../../api/extraWorkApi";
import { masterApi } from "../../api/masterApi";
import { formatDate, formatDateTime } from "../../utils/baseUtils";
import { formatMonth, markupRateOn, today } from "../../utils/statementUtils";
import {
  EW_STATUS_ORDERED,
  extraWorkStatusClass,
  toWorkPayload,
  formOfWork,
} from "../../utils/extraWorkUtils";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

// 緊急・追加作業の編集（新規受注は ExtraWorkNew）
export default function ExtraWorkEdit() {
  const { id, workId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, prompt } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [data, setData] = useState(null);
  const [masters, setMasters] = useState({});
  const [form, setForm] = useState(null);
  const [startJson, setStartJson] = useState(""); // 読み込んだ時点（未保存の判定の基準）
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message ?? "",
  );

  const loadForm = (f) => {
    setForm(f);
    setStartJson(JSON.stringify(toWorkPayload(f)));
  };

  const fetchWork = () => {
    setLoading(true);
    extraWorkApi
      .get(id, workId)
      .then((res) => {
        setData(res);
        loadForm(formOfWork(res.extraWork));
      })
      .catch((error) => {
        console.error("緊急・追加作業取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate("/extra-works");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWork();
    masterApi
      .getAll()
      .then(setMasters)
      .catch((error) => console.error("常用項目取得エラー:", error));
  }, [id, workId]);

  const dirty = form != null && JSON.stringify(toWorkPayload(form)) !== startJson;
  const { allowLeave } = useUnsavedChangesGuard(dirty);

  if (loading || !data || !form) {
    return <Loading />;
  }

  const { project, policies = [], extraWork: work } = data;
  const isOrdered = work.status === EW_STATUS_ORDERED;
  const isImported = Boolean(work.importedStatementId);
  const isBilled = Boolean(work.billedDate);
  // 実施日の時点の加算割合（保存するとこの値が記録される）
  const rate = markupRateOn(policies, form.workDate);
  const rateChanged = rate != null && Number(rate) !== Number(work.markupRate);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const request = (promise, onSuccess) => {
    setProcessing(true);
    promise
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        onSuccess?.(res);
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "処理に失敗しました。");
      })
      .finally(() => setProcessing(false));
  };

  const handleSave = async () => {
    if (isOrdered) {
      const ok = await confirm(
        "受注済みの作業です。保存すると「保留」に戻り、もう一度受注が必要になります（受注すると、お知らせメールも送り直します）。\n保存しますか？",
        { title: "受注済みの作業の保存", okLabel: "保存する" },
      );
      if (!ok) return;
    }
    request(extraWorkApi.save(id, workId, toWorkPayload(form)), fetchWork);
  };

  const handleRevert = async () => {
    const ok = await confirm("受注を取り消して、下書きに戻しますか？", {
      title: "下書きに戻す",
      okLabel: "下書きに戻す",
      danger: true,
    });
    if (!ok) return;
    request(extraWorkApi.revert(id, workId), fetchWork);
  };

  const handleBilled = async () => {
    const date = await prompt(
      "請求日を入力してください。\n請求済みにすると案件は「完了」になり、作業は編集できなくなります。",
      today(),
      { title: "請求済みにする", okLabel: "請求済みにする", inputType: "date" },
    );
    if (!date) return;
    request(extraWorkApi.billed(id, workId, date), fetchWork);
  };

  const handleUnbilled = async () => {
    const ok = await confirm(
      "請求済みを取り消しますか？\n案件は「進行中」に戻り、作業を編集できるようになります。",
      { title: "請求済みの取り消し", okLabel: "取り消す", danger: true },
    );
    if (!ok) return;
    request(extraWorkApi.unbilled(id, workId), fetchWork);
  };

  const handleDelete = async () => {
    const ok = await confirm(
      "この作業を削除しますか？\n作業のために作った案件も一緒に削除します（案件は削除済み一覧から復元できますが、作業は戻りません）。",
      { title: "緊急・追加作業の削除", okLabel: "削除", danger: true },
    );
    if (!ok) return;
    request(extraWorkApi.remove(id, workId), (res) => {
      allowLeave(); // 削除後の移動は確認しない
      navigate("/extra-works", { state: { message: res.message } });
    });
  };

  // 請求：取り込み先の明細／請求済みの日／受注済みなら未請求
  const billingText = isImported
    ? `${formatMonth(work.importedBillingMonth)}の明細に取り込み済み`
    : isBilled
      ? `${formatDate(work.billedDate)} 請求済み`
      : isOrdered
        ? "未請求"
        : "-";

  const summaryItems = [
    { label: "案件名", value: project.projectName },
    { label: "顧客名", value: project.clientName },
    { label: "発注業者", value: project.companyName },
    {
      label: "状態",
      value: (
        <span className={extraWorkStatusClass(work.status)}>{work.status}</span>
      ),
    },
  ];
  if (isOrdered) {
    summaryItems.push({
      label: "受注",
      value: `${formatDateTime(work.orderedAt)}（${work.orderedBy}）`,
    });
  }
  summaryItems.push({ label: "請求", value: billingText });

  return (
    <div className="content-wrapper">
      <PageHeader title="緊急・追加作業の編集" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>概要</h3>
        <DetailList items={summaryItems} />
        <div className="survey-back">
          <div className="flex-row">
            <Button to="/extra-works" variant="cancel">
              緊急・追加作業一覧へ戻る
            </Button>
            <Button to={`/projects/${id}`}>案件詳細へ</Button>
          </div>
        </div>
      </div>

      <div className="card base-card">
        <h3>作業内容</h3>
        {/* 見出しの下の操作（プレビュー・下書きに戻す・請求済み） */}
        <div className="base-toolbar">
          <Button
            variant="primary"
            onClick={() =>
              navigate(`/projects/${id}/extra-works/${workId}/preview`)
            }
            disabled={processing || dirty}
          >
            {isOrdered ? "プレビュー" : "プレビュー（受注・保留）"}
          </Button>
          {isOrdered && !isImported && !isBilled && (
            <>
              <Button onClick={handleRevert} disabled={processing}>
                下書きに戻す
              </Button>
              <Button onClick={handleBilled} disabled={processing || dirty}>
                請求済みにする
              </Button>
            </>
          )}
          {isBilled && (
            <Button onClick={handleUnbilled} disabled={processing}>
              請求済みを取り消す
            </Button>
          )}
        </div>

        {isBilled && (
          <div className="alert alert-success">
            {formatDate(work.billedDate)}
            に請求済みです（案件は完了）。編集するには［請求済みを取り消す］をしてください。
          </div>
        )}
        {isImported && (
          <div className="alert alert-danger">
            この作業は{formatMonth(work.importedBillingMonth)}
            の毎次明細に取り込み済みです。編集しても、取り込み済みの明細には反映されません。明細から行を削除して、取り込み直してください。
          </div>
        )}
        {!isBilled && rate == null && (
          <div className="alert alert-danger">
            実施日（{form.workDate || "未入力"}
            ）の時点で、業者の事前承認が「承認する」になっていないため保存できません。実施日を確認するか、業者に事前承認の設定を依頼してください。
          </div>
        )}
        {!isBilled && isOrdered && (
          <div className="note mb-10">
            ※受注済みです。保存すると「保留」に戻り、もう一度受注が必要になります。
          </div>
        )}
        {!isBilled && rateChanged && (
          <div className="text-warning mb-10">
            ※実施日の時点の加算割合が、保存したとき（{Number(work.markupRate)}
            %）と違います。保存すると {Number(rate)}% で記録し直します。
          </div>
        )}
        {dirty && (
          <div className="text-danger mb-10">
            ※未保存の変更があります。プレビュー・請求済みにするは、保存してから使えます。
          </div>
        )}

        <ExtraWorkFields
          form={form}
          onChange={set}
          rate={rate}
          masters={masters}
          locked={isBilled}
        />

        {!isBilled && (
          <div className="action-buttons-form">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={processing || !dirty || rate == null}
            >
              保存する
            </Button>
            {!isOrdered && !isImported && (
              <Button variant="danger" onClick={handleDelete} disabled={processing}>
                削除
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
