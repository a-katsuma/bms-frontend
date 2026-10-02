import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { userApi } from "../api/userApi";
import { validatePassword } from "../utils/passwordValidation";
import PasswordFields from "../components/PasswordFields";
import Button from "../atoms/Button";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "パスワードが一致しません。";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!token) {
      setServerError(
        "リンクが無効です。もう一度パスワード再設定をやり直してください。",
      );
      return;
    }

    setErrors({});
    setServerError("");

    userApi
      .confirmResetPassword(token, newPassword)
      .then((res) => {
        navigate("/login", { state: { message: res.message } });
      })
      .catch((err) => {
        setServerError(
          err.response?.data?.errorMessage || "処理に失敗しました。",
        );
      });
  };

  return (
    <div className="login-page">
      <div className="main-content login-content-wrapper">
        <div className="login-box">
          <h1 className="login-image">BMS System</h1>
          <h2 className="login-title">新しいパスワードの設定</h2>

          {serverError && (
            <p className="error-text login-error-text">{serverError}</p>
          )}

          <form onSubmit={handleSubmit}>
            <PasswordFields
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              errors={errors}
              boldLabel // ★追加（true を渡すのと同じ）
            />
            <Button
              type="submit"
              variant="primary"
              className="btn btn-primary login-submit-btn"
            >
              パスワードを設定する
            </Button>
          </form>

          {/* ★追加 */}
          <div className="login-link">
            <Link to="/login">ログイン画面へ戻る</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
