import FieldError from "./FieldError";
import PasswordInput from "../atoms/PasswordInput";

// 新しいパスワードと確認用の入力欄（それぞれ右端の目のマークで、表示・非表示を切り替える）
export default function PasswordFields({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
  boldLabel = false,
}) {
  const labelClassName = boldLabel ? "login-label" : undefined;

  return (
    <>
      <div className="login-form-group-mb">
        <label className={labelClassName}>新しいパスワード<span className="required">(必須)</span></label>
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={errors.newPassword ? "field-error" : ""}
          placeholder="半角英数字8文字以上（英字・数字を含む）"
          autoComplete="new-password"
        />
        <FieldError message={errors.newPassword} />
      </div>

      <div className="login-form-group-mb">
        <label className={labelClassName}>確認用パスワード<span className="required">(必須)</span></label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={errors.confirmPassword ? "field-error" : ""}
          placeholder="半角英数字8文字以上（英字・数字を含む）"
          autoComplete="new-password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>
    </>
  );
}
