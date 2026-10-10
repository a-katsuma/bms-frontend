import Button from "../../atoms/Button";
import DetailList from "../DetailList";
import { yen, formatDate } from "../../utils/baseUtils";
import {
  formatMonth,
  presentedAmount,
  totalsFromSubtotal,
} from "../../utils/statementUtils";
import {
  EW_STATUS_ORDERED,
  extraWorkStatusClass,
  extraItemAmount,
  WORK_TYPE_CLASS,
} from "../../utils/extraWorkUtils";

/**
 * 例外の案件（緊急・追加作業）の案件詳細に出すカード。見積りの欄と請求状況のカードの代わり
 *   管理者：作業の概要と［作業を開く］
 *   業者　：受注済みの作業だけ（行ごとの当社→御社・御社→顧客と、税込の合計）。受注前は案内だけ
 * @param work 作業（行付き）。undefined は読み込み中、null は作業なし（業者は受注前）
 */
export default function ExtraWorkProjectCard({ work, projectId, isAdmin }) {
  if (work === undefined) {
    return null;
  }

  if (!work) {
    return (
      <div className="card">
        <h3>緊急・追加作業</h3>
        <div className="note">
          {isAdmin
            ? "この案件の作業がありません（作業が削除されています）。"
            : "受注前です。受注すると、ここに内容が表示されます。"}
        </div>
      </div>
    );
  }

  const headItems = [
    {
      label: "区分",
      value: (
        <span className={WORK_TYPE_CLASS[work.workType]}>{work.workType}</span>
      ),
    },
    { label: "実施日", value: formatDate(work.workDate) },
    ...(work.location ? [{ label: "場所", value: work.location }] : []),
    { label: "依頼主", value: work.requester },
    {
      label: "依頼内容",
      value: <span className="pre-wrap">{work.content}</span>,
    },
  ];

  // 管理者：概要と［作業を開く］
  if (isAdmin) {
    const billing = work.importedStatementId
      ? `${formatMonth(work.importedBillingMonth)}の明細に取り込み済み`
      : work.billedDate
        ? `${formatDate(work.billedDate)} 請求済み`
        : work.status === EW_STATUS_ORDERED
          ? "未請求"
          : "-";
    return (
      <div className="card">
        <h3>緊急・追加作業</h3>
        <DetailList
          items={[
            ...headItems,
            {
              label: "発注元→顧客（税込）",
              value: yen(
                totalsFromSubtotal(work.presentedSubtotal, work.taxRate).total,
              ),
            },
            {
              label: "状態",
              value: (
                <span className={extraWorkStatusClass(work.status)}>
                  {work.status}
                </span>
              ),
            },
            { label: "請求", value: billing },
          ]}
        />
        <div className="survey-back">
          <Button
            to={`/projects/${projectId}/extra-works/${work.extraWorkId}`}
            variant="primary"
          >
            作業を開く
          </Button>
        </div>
      </div>
    );
  }

  // 業者：行ごとの額と、税込の合計
  const items = work.items ?? [];
  const ours = totalsFromSubtotal(work.subtotal, work.taxRate);
  const presented = totalsFromSubtotal(work.presentedSubtotal, work.taxRate);
  return (
    <div className="card">
      <h3>緊急・追加作業（受注済み）</h3>
      <DetailList items={headItems} />
      <div className="table-container mt-15">
        <table className="amount-table">
          <thead>
            <tr>
              <th className="align-left">作業内容</th>
              <th className="align-right">当社→御社（税別）</th>
              <th className="align-right">御社→顧客（税別）</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.extraWorkItemId}>
                <td data-label="作業内容" className="align-left">
                  {i.itemName}
                </td>
                <td data-label="当社→御社（税別）" className="align-right">
                  {yen(extraItemAmount(i))}
                </td>
                <td data-label="御社→顧客（税別）" className="align-right">
                  {yen(presentedAmount(extraItemAmount(i), work.markupRate))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DetailList
        variant="totals"
        items={[
          { label: "当社→御社（税込）", value: yen(ours.total) },
          {
            label: "御社→顧客（税込）",
            value: <strong>{yen(presented.total)}</strong>,
          },
        ]}
      />
      <div className="note">
        ※税込は税率 {Number(work.taxRate)}%
        で計算しています。御社→顧客は、当社→御社に加算割合（
        {Number(work.markupRate)}%）を足した額です。
      </div>
    </div>
  );
}
