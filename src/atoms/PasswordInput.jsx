import { useState } from "react";

// パスワードの入力欄（右端の目のマークで、表示・非表示を切り替える）
//   value・onChange・className・placeholder・autoComplete・required など、受け取ったものはそのまま入力欄に渡す
export default function PasswordInput(props) {
  const [show, setShow] = useState(false);
  const label = show ? "パスワードを隠す" : "パスワードを表示";

  return (
    <div className="password-input-wrapper">
      <input {...props} type={show ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow((prev) => !prev)}
        aria-label={label}
        aria-pressed={show}
        title={label}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* 目 */}
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
          <circle cx="12" cy="12" r="3" />
          {/* 表示中は斜線を引く（押すと隠れる） */}
          {show && <line x1="3" y1="3" x2="21" y2="21" />}
        </svg>
      </button>
    </div>
  );
}
