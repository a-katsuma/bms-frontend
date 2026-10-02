import { diffVersions, targetOf, yen } from "../../utils/baseUtils";

// 区分ごとの文字の色・行の色
const TYPE_CLASS = {
  追加: "text-success",
  変更: "text-warning",
  削除: "text-danger",
};
const ROW_CLASS = {
  追加: "row-added",
  変更: "row-changed",
  削除: "row-removed",
};

// 列の幅（%）：区分｜種類｜棟｜項目｜内容
const COLS = [12, 12, 14, 22, 40];

const blank = (v) => (v === "" ? "（空）" : v);
const signedYen = (n) => (n > 0 ? `+${yen(n)}` : n < 0 ? `-${yen(-n)}` : "±0円");
const quoteText = (v) => (v.quoteId ? `ID ${v.quoteId}` : "指定なし");

// 棟と項目（その他項目は棟なし）
const itemLabel = (r) => ({ building: r.building, name: `${r.itemName}（${r.unit}）` });
const otherLabel = (o) => ({ building: "", name: o.feeName });

const itemDetail = (r) =>
  `数量 ${r.baseQuantity}` +
  (Number(r.excludedQuantity || 0) > 0 ? `（対象外 ${r.excludedQuantity}）` : "") +
  ` ／ 単価 ${yen(r.unitPrice)} ／ 金額 ${yen(targetOf(r) * Number(r.unitPrice || 0))}`;
const otherDetail = (o) =>
  o.isVariable
    ? "実費（毎回変動）"
    : `単価 ${yen(o.defaultUnitPrice)} × ${o.defaultQuantity} ／ 金額 ${yen(
        Number(o.defaultUnitPrice || 0) * Number(o.defaultQuantity || 0),
      )}`;

const fieldsDetail = (fields) =>
  fields.map((f) => (
    <div key={f.label}>
      {f.label}：<span className="text-old">{blank(f.before)}</span> →{" "}
      <strong>{blank(f.after)}</strong>
    </div>
  ));

// 種類（明細／その他）ごとに「追加・変更・削除」の行を作る
const toRows = (kind, diff, labelOf, detailOf) => [
  ...diff.added.map((r) => ({ type: "追加", kind, ...labelOf(r), detail: detailOf(r) })),
  ...diff.changed.map(({ row, fields }) => ({
    type: "変更",
    kind,
    ...labelOf(row),
    detail: fieldsDetail(fields),
  })),
  ...diff.removed.map((r) => ({
    type: "削除",
    kind,
    ...labelOf(r),
    detail: <span className="text-old">{detailOf(r)}</span>,
  })),
];

/**
 * 前の版からの変更（変更がなければ何も表示しない）
 * 現況確認表の「保存内容の確認」と同じ見た目（枠＋小さな表）
 * @param prev 前の版 / @param next 後の版
 */
export default function VersionDiff({ prev, next }) {
  const d = diffVersions(prev, next);
  if (d.count === 0) return null;

  const rows = [
    ...toRows("明細", d.items, itemLabel, itemDetail),
    ...toRows("その他", d.others, otherLabel, otherDetail),
  ];
  const totalDiff = d.nextTotal - d.prevTotal;

  return (
    <div className="confirm-panel mt-25">
      <h4 className="mt-0">第{prev.versionNo}版からの変更</h4>
      <div className="mb-10">
        <span className={TYPE_CLASS.追加}>
          追加 {d.items.added.length + d.others.added.length}件
        </span>{" "}
        ／{" "}
        <span className={TYPE_CLASS.変更}>
          変更 {d.items.changed.length + d.others.changed.length}件
        </span>{" "}
        ／{" "}
        <span className={TYPE_CLASS.削除}>
          削除 {d.items.removed.length + d.others.removed.length}件
        </span>
      </div>

      {rows.length > 0 && (
        <div className="table-container">
          <table className="compact-table">
            <colgroup>
              {COLS.map((w, i) => (
                <col key={i} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="align-center">区分</th>
                <th className="align-center">種類</th>
                <th className="align-left">棟</th>
                <th className="align-left">項目</th>
                <th className="align-left">内容</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ type, kind, building, name, detail }) => (
                <tr
                  key={`${type}-${kind}-${building}-${name}`}
                  className={ROW_CLASS[type]}
                >
                  <td className={`align-center ${TYPE_CLASS[type]}`}>{type}</td>
                  <td className="align-center">{kind}</td>
                  <td className="align-left">{building}</td>
                  <td className="align-left">{name}</td>
                  <td className="align-left">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(d.taxChanged || d.quoteChanged || totalDiff !== 0) && (
        <div className="mt-10 lines">
          {d.taxChanged && (
            <div>
              税率：<span className="text-old">{Number(prev.taxRate)}%</span> →{" "}
              <strong>{Number(next.taxRate)}%</strong>
            </div>
          )}
          {d.quoteChanged && (
            <div>
              見積り：<span className="text-old">{quoteText(prev)}</span> →{" "}
              <strong>{quoteText(next)}</strong>
            </div>
          )}
          {totalDiff !== 0 && (
            <div>
              合計（実費除く）：<span className="text-old">{yen(d.prevTotal)}</span> →{" "}
              <strong>{yen(d.nextTotal)}</strong>
              <span className={`ml-8 ${totalDiff > 0 ? "text-success" : "text-danger"}`}>
                （{signedYen(totalDiff)}）
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
