import { yen } from "../../utils/baseUtils";
import { otherAmount } from "../../utils/statementUtils";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";

// タブレット・スマホの列の幅（%）
// 項目名｜区分｜単価｜数量｜金額
const COLS = [34, 12, 20, 14, 20];

/**
 * 毎次明細のその他項目
 * editable のときは実費（毎回変動）の単価・数量だけ入力できる
 * PC は通常の表、タブレット・スマホは枠つきの小さな表
 */
export default function StatementOtherItemsTable({ others, editable = false, onChange }) {
  const compact = useMediaQuery(TABLET_QUERY);

  const update = (index, key, value) =>
    onChange(others.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  // 数値の入力欄（幅は className：input-price／input-qty。タブレット・スマホは列の幅いっぱい）
  const numberInput = (row, index, key, className) => (
    <input
      type="number"
      min={0}
      step={1}
      value={row[key] ?? ""}
      className={compact ? "input-full" : className}
      onChange={(e) => update(index, key, e.target.value)}
    />
  );

  return (
    <div className={compact ? "survey-building" : "table-container"}>
      <table className={compact ? "compact-table" : "data-table detail-grid"}>
        {compact && (
          <colgroup>
            {COLS.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            <th className="align-left">項目名</th>
            <th className="align-center">区分</th>
            <th className="align-right">単価</th>
            <th className="align-right">数量</th>
            <th className="align-right">金額</th>
          </tr>
        </thead>
        <tbody>
          {others.length === 0 ? (
            <tr>
              <td colSpan={5} className="align-center">
                その他項目はありません。
              </td>
            </tr>
          ) : (
            others.map((row, index) => {
              const inputtable = editable && Boolean(row.isVariable);
              return (
                <tr
                  key={row.statementOtherItemId}
                  className={row.isVariable ? "row-variable" : undefined}
                >
                  <td className="align-left">{row.feeName}</td>
                  <td className="align-center">{row.isVariable ? "実費" : "固定"}</td>
                  <td className="align-right">
                    {inputtable
                      ? numberInput(row, index, "unitPrice", "input-price")
                      : yen(row.unitPrice)}
                  </td>
                  <td className="align-right">
                    {inputtable
                      ? numberInput(row, index, "quantity", "input-qty")
                      : row.quantity}
                  </td>
                  <td className="align-right">{yen(otherAmount(row))}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

