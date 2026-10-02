import DetailList from "../DetailList";
import { yen } from "../../utils/baseUtils";
import {
  itemAmount,
  presentedAmount,
  totalsFromSubtotal,
  temporaryRateOf,
} from "../../utils/statementUtils";

// 区分ごとの文字の色（臨時行の表と同じ）
const TYPE_CLASS = {
  緊急: "text-danger",
  追加: "text-info",
};

/**
 * 毎次明細の合計欄の下に出す「参考」の枠：緊急・追加作業の業者→顧客の請求額
 * この明細（当社→業者）の請求額には含まない。業者が顧客に請求するときの目安
 * 承認なしの行は「-」にして、参考の合計にも含めない
 * @param isAdmin 管理者が見ているか（業者には「御社→顧客」と出す）
 */
export default function PresentedReference({
  rows,
  editable = false,
  policies = [],
  taxRate,
  isAdmin = true,
}) {
  if (rows.length === 0) {
    return null;
  }

  const label = isAdmin ? "業者→顧客" : "御社→顧客";
  const lines = rows.map((row) => {
    const rate = temporaryRateOf(row, editable, policies);
    return { row, rate, amount: presentedAmount(itemAmount(row), rate) };
  });
  const totals = totalsFromSubtotal(
    lines.reduce((sum, l) => sum + (l.amount ?? 0), 0),
    taxRate,
  );
  const hasUnapproved = lines.some((l) => l.rate == null);

  return (
    <div className="reference-panel">
      <h4 className="section-title mt-0">参考：緊急・追加作業の{label}の請求額</h4>
      <div className="note mb-10">
        ※明細の緊急・追加作業の金額に加算割合を足した顧客へ請求する際の金額です。
      </div>
      <table className="compact-table">
        <thead>
          <tr>
            <th className="center">区分</th>
            <th>実施日</th>
            <th>作業内容</th>
            <th className="num">加算割合</th>
            <th className="num">金額</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ row, rate, amount }, i) => (
            <tr key={row.statementItemId ?? row._key ?? i}>
              <td className="center">
                <span className={TYPE_CLASS[row.workType]}>
                  {row.workType || "-"}
                </span>
              </td>
              <td>{row.workDate || "-"}</td>
              <td>{row.itemName}</td>
              <td className="num">
                {rate == null ? (
                  <span className="text-danger">承認なし</span>
                ) : (
                  `${Number(rate)}%`
                )}
              </td>
              <td className="num">{amount == null ? "-" : yen(amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasUnapproved && (
        <div className="note mt-5">
          ※「承認なし」の行は、下の合計に含めていません。
        </div>
      )}
      <DetailList
        variant="totals"
        items={[
          { label: "小計（税別）", value: yen(totals.subtotal) },
          { label: `消費税（${Number(taxRate)}%）`, value: yen(totals.tax) },
          { label: "合計（税込）", value: <strong>{yen(totals.total)}</strong> },
        ]}
      />
    </div>
  );
}
