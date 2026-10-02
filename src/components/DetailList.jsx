// 項目名と値を並べる一覧
//   variant="totals"：合計欄（小計・消費税・合計）。金額を右寄せにして、カードの右側にまとめる
export default function DetailList({ items, variant }) {
  const className = `detail-list${variant === "totals" ? " is-totals" : ""}`;

  return (
    <dl className={className}>
      {items.map((item, index) => (
        <div className="detail-item" key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
