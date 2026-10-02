import Button from "../../atoms/Button";
import { yen } from "../../utils/baseUtils";
import {
  itemAmount,
  newTemporaryRow,
  temporaryRateOf,
  WORK_TYPES,
} from "../../utils/statementUtils";
import { useMediaQuery, TABLET_QUERY } from "../../hooks/useMediaQuery";
import { useDialog } from "../../hooks/useDialog";

// 区分ごとの文字の色
const TYPE_CLASS = {
  緊急: "text-danger",
  追加: "text-info",
};

// タブレット・スマホの列の幅（%）。文字を小さくして、この比率を保つ
// 1段目：作業内容｜数量｜単位｜単価｜金額｜（削除）
// 2段目：場所・依頼内容・区分・実施日
const COLS_EDIT = [30, 12, 10, 18, 18, 12];
const COLS_VIEW = [34, 12, 12, 20, 22];

/**
 * 緊急・追加作業の行（現況確認表・ベースには反映しない）
 * PC の列：場所｜作業内容｜数量｜単位｜依頼内容｜区分｜実施日｜単価｜金額（｜操作）
 *   作業内容は itemName、依頼内容は temporaryReason（DB は item_name・temporary_reason）。
 *   緊急・追加作業の画面の「作業内容」「依頼内容」と同じもの
 * 金額は当社→業者で、明細の合計に入る。業者→顧客の額は合計欄の下の参考の枠（PresentedReference）に出す
 * 受注済みの作業から取り込んだ行（extraWorkId あり）は直せない。削除は、その作業の行をまとめて行う
 * @param policies 事前承認の履歴（編集中に、実施日の時点で承認があるかを判定する）
 * @param onImport ［受注済みから取り込む］を押したとき（なければボタンを出さない）
 * @param importCount 取り込める作業の件数
 */
