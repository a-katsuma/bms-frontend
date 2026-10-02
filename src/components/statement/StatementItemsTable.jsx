import { yen, groupByBuilding } from "../../utils/baseUtils";
import { statementTargetOf, itemAmount } from "../../utils/statementUtils";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";

// タブレット・スマホの列の幅（%）。文字を小さくして、この比率を保つ
// 1段目：項目｜数量｜単位｜対象外数｜調整数（−）｜今回対象数｜単価｜金額
// 2段目：理由・調整理由（閲覧中は、どちらもない行には出さない）
const COLS = [22, 9, 8, 10, 11, 10, 14, 16];

/**
 * 毎次明細の明細行（PC は棟をまとめた1枚の表、タブレット・スマホは棟ごとのカード）
 * editable のときは調整数・調整理由だけ入力できる
 */
export default function StatementItemsTable({
  items,
  editable = false,
  onChange,
}) {
  const compact = useMediaQuery(TABLET_QUERY);

  const update = (index, key, value) =>
    onChange(items.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  const groups = groupByBuilding(items.map((row, index) => ({ row, index })));

  const isAdjusted = (row) => Number(row.adjustmentQuantity || 0) < 0;

  // 調整数（範囲は -(数量−対象外数)〜0）。幅は className：input-qty／input-full
  const adjustmentInput = (row, index, className) => {
    const max =
      Number(row.baseQuantity || 0) - Number(row.excludedQuantity || 0);
    return (
      <input
        type="number"
        min={-max}
        max={0}
        placeholder="例：-2"
        title={`今回実施しなかった数をマイナスで入力（-${max}〜0）`}
        value={row.adjustmentQuantity ?? ""}
        className={className}
        onChange={(e) => update(index, "adjustmentQuantity", e.target.value)}
      />
    );
  };

  const reasonInput = (row, index) => (
    <input
      value={row.adjustmentReason ?? ""}
      maxLength={255}
      placeholder={isAdjusted(row) ? "任意" : ""}
      disabled={!isAdjusted(row)}
      className="input-full"
      onChange={(e) => update(index, "adjustmentReason", e.target.value)}
    />
  );

  // タブレット・スマホ：棟ごとのカード → 小さな表（1行を2段）
  if (compact) {
    if (items.length === 0) {
      return <div className="survey-empty">明細がありません。</div>;
    }
    return (
      <div className="survey-cards">
        {groups.map(({ building, entries }) => (
          <section key={building} className="survey-building">
            <div className="survey-building-head">
              <strong className="survey-building-name">{building}</strong>
            </div>

            <table className="compact-table">
              <colgroup>
                {COLS.map((w, i) => (
                  <col key={i} style={{ width: `${w}%` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th>項目</th>
                  <th className="num">数量</th>
                  <th>単位</th>
                  <th className="num">対象外数</th>
                  <th className="num">調整数（−）</th>
                  <th className="num">今回対象数</th>
                  <th className="num">単価</th>
                  <th className="num">金額</th>
                </tr>
              </thead>

              {entries.map(({ row, index }) => {
                const showSub =
                  editable ||
                  Boolean(row.excludedReason) ||
                  Boolean(row.adjustmentReason);
                return (
                  <tbody
                    key={row.statementItemId}
                    className={`base-entry${isAdjusted(row) ? " row-adjusted" : ""}`}
                  >
                    <tr>
                      <td>{row.itemName}</td>
                      <td className="num">{row.baseQuantity}</td>
                      <td>{row.unit}</td>
                      <td className="num">{row.excludedQuantity || ""}</td>
                      <td className="num">
                        {editable
                          ? adjustmentInput(row, index, "input-full")
                          : isAdjusted(row)
                            ? row.adjustmentQuantity
                            : ""}
                      </td>
                      <td className="num">
                        <strong>{statementTargetOf(row)}</strong>
                      </td>
                      <td className="num">{yen(row.unitPrice)}</td>
                      <td className="num">{yen(itemAmount(row))}</td>
                    </tr>

                    {showSub && (
                      <tr className="base-sub-row">
                        <td colSpan={COLS.length}>
                          <div className="base-sub">
                            {row.excludedReason && (
                              <span className="base-sub-field">
                                <span className="base-sub-label">理由</span>
                                {row.excludedReason}
                              </span>
                            )}
                            {(editable || row.adjustmentReason) && (
                              <span className="base-sub-reason">
                                <span className="base-sub-label">調整理由</span>
                                {editable
                                  ? reasonInput(row, index)
                                  : row.adjustmentReason}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
            </table>
          </section>
        ))}
      </div>
    );
  }

  // PC：棟を結合した1枚の表
  return (
    <div className="table-container">
      <table className="data-table detail-grid">
        <thead>
          <tr>
            <th className="align-left">棟</th>
            <th className="align-left">項目</th>
            <th className="align-right">数量</th>
            <th className="align-left">単位</th>
            <th className="align-right">対象外数</th>
            <th className="align-left">理由</th>
            <th className="align-right">調整数（−）</th>
            <th className="align-left">調整理由</th>
            <th className="align-right">今回対象数</th>
            <th className="align-right">単価</th>
            <th className="align-right">金額</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={11} className="align-center">
                明細がありません。
              </td>
            </tr>
          ) : (
            groups.map(({ building, entries }) =>
              entries.map(({ row, index }, i) => (
                <tr
                  key={row.statementItemId}
                  className={isAdjusted(row) ? "row-adjusted" : undefined}
                >
                  {i === 0 && (
                    <td rowSpan={entries.length} className="group-cell">
                      <strong>{building}</strong>
                    </td>
                  )}
                  <td className="align-left">{row.itemName}</td>
                  <td className="align-right">{row.baseQuantity}</td>
                  <td className="align-left">{row.unit}</td>
                  <td className="align-right">{row.excludedQuantity || ""}</td>
                  <td className="align-left">{row.excludedReason}</td>
                  <td className="align-right">
                    {editable
                      ? adjustmentInput(row, index, "input-qty")
                      : isAdjusted(row)
                        ? row.adjustmentQuantity
                        : ""}
                  </td>
                  <td className="align-left">
                    {editable ? reasonInput(row, index) : row.adjustmentReason}
                  </td>
                  <td className="align-right">
                    <strong>{statementTargetOf(row)}</strong>
                  </td>
                  <td className="align-right">{yen(row.unitPrice)}</td>
                  <td className="align-right">{yen(itemAmount(row))}</td>
                </tr>
              )),
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
