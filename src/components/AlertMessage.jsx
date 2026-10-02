import { useEffect, useRef } from "react";

// 成功・エラーのメッセージ帯
// - success：duration（ミリ秒）で自動的に消える
// - danger ：自動では消えない。表示したらその位置までスクロールし、onClose があれば × で閉じられる
//   scrollKey：同じ文言を続けて出したときもスクロールし直すための値
export default function AlertMessage({
  message,
  type = "success",
  duration = 5000,
  onClose,
  scrollKey,
}) {
  const ref = useRef(null);
  const isDanger = type === "danger";

  // 成功メッセージは自動で消す
  useEffect(() => {
    if (!message || isDanger || !duration) return;

    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose, isDanger]);

  // エラーは見える位置までスクロール
  useEffect(() => {
    if (message && isDanger) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [message, isDanger, scrollKey]);

  if (!message) return null;

  // type に応じてクラスを切り替え (例: alert-success, alert-danger)
  const alertClass = isDanger ? "alert alert-danger" : "alert alert-success";

  return (
    <div ref={ref} className={alertClass} role={isDanger ? "alert" : "status"}>
      <p>{message}</p>
      {isDanger && onClose && (
        <button
          type="button"
          className="alert-close"
          aria-label="閉じる"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}
