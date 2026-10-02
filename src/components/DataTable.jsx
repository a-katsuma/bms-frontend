// 一覧表の共通部品
//   columns：[{ label, key または render, align?: "left" | "center" | "right" }]
//     align を指定すると、見出しとセルの文字をそろえる（金額・数量は "right"）
//   noDataMessage：データが0件のときの文言
export default function DataTable({
  columns,
  data,
  pagination,
  noDataMessage = "データがありません。",
}) {
  const alignClass = (col) => (col.align ? `align-${col.align}` : undefined);

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={alignClass(col)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    data-label={col.label}
                    className={alignClass(col)}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="align-center">
                {noDataMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ページネーション部分の共通化（必要に応じて実装） */}
      {pagination && (
        <div className="pagination">
          {/* ページネーションボタン等の描画 */}
        </div>
      )}
    </div>
  );
}
