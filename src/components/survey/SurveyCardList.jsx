import Button from "../../atoms/Button";
import { groupByBuildingFloor, targetQuantity } from "../../utils/surveyUtils";

// 列の幅（%）。画面が狭いときは文字を小さくして、この比率を保つ
// 項目｜数量｜単位｜対象外数｜内容｜対象数｜発注状況｜（削除）
const COLS_EDIT = [24, 9, 8, 9, 20, 9, 7, 14];
const COLS_VIEW = [26, 10, 9, 11, 20, 11, 13];

// 現況確認表のタブレット・スマホ表示（棟ごとのカード → 階ごとの小さな表）
// 操作（actions）と入力欄（input）は SurveyTable から受け取る
export default function SurveyCardList({ items, editable, input, actions }) {
  if (items.length === 0) {
    return <div className="survey-empty">項目がありません。</div>;
  }

  const cols = editable ? COLS_EDIT : COLS_VIEW;

  return (
    <div className="survey-cards">
      {groupByBuildingFloor(items).map(({ building, floors }) => (
        <section key={building} className="survey-building">
          <div className="survey-building-head">
            <strong className="survey-building-name">{building}</strong>
            {editable && (
              <div className="btn-row-sm">
                <Button className="btn-sm" onClick={() => actions.addFloor(building)}>
                  階追加
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

          {floors.map(({ floorLabel, rows }) => (
            <div key={floorLabel} className="survey-floor">
              <div className="survey-floor-side">
                <strong className="survey-floor-name">{floorLabel}</strong>
                {editable && (
                  <div className="survey-floor-actions">
                    <Button
                      className="btn-sm"
                      onClick={() => actions.addItemToFloor(building, floorLabel)}
                    >
                      項目追加
                    </Button>
                    <Button
                      className="btn-sm"
                      onClick={() => actions.renameFloor(building, floorLabel)}
                    >
                      名称変更
                    </Button>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => actions.removeFloor(building, floorLabel)}
                    >
                      削除
                    </Button>
                  </div>
                )}
              </div>

              <div className="survey-floor-body">
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
                      <th>内容</th>
                      <th className="num">対象数</th>
                      <th className="center">{editable ? "" : "発注状況"}</th>
                      {editable && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ row, index }) => (
                      <tr key={row.surveyItemId ?? row._key}>
                        <td>
                          {editable
                            ? input(row, index, "itemName", {
                                maxLength: 100,
                                list: "survey-item-list",
                              })
                            : row.itemName}
                        </td>
                        <td className="num">
                          {editable
                            ? input(row, index, "quantity", { type: "number", min: 0 })
                            : row.quantity}
                        </td>
                        <td>
                          {editable
                            ? input(row, index, "unit", {
                                maxLength: 20,
                                list: "survey-unit-list",
                              })
                            : row.unit}
                        </td>
                        <td className="num">
                          {editable
                            ? input(row, index, "excludedQuantity", {
                                type: "number",
                                min: 0,
                                max: row.quantity,
                              })
                            : row.excludedQuantity || ""}
                        </td>
                        <td>
                          {editable
                            ? input(row, index, "excludedReason", { maxLength: 255 })
                            : row.excludedReason}
                        </td>
                        <td className="num">{targetQuantity(row)}</td>
                        <td className="center">
                          <span
                            className={`order-status${row.orderStatus === "済" ? "" : " is-pending"}`}
                          >
                            {row.orderStatus === "済" ? "済" : "未"}
                          </span>
                        </td>
                        {editable && (
                          <td className="center">
                            <Button
                              variant="danger"
                              className="btn-sm"
                              onClick={() => actions.removeRow(index)}
                            >
                              削除
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
