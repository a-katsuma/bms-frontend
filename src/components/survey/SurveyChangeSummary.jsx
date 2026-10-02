import Button from "../../atoms/Button";

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

const quantityText = (r) => {
  const excluded = Number(r.excludedQuantity || 0);
  return (
    `数量 ${Number(r.quantity || 0)}${r.unit ?? ""}` +
    (excluded > 0
      ? ` ／ 対象外 ${excluded}${r.excludedReason ? `（${r.excludedReason}）` : ""}`
      : "")
  );
};

const blank = (v) => (v === "" ? "（空）" : v);

export default function SurveyChangeSummary({
  changes,
  saving,
  onConfirm,
  onCancel,
}) {
  const { added, changed, removed } = changes;

  const rows = [
    ...added.map((r) => ({
      type: "追加",
      key: r._key,
      row: r,
      detail: quantityText(r),
    })),
    ...changed.map(({ row, fields }) => ({
      type: "変更",
      key: row.surveyItemId,
      row,
      detail: fields.map((f) => (
        <div key={f.label}>
          {f.label}：<span className="text-old">{blank(f.before)}</span> →{" "}
          <strong>{blank(f.after)}</strong>
        </div>
      )),
    })),
    ...removed.map((r) => ({
      type: "削除",
      key: r.surveyItemId,
      row: r,
      detail: <span className="text-old">{quantityText(r)}</span>,
    })),
  ];

  return (
    <div className="confirm-panel">
      <h4 className="mt-0">保存内容の確認</h4>
      <div className="mb-10">
        <span className={TYPE_CLASS.追加}>追加 {added.length}件</span> ／{" "}
        <span className={TYPE_CLASS.変更}>変更 {changed.length}件</span> ／{" "}
        <span className={TYPE_CLASS.削除}>削除 {removed.length}件</span>
      </div>
      {removed.length > 0 && (
        <div className="text-danger mb-10">
          ※削除した行は、保存すると元に戻せません。
        </div>
      )}

      <div className="table-container">
        <table className="compact-table">
          <colgroup>
            {/* 区分｜棟｜階｜項目｜内容 */}
            {[12, 16, 10, 22, 40].map((w, i) => (
              <col key={i} style={{ width: `${w}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="align-center">区分</th>
              <th className="align-left">棟</th>
              <th className="align-left">階</th>
              <th className="align-left">項目</th>
              <th className="align-left">内容</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ type, key, row, detail }) => (
              <tr key={`${type}-${key}`} className={ROW_CLASS[type]}>
                <td className={`align-center ${TYPE_CLASS[type]}`}>{type}</td>
                <td className="align-left">{row.building}</td>
                <td className="align-left">{row.floorLabel}</td>
                <td className="align-left">{row.itemName}</td>
                <td className="align-left">{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-buttons-form mt-15">
        <Button variant="primary" onClick={onConfirm} disabled={saving}>
          {saving ? "保存中…" : "確定して保存"}
        </Button>
        <Button variant="cancel" onClick={onCancel} disabled={saving}>
          編集に戻る
        </Button>
      </div>
    </div>
  );
}
