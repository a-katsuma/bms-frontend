import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import { extraWorkApi } from "../../api/extraWorkApi";
import { yen, formatDate, formatDateTime } from "../../utils/baseUtils";
import { presentedAmount } from "../../utils/statementUtils";
import {
  EW_STATUS_DRAFT,
  EW_STATUS_ORDERED,
  extraWorkStatusClass,
  extraItemAmount,
  calcExtraWorkTotals,
} from "../../utils/extraWorkUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

// 顧客に見せるプレビュー（サイドバーなしの全画面）
// 行は「作業内容｜金額（税別。業者→顧客）」だけ。数量・単位・当社単価・当社→業者・加算割合は出さない
// ［受注］［保留］は画面下の管理者用の欄（印刷しない）
export default function ExtraWorkPreview() {
  const { id, workId } = useParams();
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [data, setData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchWork = () => {
    setLoading(true);
    extraWorkApi
      .get(id, workId)
      .then(setData)
      .catch((error) => {
        console.error("緊急・追加作業取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate(`/projects/${id}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWork();
  }, [id, workId]);

  if (loading || !data) {
    return <Loading />;
  }

  const { project, extraWork: work } = data;
  const items = work.items ?? [];
  const isOrdered = work.status === EW_STATUS_ORDERED;
  // 保存したときに記録した加算割合で計算する
  const totals = calcExtraWorkTotals(items, work.markupRate, work.taxRate);

  const request = (promise) => {
    setProcessing(true);
    promise
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        fetchWork();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "処理に失敗しました。");
      })
      .finally(() => setProcessing(false));
  };

  const handleOrder = async () => {
    const ok = await confirm(
      `この内容（合計 ${yen(totals.total)}・税込）で受注しますか？\n受注すると、発注元の代表ユーザーにお知らせメールを送ります。`,
      { title: "受注", okLabel: "受注する" },
    );
    if (!ok) return;
    request(extraWorkApi.order(id, workId));
  };

  const handleHold = async () => {
    const ok = await confirm(
      "保留にしますか？\n保留にした作業は、あとでこの画面から受注できます。",
      { title: "保留", okLabel: "保留にする" },
    );
    if (!ok) return;
    request(extraWorkApi.hold(id, workId));
  };

  const totalItems = [
    { label: "小計（税別）", value: yen(totals.presentedSubtotal) },
    {
      label: `消費税（${Number(work.taxRate)}%）`,
      value: yen(totals.tax),
    },
    { label: "合計（税込）", value: <strong>{yen(totals.total)}</strong> },
  ];

  return (
    <div className="preview-page">
      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="preview-paper">
        <div className="preview-title">{work.workType}作業のご確認</div>

        <div className="preview-head">
          <div className="preview-client">{project.clientName} 様</div>
          <div className="preview-date">
            作成日 {formatDate(work.updatedAt)}
          </div>
        </div>

        <dl className="preview-info">
          <div>
            <dt>依頼主</dt>
            <dd>{work.requester}</dd>
          </div>
          <div>
            <dt>実施日</dt>
            <dd>{formatDate(work.workDate)}</dd>
          </div>
          {work.location && (
            <div>
              <dt>場所</dt>
              <dd>{work.location}</dd>
            </div>
          )}
          <div>
            <dt>依頼内容</dt>
            <dd className="pre-wrap">{work.content}</dd>
          </div>
        </dl>

        <div className="table-container">
          <table className="amount-table">
            <thead>
              <tr>
                <th className="align-left">作業内容</th>
                <th className="align-right">金額（税別）</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.extraWorkItemId}>
                  <td data-label="作業内容" className="align-left">
                    {i.itemName}
                  </td>
                  <td data-label="金額（税別）" className="align-right">
                    {yen(presentedAmount(extraItemAmount(i), work.markupRate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DetailList variant="totals" items={totalItems} />
      </div>

      {/* 管理者用の欄（印刷しない） */}
      <div className="preview-actions">
        <div className="preview-actions-status">
          状態：
          <span className={extraWorkStatusClass(work.status)}>
            {work.status}
          </span>
          {isOrdered &&
            `（${formatDateTime(work.orderedAt)}・${work.orderedBy}）`}
        </div>
        <div className="preview-actions-buttons">
          {!isOrdered && (
            <Button
              variant="primary"
              onClick={handleOrder}
              disabled={processing}
            >
              受注
            </Button>
          )}
          {work.status === EW_STATUS_DRAFT && (
            <Button onClick={handleHold} disabled={processing}>
              保留
            </Button>
          )}
          <Button onClick={() => window.print()} disabled={processing}>
            印刷
          </Button>
          <Button to={`/projects/${id}/extra-works/${workId}`} variant="cancel">
            編集画面へ戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
