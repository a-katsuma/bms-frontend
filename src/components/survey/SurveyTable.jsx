import Button from "../../atoms/Button";
import {
  newRow,
  groupItems,
  withRowSpans,
  targetQuantity,
} from "../../utils/surveyUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";
import SurveyCardList from "./SurveyCardList";
import { useMessage } from "../../hooks/useMessage";

export default function SurveyTable({
  items,
  editable,
  itemMasters = [],
  onChange,
}) {
  const { confirm, prompt } = useDialog();
  const { showError } = useMessage();

  const compact = useMediaQuery(TABLET_QUERY); // タブレット・スマホはカード表示

  // --- 行（項目）の操作 ---
  const updateRow = (index, key, value) => {
    const target = items[index];
    onChange(
      items.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [key]: value };
        // 常用項目の項目を選んだら、単位が空なら既定の単位を入れる
        if (key === "itemName" && !row.unit) {
          const master = itemMasters.find((m) => m.name === value);
          if (master?.defaultUnit) updated.unit = master.defaultUnit;
        }
        return updated;
      }),
      // 同じセルへの連続入力は「戻る」1回分にまとめる
      `${target.surveyItemId ?? target._key}:${key}`,
    );
  };

  const removeRow = (index) => onChange(items.filter((_, i) => i !== index));

  const insertAfter = (index, row) =>
    onChange([...items.slice(0, index + 1), row, ...items.slice(index + 1)]);

  const lastIndexOf = (predicate) => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (predicate(items[i])) return i;
    }
    return -1;
  };

  // --- 階の操作 ---
  const addItemToFloor = (building, floorLabel) => {
    const last = lastIndexOf(
      (r) => r.building === building && r.floorLabel === floorLabel,
    );
    insertAfter(last, newRow({ building, floorLabel }));
  };

  const addFloor = async (building) => {
    const floorLabel = (
      await prompt(
        `${building} に追加する階名を入力してください（例：4F、B2F、RF）`,
        "",
        {
          title: "階の追加",
          okLabel: "追加",
          maxLength: 20,
        },
      )
    )?.trim();
    if (!floorLabel) return;
    if (
      items.some((r) => r.building === building && r.floorLabel === floorLabel)
    ) {
      showError(`${building} ${floorLabel} は既にあります。`);
      return;
    }
    const last = lastIndexOf((r) => r.building === building);
    insertAfter(last, newRow({ building, floorLabel }));
  };

  const renameFloor = async (building, floorLabel) => {
    const next = (
      await prompt("新しい階名を入力してください", floorLabel, {
        title: `${building} ${floorLabel} の名称変更`,
        okLabel: "変更",
        maxLength: 20,
      })
    )?.trim();
    if (!next || next === floorLabel) return;
    onChange(
      groupItems(
        items.map((r) =>
          r.building === building && r.floorLabel === floorLabel
            ? { ...r, floorLabel: next }
            : r,
        ),
      ),
    );
  };

  const removeFloor = async (building, floorLabel) => {
    const ok = await confirm(
      `${building} ${floorLabel} の項目をすべて削除しますか？`,
      {
        title: "階の削除",
        okLabel: "削除",
        danger: true,
      },
    );
    if (!ok) return;
    onChange(
      items.filter(
        (r) => !(r.building === building && r.floorLabel === floorLabel),
      ),
    );
  };

  // --- 棟の操作 ---
  const renameBuilding = async (building) => {
    const next = (
      await prompt("新しい棟名を入力してください", building, {
        title: `${building} の名称変更`,
        okLabel: "変更",
        maxLength: 50,
      })
    )?.trim();
    if (!next || next === building) return;
    onChange(
      groupItems(
        items.map((r) =>
          r.building === building ? { ...r, building: next } : r,
        ),
      ),
    );
  };

  const removeBuilding = async (building) => {
    const ok = await confirm(`${building} の項目をすべて削除しますか？`, {
      title: "棟の削除",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;
    onChange(items.filter((r) => r.building !== building));
  };

  // --- 表示 ---
  // 入力欄（幅いっぱい。数値は右寄せ：input-full）※ SurveyCardList でも使う
  const input = (row, index, key, props = {}) => (
    <input
      value={row[key] ?? ""}
      onChange={(e) => updateRow(index, key, e.target.value)}
      className="input-full"
      {...props}
    />
  );

  const orderStatus = (row) => (
    <span
      className={`order-status${row.orderStatus === "済" ? "" : " is-pending"}`}
    >
      {row.orderStatus === "済" ? "済" : "未"}
    </span>
  );

  // タブレット・スマホ：棟ごとのカード → 階ごとの小さな表
  if (compact) {
    return (
      <SurveyCardList
        items={items}
        editable={editable}
        input={input}
        actions={{
          addFloor,
          renameBuilding,
          removeBuilding,
          addItemToFloor,
          renameFloor,
          removeFloor,
          removeRow,
        }}
      />
    );
  }

  // PC：棟・階を結合した1枚の表
  const colCount = editable ? 10 : 9;

  return (
    <div className="table-container">
      	<table className="data-table detail-grid">
        <thead>
          <tr>
            <th className="align-left">棟</th>
            <th className="align-left">階</th>
            <th className="align-left">項目</th>
            <th className="align-right">数量</th>
            <th className="align-left">単位</th>
            <th className="align-right">対象外数</th>
            <th className="align-left">理由</th>
            <th className="align-right">対象数</th>
            <th className="align-center">発注状況</th>
            {editable && <th className="align-center">操作</th>}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="align-center">
                項目がありません。
              </td>
            </tr>
          ) : (
            withRowSpans(items).map(
              ({ row, index, buildingSpan, floorSpan }) => (
                <tr key={row.surveyItemId ?? row._key}>
                  {buildingSpan > 0 && (
                    <td rowSpan={buildingSpan} className="group-cell">
                      <strong>{row.building}</strong>
                      {editable && (
                        <div className="btn-row-sm">
                          <Button
                            className="btn-sm"
                            onClick={() => addFloor(row.building)}
                          >
                            階追加
                          </Button>
                          <Button
                            className="btn-sm"
                            onClick={() => renameBuilding(row.building)}
                          >
                            名称変更
                          </Button>
                          <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() => removeBuilding(row.building)}
                          >
                            削除
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                  {floorSpan > 0 && (
                    <td rowSpan={floorSpan} className="group-cell">
                      {row.floorLabel}
                      {editable && (
                        <div className="btn-row-sm">
                          <Button
                            className="btn-sm"
                            onClick={() =>
                              addItemToFloor(row.building, row.floorLabel)
                            }
                          >
                            項目追加
                          </Button>
                          <Button
                            className="btn-sm"
                            onClick={() =>
                              renameFloor(row.building, row.floorLabel)
                            }
                          >
                            名称変更
                          </Button>
                          <Button
                            variant="danger"
                            className="btn-sm"
                            onClick={() =>
                              removeFloor(row.building, row.floorLabel)
                            }
                          >
                            削除
                          </Button>
                        </div>
                      )}
                    </td>
                  )}

                  <td className="align-left">
                    {editable
                      ? input(row, index, "itemName", {
                          maxLength: 100,
                          list: "survey-item-list",
                        })
                      : row.itemName}
                  </td>
                  <td className="align-right">
                    {editable
                      ? input(row, index, "quantity", {
                          type: "number",
                          min: 0,
                        })
                      : row.quantity}
                  </td>
                  <td className="align-left">
                    {editable
                      ? input(row, index, "unit", {
                          maxLength: 20,
                          list: "survey-unit-list",
                        })
                      : row.unit}
                  </td>
                  <td className="align-right">
                    {editable
                      ? input(row, index, "excludedQuantity", {
                          type: "number",
                          min: 0,
                          max: row.quantity,
                        })
                      : row.excludedQuantity || ""}
                  </td>
                  <td className="align-left">
                    {editable
                      ? input(row, index, "excludedReason", { maxLength: 255 })
                      : row.excludedReason}
                  </td>
                  <td className="align-right">{targetQuantity(row)}</td>
                  <td className="align-center">{orderStatus(row)}</td>
                  {editable && (
                    <td className="align-center">
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => removeRow(index)}
                      >
                        削除
                      </Button>
                    </td>
                  )}
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
