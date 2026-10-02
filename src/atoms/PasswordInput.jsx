import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  className,
  placeholder,
  autoComplete,
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShow((prev) => !prev)}
        tabIndex={-1}
      >
        {show ? "パスワードを非表示" : "パスワードを表示"}
      </button>
    </>
  );
}