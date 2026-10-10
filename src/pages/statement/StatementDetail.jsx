import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import StatementItemsTable from "../../components/statement/StatementItemsTable";
import StatementOtherItemsTable from "../../components/statement/StatementOtherItemsTable";
import TemporaryItemsTable from "../../components/statement/TemporaryItemsTable";
import PresentedReference from "../../components/statement/PresentedReference";
import ImportExtraWorksDialog from "../../components/statement/ImportExtraWorksDialog";
import { statementApi } from "../../api/statementApi";
import { yen, formatDate } from "../../utils/baseUtils";
import {
  STATUS_DRAFT,
  calcStatementTotals,
  formatMonth,
  statusClass,
  today,
  temporaryRateOf,
  rowsFromExtraWork,
} from "../../utils/statementUtils";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

export default function StatementDetail() {
  const { id, statementId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [others, setOthers] = useState([]);
  const [temps, setTemps] = useState([]); // 緊急・追加作業
  const [issuedDate, setIssuedDate] = useState("");
  const [dirty, setDirty] = useState(false);
  const [importing, setImporting] = useState(false); // 取り込みのダイアログを開いているか
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message ?? "",
  );

  const fetchStatement = () => {
    setLoading(true);
    statementApi
      .get(id, statementId, isAdmin)
      .then((res) => {
        setData(res);
        setItems(res.statement.items ?? []);
        setOthers(res.statement.otherItems ?? []);
        setTemps(res.statement.temporaryItems ?? []);
        setIssuedDate(res.statement.issuedDate ?? today());
        setDirty(false);
      })
      .catch((error) => {
        console.error("毎次明細取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate(`/projects/${id}/statements`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatement();
  }, [id, statementId, isAdmin]);

  const { allowLeave } = useUnsavedChangesGuard(dirty);

  if (loading || !data) {
    return <Loading />;
  }

  const { project, statement, policies = [], importCandidates = [] } = data;
  const isDraft = statement.status === STATUS_DRAFT;
  const editable = isAdmin && isDraft;
  // 実施日の時点で事前承認がない緊急・追加作業の件数（取り込んだ行は作業の加算割合）
  const unapprovedCount = temps.filter(
    (t) => temporaryRateOf(t, editable, policies) == null,
  ).length;
  // 取り込める作業（この明細にまだ入れていないもの）
  const candidates = importCandidates.filter(
    (w) => !temps.some((t) => t.extraWorkId === w.extraWorkId),
  );
  const totals = calcStatementTotals(
    [...items, ...temps],
    others,
    statement.taxRate,
  );

  const handleItemsChange = (next) => {
    setItems(next);
    setDirty(true);
  };

  const handleOthersChange = (next) => {
    setOthers(next);
    setDirty(true);
  };

  const handleTempsChange = (next) => {
    setTemps(next);
    setDirty(true);
  };

  // 選んだ作業を、作業の行ごとに臨時行としてコピーする（保存すると取り込みが確定）
  const handleImport = (works) => {
    setTemps([...temps, ...works.flatMap(rowsFromExtraWork)]);
    setDirty(true);
    setImporting(false);
  };

  const buildPayload = () => ({
    items: items.map((i) => ({
      statementItemId: i.statementItemId,
      adjustmentQuantity: Number(i.adjustmentQuantity || 0),
      adjustmentReason: i.adjustmentReason?.trim() || null,
    })),
    otherItems: others
      .filter((o) => o.isVariable)
      .map((o) => ({
        statementOtherItemId: o.statementOtherItemId,
        quantity: Number(o.quantity || 0),
        unitPrice:
          o.unitPrice === "" || o.unitPrice == null
            ? null
            : Number(o.unitPrice),
      })),
    temporaryItems: temps.map((t) => ({
      workType: t.workType,
      workDate: t.workDate || null,
      building: t.building?.trim() || null,
      itemName: String(t.itemName ?? "").trim(),
      temporaryReason: String(t.temporaryReason ?? "").trim(),
      baseQuantity: Number(t.baseQuantity || 0),
      unit: String(t.unit ?? "").trim(),
      unitPrice:
        t.unitPrice === "" || t.unitPrice == null ? null : Number(t.unitPrice),
      extraWorkId: t.extraWorkId ?? null, // 取り込み元（送らないと保存で消える）
    })),
  });

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

  const handleSave = () =>
    request(statementApi.save(id, statementId, buildPayload()), fetchStatement);

  const handleConfirm = async () => {
    if (!issuedDate) {
      showError("発行日を入力してください。");
      return;
    }
    const zeroVariables = others
      .filter((o) => o.isVariable && Number(o.unitPrice || 0) === 0)
      .map((o) => o.feeName);
    const warning =
      zeroVariables.length > 0
        ? `\n\n※実費が0円の項目があります：${zeroVariables.join("、")}`
        : "";
    const ok = await confirm(
      `${formatMonth(statement.billingMonth)}の明細を、発行日 ${issuedDate} で確定しますか？\n確定すると発注元に公開され、編集できなくなります。${warning}`,
      { title: "明細の確定", okLabel: "確定する" },
    );
    if (!ok) return;
    request(
      statementApi.confirm(id, statementId, { ...buildPayload(), issuedDate }),
      fetchStatement,
    );
  };

  const handleUnconfirm = async () => {
    const ok = await confirm(
      "確定を解除して下書きに戻しますか？\n解除中は発注元から見えなくなります。",
      { title: "確定の解除", okLabel: "解除する" },
    );
    if (!ok) return;
    request(statementApi.unconfirm(id, statementId), fetchStatement);
  };

  const handleDelete = async () => {
    const ok = await confirm("この下書きを削除しますか？", {
      title: "下書きの削除",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;
    request(statementApi.remove(id, statementId), (res) => {
      allowLeave(); // 削除後の移動は確認しない
      navigate(`/projects/${id}/statements`, {
        state: { message: res.message },
      });
    });
  };

  const summaryItems = [
    { label: "案件名", value: project.projectName },
    { label: "顧客名", value: project.clientName },
    { label: "請求年月", value: formatMonth(statement.billingMonth) },
    {
      label: "状態",
      value: (
        <span className={statusClass(statement.status)}>
          {statement.status}
        </span>
      ),
    },
    {
      label: "元のベース",
      value: statement.versionNo
        ? `${statement.baseName}（第${statement.versionNo}版）`
        : "-",
    },
  ];
  if (!isDraft) {
    summaryItems.push({
      label: "発行日",
      value: formatDate(statement.issuedDate),
    });
  }

  // 合計欄（下書きの編集中は、合計の下に発行日の入力を置く）
  const totalItems = [
    { label: "小計", value: yen(totals.subtotal) },
    {
      label: `消費税（${Number(statement.taxRate)}%）`,
      value: yen(totals.tax),
    },
    { label: "合計", value: <strong>{yen(totals.total)}</strong> },
    ...(editable
      ? [
          {
            label: "発行日",
            value: (
              <input
                type="date"
                value={issuedDate}
                className="input-date"
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader
        title={`毎次明細（${formatMonth(statement.billingMonth)}）`}
      />

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
          <Button to={`/projects/${id}/statements`} variant="cancel">
            毎次明細一覧へ戻る
          </Button>
        </div>
      </div>

      <div className="card base-card">
        <h3>明細</h3>
        {/* 見出しの下の操作（確定済み：確定解除） */}
        {isAdmin && !isDraft && (
          <div className="base-toolbar">
            <Button onClick={handleUnconfirm} disabled={processing}>
              確定解除
            </Button>
          </div>
        )}

        {editable && (
          <div className="note mb-10">
            ※今回実施しなかった分は「調整数」にマイナスで入力してください（例：2台実施しなかった
            →
            -2。黄色の行）。実費の項目は単価・数量を入力してください（青色の行）。
          </div>
        )}
        {dirty && (
          <div className="text-danger mb-10">※未保存の変更があります。</div>
        )}

        <StatementItemsTable
          items={items}
          editable={editable}
          onChange={handleItemsChange}
        />

        <h4 className="section-title">その他項目</h4>
        <StatementOtherItemsTable
          others={others}
          editable={editable}
          onChange={handleOthersChange}
        />

        {/* 緊急・追加作業（使う回数が少ないので、その他項目の下。閲覧だけで行がなければ出さない） */}
        {(editable || temps.length > 0) && (
          <>
            <h4 className="section-title">緊急・追加作業</h4>
            {editable && unapprovedCount > 0 && (
              <div className="alert alert-danger mb-10">
                ※実施日の時点で事前承認がない行が {unapprovedCount}{" "}
                件あります（「承認なし」の行）。発注元の了承を得てください（その行の発注元→顧客の額は、参考の欄に出ません）。
              </div>
            )}
            <TemporaryItemsTable
              rows={temps}
              editable={editable}
              policies={policies}
              onChange={handleTempsChange}
              onImport={() => setImporting(true)}
              importCount={candidates.length}
            />
          </>
        )}

        <DetailList variant="totals" items={totalItems} />

        {/* 参考：業者→顧客の請求額（明細の合計には含まない） */}
        <PresentedReference
          rows={temps}
          editable={editable}
          policies={policies}
          taxRate={statement.taxRate}
          isAdmin={isAdmin}
        />

        {editable && (
          <div className="action-buttons-form">
            <Button onClick={handleSave} disabled={processing || !dirty}>
              下書き保存
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={processing}
            >
              確定する
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={processing}
            >
              削除
            </Button>
          </div>
        )}
      </div>

      {/* 受注済みの緊急・追加作業を取り込むダイアログ（開くたびに候補を取り直す） */}
      {importing && (
        <ImportExtraWorksDialog
          clientId={project.clientId}
          companyId={project.companyId}
          excludeIds={temps.map((t) => t.extraWorkId).filter((v) => v != null)}
          onImport={handleImport}
          onCancel={() => setImporting(false)}
        />
      )}
    </div>
  );
}
