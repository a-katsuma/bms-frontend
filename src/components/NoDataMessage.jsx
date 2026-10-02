export default function NoDataMessage({
  message = "現在、登録されているデータはありません。",
}) {
  return <div className="no-data"> {message}</div>;
}
