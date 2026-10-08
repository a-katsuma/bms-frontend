import Button from "../../atoms/Button";
import {
  keyOf,
  targetOf,
  yen,
  diffOf,
  missingRows,
  newBaseItem,
  groupByBuilding,
} from "../../utils/baseUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";
import BaseCardList from "./BaseCardList";

const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

/**
 * ベース明細の表（PC は棟をまとめた1枚の表、タブレット・スマホは棟ごとのカード）
 * @param preview 現況確認表の集計（渡すと「現況」列と差分の赤表示が出る／管理者のみ）
 * @param otherItems ほかの使用中のベースの行（そこにある行は「ベース明細未登録」に出さない）
 */
export default function BaseItemsTable({
  items,
  editable = false,
  preview = null,
  otherItems = [],
  onChange,
}) {
  const { confirm, prompt } = useDialog();
  const { showError } = useMessage();
  const compact = useMediaQuery(TABLET_QUERY); // タブレット・スマホはカード表示

  const showSurvey = Boolean(preview);
  const surveyMap = new Map((preview ?? []).map((p) => [keyOf(p), p]));
  const missing = showSurvey ? missingRows(items, preview, otherItems) : [];
  const colCount = 9 + (showSurvey ? 1 : 0) + (editable ? 1 : 0);

  // 表示する行（ベース明細の行＋現況確認表にだけある行）を棟ごとにまとめる
  const groups = groupByBuilding([
    ...items.map((row, index) => ({
      row,
      index,
      missing: false,
      diff: showSurvey ? diffOf(row, surveyMap) : null,
    })),
    ...missing.map((row) => ({
      row,
      index: -1,
      missing: true,
      diff: { type: "NOT_IN_BASE" },
    })),
  ]);

  // ベース明細の行がある棟か（現況確認表にだけある棟は、棟の操作を出さない）
  const hasRows = (entries) => entries.some((e) => !e.missing);

  // --- 行の操作 ---
  const update = (index, key, value) =>
    onChange(items.map((r, i) => (i === index ? { ...r, [key]: value } : r)));

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const reflect = (index, s) =>
    onChange(
      items.map((r, i) =>
        i === index
          ? {
              ...r,
              baseQuantity: s.baseQuantity,
              excludedQuantity: s.excludedQuantity,
              excludedReason: s.excludedReason ?? "",
            }
          : r,
      ),
    );

  const addMissing = (s) => onChange([...items, { ...s, unitPrice: "" }]);

  // --- 棟の操作 ---
  // 棟の最後の行の後ろに、空の行を追加する
  const addRow = (building) => {
    let last = -1;
    items.forEach((r, i) => {
      if (r.building === building) last = i;
    });
    const at = last < 0 ? items.length : last + 1;
    onChange([
      ...items.slice(0, at),
      newBaseItem(building),
      ...items.slice(at),
    ]);
  };

  const renameBuilding = async (building) => {
    const next = (
      await prompt("新しい棟名を入力してください", building, {
        title: `${building} の名称変更`,
        okLabel: "変更",
        maxLength: 50,
      })
    )?.trim();
    if (!next || next === building) return;
    // 棟＋項目＋単位が重なると、現況との照合ができなくなるので止める
    if (items.some((r) => r.building === next)) {
      showError(`「${next}」は既にあります。`);
      return;
    }
    onChange(
      items.map((r) =>
        r.building === building ? { ...r, building: next } : r,
      ),
    );
  };

  const removeBuilding = async (building) => {
    const ok = await confirm(`${building} の行をすべて削除しますか？`, {
      title: "棟の削除",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;
    onChange(items.filter((r) => r.building !== building));
  };

  // --- 表示 ---
  // 入力欄（幅は className で指定：input-full／input-qty／input-unit／input-price）
  const input = (row, index, key, props = {}) => {
    const { className = "input-full", ...rest } = props;
    return (
      <input
        value={row[key] ?? ""}
        onChange={(e) => update(index, key, e.target.value)}
        className={className}
        {...rest}
      />
    );
  };

  const surveyCell = (row, index) => {
    const diff = diffOf(row, surveyMap);
    if (!diff) return <span className="text-muted">一致</span>;
    if (diff.type === "NOT_IN_SURVEY")
      return <span className="text-danger">現況になし</span>;

    const s = diff.survey;
    const qtyDiff = Number(s.baseQuantity) - Number(row.baseQuantity || 0);
    const exDiff =
      Number(s.excludedQuantity) - Number(row.excludedQuantity || 0);
    return (
      <span className="text-danger">
        現況 {s.baseQuantity}
        {qtyDiff !== 0 && `（${signed(qtyDiff)}）`}
        {exDiff !== 0 &&
          ` ／ 対象外 ${s.excludedQuantity}（${signed(exDiff)}）`}
        {editable && (
          <Button
            className="btn-sm btn-inline"
            onClick={() => reflect(index, s)}
          >
            反映
          </Button>
        )}
      </span>
    );
  };

  // 現況確認表にあってベース明細にない行
  const missingCell = (s) => (
    <>
      <span className="text-danger">ベース明細未登録</span>
      {editable && (
        <Button className="btn-sm btn-inline" onClick={() => addMissing(s)}>
          追加
        </Button>
      )}
    </>
  );

  // タブレット・スマホ：棟ごとのカード → 小さな表（1行を2段）
  if (compact) {
    return (
      <BaseCardList
        groups={groups}
        editable={editable}
        input={input}
        surveyCell={surveyCell}
        missingCell={missingCell}
        actions={{ addRow, renameBuilding, removeBuilding, remove }}
      />
    );
  }

  // PC：棟を結合した1枚の表
  const buildingButtons = (building) => (
    <div className="btn-row-sm">
      <Button className="btn-sm" onClick={() => addRow(building)}>
        行追加
      </Button>
      <Button className="btn-sm" onClick={() => renameBuilding(building)}>
        名称変更
      </Button>
      <Button
        variant="danger"
        className="btn-sm"
        onClick={() => removeBuilding(building)}
      >
        削除
      </Button>
    </div>
  );

  const itemCells = (row, index) => (
    <>
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
          ? input(row, index, "baseQuantity", {
              type: "number",
              min: 0,
              className: "input-qty",
            })
          : row.baseQuantity}
      </td>
      <td className="align-left">
        {editable
          ? input(row, index, "unit", {
              maxLength: 20,
              list: "survey-unit-list",
              className: "input-unit",
            })
          : row.unit}
      </td>
      <td className="align-right">
        {editable
          ? input(row, index, "excludedQuantity", {
              type: "number",
              min: 0,
              className: "input-qty",
            })
          : row.excludedQuantity || ""}
      </td>
      <td className="align-left">
        {editable
          ? input(row, index, "excludedReason", { maxLength: 255 })
          : row.excludedReason}
      </td>
      <td className="align-right">{targetOf(row)}</td>
      <td className="align-right">
        {editable
          ? input(row, index, "unitPrice", {
              type: "number",
              min: 0,
              step: 1,
              className: "input-price",
            })
          : yen(row.unitPrice)}
      </td>
      <td className="align-right">
        {yen(targetOf(row) * Number(row.unitPrice || 0))}
      </td>
      {showSurvey && <td className="align-left">{surveyCell(row, index)}</td>}
      {editable && (
        <td className="align-center">
          <Button
            variant="danger"
            className="btn-sm"
            onClick={() => remove(index)}
          >
            削除
          </Button>
        </td>
      )}
    </>
  );

  const missingCells = (s) => (
    <>
      <td className="align-left">{s.itemName}</td>
      <td className="align-right">{s.baseQuantity}</td>
      <td className="align-left">{s.unit}</td>
      <td className="align-right">{s.excludedQuantity || ""}</td>
      <td className="align-left">{s.excludedReason}</td>
      <td className="align-right">{targetOf(s)}</td>
      <td className="align-right">-</td>
      <td className="align-right">-</td>
      <td className="align-left">{missingCell(s)}</td>
      {editable && <td />}
    </>
  );

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
            <th className="align-right">対象数</th>
            <th className="align-right">単価</th>
            <th className="align-right">金額</th>
            {showSurvey && <th className="align-left">現況</th>}
            {editable && <th className="align-center">操作</th>}
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 && (
            <tr>
              <td colSpan={colCount} className="align-center">
                明細がありません。
              </td>
            </tr>
          )}

          {groups.map(({ building, entries }) =>
            entries.map(({ row, index, missing: isMissing, diff }, i) => (
              <tr
                key={
                  isMissing
                    ? `missing-${keyOf(row)}`
                    : (row.baseItemId ?? `row-${index}`)
                }
                className={diff ? "row-diff" : undefined}
              >
                {i === 0 && (
                  <td rowSpan={entries.length} className="group-cell">
                    <strong>{building}</strong>
                    {editable && hasRows(entries) && buildingButtons(building)}
                  </td>
                )}
                {isMissing ? missingCells(row) : itemCells(row, index)}
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}
