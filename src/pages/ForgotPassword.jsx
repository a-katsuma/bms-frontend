import { useState } from "react";
import { Link } from "react-router";
import { userApi } from "../api/userApi";
import Button from "../atoms/Button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // ★追加

export default function ForgotPassword() {
  const [loginId, setLoginId] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(""); // ★追加

  const handleSubmit = (e) => {
    e.preventDefault();

    // ★追加：送信前に形式チェック
    if (!EMAIL_REGEX.test(loginId.trim())) {
      setError("メールアドレスの形式で入力してください。");
      return;
    }
    setError("");

    userApi
      .forgotPassword(loginId)
      .then((res) => {
        setMessage(res.message);
        setSubmitted(true);
      })
      .catch(() => {
        setMessage(
          "ご登録のメールアドレス宛に、再設定用のメールを送信しました。\nしばらくしても届かない場合は管理者へお問い合わせください。",
        );
        setSubmitted(true);
      });
  };

  return (
    <div className="login-page">
      <div className="main-content login-content-wrapper">
        <div className="login-box">
          <h1 className="login-image">BMS System</h1>
          <h2 className="login-title">パスワード再設定</h2>

          {submitted ? (
            <p className="mb-20 pre-line">{message}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="login-form-group-mb">
                <label className="login-label">
                  登録済みのログインID（メールアドレス）
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder="例: master@example.com"
                />
                {error && (
                  <p className="error-text login-error-text">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="btn btn-primary login-submit-btn"
              >
                再設定メールを送信
              </Button>
            </form>
          )}

          <div className="login-link">
            {" "}
            <Link to="/login">ログイン画面へ戻る</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
