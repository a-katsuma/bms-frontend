import { useState } from "react";
import FieldError from "./FieldError";

export default function PasswordFields({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
  boldLabel = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const labelClassName = boldLabel ? "login-label" : undefined; // ★追加

  return (
    <>
      <div className="login-form-group-mb">
        <label className={labelClassName}>新しいパスワード<span className="required">(必須)</span></label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={errors.newPassword ? "field-error" : ""}
            placeholder="半角英数字8文字以上（英字・数字を含む）"
            autoComplete="new-password"
          />
        </div>
        <FieldError message={errors.newPassword} />
      </div>

      <div className="login-form-group-mb">
        <label className={labelClassName}>確認用パスワード<span className="required">(必須)</span></label>
        <div className="password-input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={errors.confirmPassword ? "field-error" : ""}
            placeholder="半角英数字8文字以上（英字・数字を含む）"
            autoComplete="new-password"
          />
        </div>
        <FieldError message={errors.confirmPassword} />
      </div>

      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
      >
        {showPassword ? "パスワードを非表示" : "パスワードを表示"}
      </button>
    </>
  );
}