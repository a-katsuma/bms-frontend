import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { dialogAtom } from "../atoms/dialogAtom";

// 確認・入力ダイアログ（App に1つだけ置く。開くのは useDialog から）
export default function DialogHost() {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const okRef = useRef(null);

  // 開いたとき：入力欄に初期値を入れて選択（確認は OK ボタンにフォーカス）
  useEffect(() => {
    if (!dialog) return;
    setValue(dialog.defaultValue ?? "");
    if (dialog.kind === "prompt") {
      setTimeout(() => inputRef.current?.select(), 0); // 初期値が入ってから選択
    } else {
      okRef.current?.focus();
    }
  }, [dialog]);

  if (!dialog) return null;

  const isPrompt = dialog.kind === "prompt";

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };
  const handleCancel = () => close(isPrompt ? null : false);
  const handleOk = () => close(isPrompt ? value : true);

  return (
    <div
      className="dialog-overlay"
      onKeyDown={(e) => e.key === "Escape" && handleCancel()}
    >
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={dialog.title ?? "確認"}
        onSubmit={(e) => {
          e.preventDefault(); // Enter で OK
          handleOk();
        }}
      >
        {dialog.title && <h3 className="dialog-title">{dialog.title}</h3>}
        <div className="dialog-message">{dialog.message}</div>
        {isPrompt && (
          <input
            ref={inputRef}
            className="dialog-input"
            type={dialog.inputType ?? "text"}
            value={value}
            maxLength={dialog.maxLength}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-cancel" onClick={handleCancel}>
            キャンセル
          </button>
          <button
            ref={okRef}
            type="submit"
            className={`btn ${dialog.danger ? "btn-danger" : "btn-primary"}`}
          >
            {dialog.okLabel ?? "OK"}
          </button>
        </div>
      </form>
    </div>
  );
}
