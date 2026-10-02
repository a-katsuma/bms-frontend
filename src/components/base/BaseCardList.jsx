import Button from "../../atoms/Button";
import { keyOf, targetOf, yen } from "../../utils/baseUtils";

// 列の幅（%）。画面が狭いときは文字を小さくして、この比率を保つ
// 1段目：項目｜数量｜単位｜対象外数｜対象数｜単価｜金額｜（削除）
// 2段目：理由・現況との差（閲覧中は、理由も差もない行には出さない）
const COLS_EDIT = [24, 10, 9, 10, 9, 14, 14, 10];
const COLS_VIEW = [26, 10, 9, 10, 10, 17, 18];

// ベース明細のタブレット・スマホ表示（棟ごとのカード → 小さな表）
// 入力欄（input）・現況の表示（surveyCell／missingCell）・操作（actions）は BaseItemsTable から受け取る
export default function BaseCardList({
  groups,
  editable,
  input,
  surveyCell,
  missingCell,
  actions,
}) {
  if (groups.length === 0) {
    return <div className="survey-empty">明細がありません。</div>;
  }

  const cols = editable ? COLS_EDIT : COLS_VIEW;

  return (
    <div className="survey-cards">
      {groups.map(({ building, entries }) => (
        <section key={building} className="survey-building">
          <div className="survey-building-head">
            <strong className="survey-building-name">{building}</strong>
            {editable && entries.some((e) => !e.missing) && (
              <div className="btn-row-sm">
                <Button className="btn-sm" onClick={() => actions.addRow(building)}>
                  行追加
                </Button>
                <Button className="btn-sm" onClick={() => actions.renameBuilding(building)}>
                  名称変更
                </Button>
                <Button
                  variant="danger"
                  className="btn-sm"
                  onClick={() => actions.removeBuilding(building)}
                >
                  削除
                </Button>
              </div>
            )}
          </div>

          <table className="compact-table">
            <colgroup>
              {cols.map((w, i) => (
                <col key={i} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>項目</th>
                <th className="num">数量</th>
                <th>単位</th>
                <th className="num">対象外数</th>
                <th className="num">対象数</th>
                <th className="num">単価</th>
                <th className="num">金額</th>
                {editable && <th />}
              </tr>
            </thead>

            {/* 1件ごとに tbody を分けて、2段を1つのまとまりにする */}
            {entries.map(({ row, index, missing, diff }) => {
              const inputtable = editable && !missing;
              const showReason = inputtable || Boolean(row.excludedReason);
              return (
                <tbody
                  key={missing ? `missing-${keyOf(row)}` : (row.baseItemId ?? `row-${index}`)}
                  className={`base-entry${diff ? " row-diff" : ""}`}
                >
                  <tr>
                    <td>
                      {inputtable
                        ? input(row, index, "itemName", {
                            maxLength: 100,
                            list: "survey-item-list",
                          })
                        : row.itemName}
                    </td>
                    <td className="num">
                      {inputtable
                        ? input(row, index, "baseQuantity", { type: "number", min: 0 })
                        : row.baseQuantity}
                    </td>
                    <td>
                      {inputtable
                        ? input(row, index, "unit", {
                            maxLength: 20,
                            list: "survey-unit-list",
                          })
                        : row.unit}
                    </td>
                    <td className="num">
                      {inputtable
                        ? input(row, index, "excludedQuantity", { type: "number", min: 0 })
                        : row.excludedQuantity || ""}
                    </td>
                    <td className="num">{targetOf(row)}</td>
                    <td className="num">
                      {missing
                        ? "-"
                        : inputtable
                          ? input(row, index, "unitPrice", { type: "number", min: 0, step: 1 })
                          : yen(row.unitPrice)}
                    </td>
                    <td className="num">
                      {missing ? "-" : yen(targetOf(row) * Number(row.unitPrice || 0))}
                    </td>
                    {editable && (
                      <td className="center">
                        {!missing && (
                          <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() => actions.remove(index)}
                          >
                            削除
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>

                  {(showReason || diff) && (
                    <tr className="base-sub-row">
                      <td colSpan={cols.length}>
                        <div className="base-sub">
                          {showReason && (
                            <span className="base-sub-reason">
                              <span className="base-sub-label">理由</span>
                              {inputtable
                                ? input(row, index, "excludedReason", { maxLength: 255 })
                                : row.excludedReason}
                            </span>
                          )}
                          {diff && (
                            <span>{missing ? missingCell(row) : surveyCell(row, index)}</span>
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
