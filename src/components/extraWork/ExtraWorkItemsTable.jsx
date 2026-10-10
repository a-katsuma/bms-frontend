import Button from "../../atoms/Button";
import { yen } from "../../utils/baseUtils";
import { presentedAmount } from "../../utils/statementUtils";
import { extraItemAmount, newExtraWorkItem } from "../../utils/extraWorkUtils";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";

// タブレット・スマホの列の幅（%）。文字を小さくして、この比率を保つ
// 1段目：作業内容｜数量｜単位｜当社単価｜（削除）
// 2段目：当社→業者 → 業者→顧客（税別）
const COLS = [38, 14, 14, 20, 14];

/**
 * 緊急・追加作業の行（作業内容・数量・単位・当社単価）。常に編集できる状態で表示する
 *   作業内容は itemName（DB は item_name）。入力候補は常用項目の「項目」（機器の名前）
 * @param markupRate 実施日の時点の加算割合（承認なしは null。業者→顧客の額は出さない）
 */
export default function ExtraWorkItemsTable({ items, markupRate, onChange }) {
  const compact = useMediaQuery(TABLET_QUERY);

  const update = (index, key, value) =>
    onChange(items.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, newExtraWorkItem()]);

  // 入力欄（幅は className：input-full／input-qty／input-unit／input-price）
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

  const presentedText = (amount) => {
    const presented = presentedAmount(amount, markupRate);
    return presented == null ? "-" : yen(presented);
  };

  // 1行は必ず残す
  const deleteButton = (index) => (
    <Button
      variant="danger"
      className="btn-sm"
      onClick={() => remove(index)}
      disabled={items.length <= 1}
    >
      削除
    </Button>
  );

  const keyOfRow = (row) => row.extraWorkItemId ?? row._key;

  // タブレット・スマホ：枠つきの小さな表（1行を2段）
  const compactTable = (
    <div className="survey-building">
      <table className="compact-table">
        <colgroup>
          {COLS.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>作業内容</th>
            <th className="num">数量</th>
            <th>単位</th>
            <th className="num">当社単価</th>
            <th />
          </tr>
        </thead>
        {items.map((row, index) => {
          const amount = extraItemAmount(row);
          return (
            <tbody key={keyOfRow(row)} className="base-entry">
              <tr>
                <td>
                  {input(row, index, "itemName", {
                    maxLength: 100,
                    list: "survey-item-list",
                  })}
                </td>
                <td className="num">
                  {input(row, index, "quantity", { type: "number", min: 1 })}
                </td>
                <td>
                  {input(row, index, "unit", {
                    maxLength: 20,
                    list: "survey-unit-list",
                  })}
                </td>
                <td className="num">
                  {input(row, index, "unitPrice", {
                    type: "number",
                    min: 0,
                    step: 1,
                  })}
                </td>
                <td className="center">{deleteButton(index)}</td>
              </tr>
              <tr className="base-sub-row">
                <td colSpan={COLS.length}>
                  <div className="base-sub">
                    <span className="base-sub-field">
                      <span className="base-sub-label">当社→発注元</span>
                      {yen(amount)}
                    </span>
                    <span className="base-sub-field">
                      <span className="base-sub-label">発注元→顧客（税別）</span>
                      {presentedText(amount)}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );

  // PC：1枚の表
  const pcTable = (
    <div className="table-container">
      <table className="data-table detail-grid">
        <thead>
          <tr>
            <th className="align-left">作業内容</th>
            <th className="align-right">数量</th>
            <th className="align-left">単位</th>
            <th className="align-right">当社単価</th>
            <th className="align-right">当社→発注元</th>
            <th className="align-right">発注元→顧客（税別）</th>
            <th className="align-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => {
            const amount = extraItemAmount(row);
            return (
              <tr key={keyOfRow(row)}>
                <td className="align-left">
                  {input(row, index, "itemName", {
                    maxLength: 100,
                    list: "survey-item-list",
                  })}
                </td>
                <td className="align-right">
                  {input(row, index, "quantity", {
                    type: "number",
                    min: 1,
                    className: "input-qty",
                  })}
                </td>
                <td className="align-left">
                  {input(row, index, "unit", {
                    maxLength: 20,
                    list: "survey-unit-list",
                    className: "input-unit",
                  })}
                </td>
                <td className="align-right">
                  {input(row, index, "unitPrice", {
                    type: "number",
                    min: 0,
                    step: 1,
                    className: "input-price",
                  })}
                </td>
                <td className="align-right">{yen(amount)}</td>
                <td className="align-right">{presentedText(amount)}</td>
                <td className="align-center">{deleteButton(index)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {compact ? compactTable : pcTable}
      <div className="mt-10">
        <Button onClick={add}>行を追加</Button>
      </div>
    </>
  );
}
