import Button from "../../atoms/Button";
import { yen } from "../../utils/baseUtils";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";

// タブレット・スマホの列の幅（%）。文字を小さくして、この比率を保つ
// 項目名｜毎回変動｜単価｜数量｜金額｜（削除）
const COLS_EDIT = [30, 12, 18, 12, 16, 12];
const COLS_VIEW = [36, 12, 18, 14, 20];

/**
 * ベース明細のその他項目
 * PC は通常の表、タブレット・スマホは枠つきの小さな表
 */
export default function BaseOtherItemsTable({ others, editable = false, onChange }) {
  const compact = useMediaQuery(TABLET_QUERY);
  const cols = editable ? COLS_EDIT : COLS_VIEW;

  const update = (index, key, value) =>
    onChange(others.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  const remove = (index) => onChange(others.filter((_, i) => i !== index));

  // 入力欄の幅（タブレット・スマホは列の幅いっぱい）
  const qtyClass = compact ? "input-full" : "input-qty";
  const priceClass = compact ? "input-full" : "input-price";

  return (
    <div className={compact ? "survey-building" : "table-container"}>
      <table className={compact ? "compact-table" : "data-table detail-grid"}>
        {compact && (
          <colgroup>
            {cols.map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            <th className="align-left">項目名</th>
            <th className="align-center">毎回変動</th>
            <th className="align-right">単価</th>
            <th className="align-right">数量</th>
            <th className="align-right">金額</th>
            {editable && <th className="align-center">{compact ? "" : "操作"}</th>}
          </tr>
        </thead>
        <tbody>
          {others.length === 0 ? (
            <tr>
              <td colSpan={editable ? 6 : 5} className="align-center">
                その他項目はありません。
              </td>
            </tr>
          ) : (
            others.map((row, index) => (
              <tr
                key={row.baseOtherItemId ?? `other-${index}`}
                className={row.isVariable ? "row-variable" : undefined}
              >
                <td className="align-left">
                  {editable ? (
                    <input
                      value={row.feeName ?? ""}
                      maxLength={50}
                      list="base-other-list"
                      className="input-full"
                      onChange={(e) => update(index, "feeName", e.target.value)}
                    />
                  ) : (
                    row.feeName
                  )}
                </td>
                <td className="align-center">
                  {editable ? (
                    <input
                      type="checkbox"
                      checked={Boolean(row.isVariable)}
                      onChange={(e) => update(index, "isVariable", e.target.checked ? 1 : 0)}
                    />
                  ) : row.isVariable ? (
                    "○"
                  ) : (
                    ""
                  )}
                </td>
                <td className="align-right">
                  {row.isVariable ? (
                    "実費"
                  ) : editable ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.defaultUnitPrice ?? ""}
                      className={priceClass}
                      onChange={(e) => update(index, "defaultUnitPrice", e.target.value)}
                    />
                  ) : (
                    yen(row.defaultUnitPrice)
                  )}
                </td>
                <td className="align-right">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.defaultQuantity ?? ""}
                      className={qtyClass}
                      onChange={(e) => update(index, "defaultQuantity", e.target.value)}
                    />
                  ) : (
                    row.defaultQuantity
                  )}
                </td>
                <td className="align-right">
                  {row.isVariable
                    ? "実費"
                    : yen(Number(row.defaultQuantity || 0) * Number(row.defaultUnitPrice || 0))}
                </td>
                {editable && (
                  <td className="align-center">
                    <Button variant="danger" className="btn-sm" onClick={() => remove(index)}>
                      削除
                    </Button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