export default function TemporaryItemsTable({
  rows,
  editable = false,
  policies = [],
  onChange,
  onImport,
  importCount = 0,
}) {
  const compact = useMediaQuery(TABLET_QUERY);
  const { confirm } = useDialog();
  const cols = editable ? COLS_EDIT : COLS_VIEW;

  // 行ごとに入力できるか（取り込んだ行は直せない）
  const rowEditable = (row) => editable && row.extraWorkId == null;

  const update = (index, key, value) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  const add = () => onChange([...rows, newTemporaryRow()]);

  // 削除：取り込んだ行は、その作業の行をまとめて外す
  const remove = async (index) => {
    const row = rows[index];
    if (row.extraWorkId == null) {
      onChange(rows.filter((_, i) => i !== index));
      return;
    }
    const count = rows.filter((r) => r.extraWorkId === row.extraWorkId).length;
    const ok = await confirm(
      `受注済みの作業から取り込んだ行です。\nこの作業の ${count} 行をまとめて外しますか？（保存すると、作業は「未取り込み」に戻ります）`,
      { title: "取り込んだ作業を外す", okLabel: "外す", danger: true },
    );
    if (!ok) return;
    onChange(rows.filter((r) => r.extraWorkId !== row.extraWorkId));
  };

  // 入力欄（幅は className：input-full／input-date／input-short／input-qty／input-unit／input-price）
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

  const keyOfRow = (row) => row.statementItemId ?? row._key;

  // 区分（取り込んだ行には「受注済み」の印）
  const typeCell = (row, index) => (
    <>
      {rowEditable(row) ? (
        <select
          value={row.workType}
          onChange={(e) => update(index, "workType", e.target.value)}
        >
          <option value="">選択</option>
          {WORK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      ) : (
        <span className={TYPE_CLASS[row.workType]}>{row.workType}</span>
      )}
      {row.extraWorkId != null && <span className="tag-imported">受注済み</span>}
    </>
  );

  // 実施日（その日の時点で事前承認がなければ「承認なし」を添える）
  const workDateCell = (row, index) => (
    <>
      {rowEditable(row)
        ? input(row, index, "workDate", { type: "date", className: "input-date" })
        : row.workDate}
      {temporaryRateOf(row, editable, policies) == null && (
        <span className="text-danger ml-8 nowrap">承認なし</span>
      )}
    </>
  );

  const deleteButton = (index) => (
    <Button variant="danger" className="btn-sm" onClick={() => remove(index)}>
      削除
    </Button>
  );

  // タブレット・スマホ：枠つきの小さな表（1行を2段）
  const compactTable = (
    <div className="survey-building">
      <table className="compact-table">
        <colgroup>
          {cols.map((w, i) => (
            <col key={i} style={{ width: `${w}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>作業内容</th>
            <th className="num">数量</th>
            <th>単位</th>
            <th className="num">単価</th>
            <th className="num">金額</th>
            {editable && <th />}
          </tr>
        </thead>
        {rows.length === 0 ? (
          <tbody>
            <tr>
              <td colSpan={cols.length} className="center">
                緊急・追加作業はありません。
              </td>
            </tr>
          </tbody>
        ) : (
          rows.map((row, index) => {
            const ed = rowEditable(row);
            return (
              <tbody key={keyOfRow(row)} className="base-entry">
                <tr>
                  <td>
                    {ed
                      ? input(row, index, "itemName", { maxLength: 100 })
                      : row.itemName}
                  </td>
                  <td className="num">
                    {ed
                      ? input(row, index, "baseQuantity", { type: "number", min: 1 })
                      : row.baseQuantity}
                  </td>
                  <td>
                    {ed ? input(row, index, "unit", { maxLength: 20 }) : row.unit}
                  </td>
                  <td className="num">
                    {ed
                      ? input(row, index, "unitPrice", { type: "number", min: 0, step: 1 })
                      : yen(row.unitPrice)}
                  </td>
                  <td className="num">{yen(itemAmount(row))}</td>
                  {editable && <td className="center">{deleteButton(index)}</td>}
                </tr>
                <tr className="base-sub-row">
                  <td colSpan={cols.length}>
                    <div className="base-sub">
                      {(ed || row.building) && (
                        <span className="base-sub-field">
                          <span className="base-sub-label">場所</span>
                          {ed
                            ? input(row, index, "building", {
                                maxLength: 100,
                                className: "input-short",
                              })
                            : row.building}
                        </span>
                      )}
                      <span className="base-sub-reason">
                        <span className="base-sub-label">依頼内容</span>
                        {ed
                          ? input(row, index, "temporaryReason", {
                              maxLength: 255,
                              placeholder: "例：天井から漏水。応急処置をしてほしい",
                            })
                          : row.temporaryReason}
                      </span>
                      <span className="base-sub-field">
                        <span className="base-sub-label">区分</span>
                        {typeCell(row, index)}
                      </span>
                      <span className="base-sub-field">
                        <span className="base-sub-label">実施日</span>
                        {workDateCell(row, index)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            );
          })
        )}
      </table>
    </div>
  );

  // PC：1枚の表（ほかの表と同じく、右端は単価｜金額）
  const pcTable = (
    <div className="table-container">
      <table className="data-table detail-grid">
        <thead>
          <tr>
            <th className="align-left">場所</th>
            <th className="align-left">作業内容</th>
            <th className="align-right">数量</th>
            <th className="align-left">単位</th>
            <th className="align-left">依頼内容</th>
            <th className="align-center">区分</th>
            <th className="align-left">実施日</th>
            <th className="align-right">単価</th>
            <th className="align-right">金額</th>
            {editable && <th className="align-center">操作</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={editable ? 10 : 9} className="align-center">
                緊急・追加作業はありません。
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const ed = rowEditable(row);
              return (
                <tr key={keyOfRow(row)}>
                  <td className="align-left">
                    {ed
                      ? input(row, index, "building", {
                          maxLength: 100,
                          className: "input-short",
                        })
                      : row.building}
                  </td>
                  <td className="align-left">
                    {ed
                      ? input(row, index, "itemName", { maxLength: 100 })
                      : row.itemName}
                  </td>
                  <td className="align-right">
                    {ed
                      ? input(row, index, "baseQuantity", {
                          type: "number",
                          min: 1,
                          className: "input-qty",
                        })
                      : row.baseQuantity}
                  </td>
                  <td className="align-left">
                    {ed
                      ? input(row, index, "unit", {
                          maxLength: 20,
                          className: "input-unit",
                        })
                      : row.unit}
                  </td>
                  <td className="align-left">
                    {ed
                      ? input(row, index, "temporaryReason", {
                          maxLength: 255,
                          placeholder: "例：天井から漏水。応急処置をしてほしい",
                        })
                      : row.temporaryReason}
                  </td>
                  <td className="align-center">{typeCell(row, index)}</td>
                  <td className="align-left">{workDateCell(row, index)}</td>
                  <td className="align-right">
                    {ed
                      ? input(row, index, "unitPrice", {
                          type: "number",
                          min: 0,
                          step: 1,
                          className: "input-price",
                        })
                      : yen(row.unitPrice)}
                  </td>
                  <td className="align-right">{yen(itemAmount(row))}</td>
                  {editable && (
                    <td className="align-center">{deleteButton(index)}</td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      {compact ? compactTable : pcTable}
      {editable && (
        <div className="mt-10 flex-row">
          <Button onClick={add}>緊急・追加作業を追加</Button>
          {onImport && (
            <Button onClick={onImport} disabled={importCount === 0}>
              受注済みから取り込む（{importCount}件）
            </Button>
          )}
        </div>
      )}
    </>
  );
}
