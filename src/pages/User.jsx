import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSetAtom } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";
import { userApi } from "../api/userApi";
import Button from "../atoms/Button";

export default function User() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setLoginUser = useSetAtom(loginUserAtom);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. ログイン処理を実行
      await userApi.login({ loginId, password });

      // 2. ログイン直後に current を取得（businessPolicyAgreed を取得するため）
      const currentUserData = await userApi.getCurrentUser();

      // 3. ユーザー情報と businessPolicyAgreed を結合して Atom に保存
      setLoginUser({
        ...currentUserData.user,
        businessPolicyAgreed: currentUserData.businessPolicyAgreed,
        businessPolicySet: currentUserData.businessPolicySet,
      });

      // 4. ホームへ遷移（App.jsx 側のガードで未設定なら自動的に設定画面へ弾かれます）
      navigate("/");
    } catch (err) {
      console.error("ログインエラー:", err);
      // バックエンドからのメッセージ(401/403)を取得し、なければデフォルトメッセージを表示
      const message =
        err.response?.data || "ログインIDまたはパスワードが間違っています。";
      setError(message);
    }
  };

  return (
    <div className="login-page">
      <div className="main-content login-content-wrapper">
        <div className="login-box">
          <h1 className="login-image">BMS System</h1>

          <h2 className="login-title">ログイン</h2>

          {error && <p className="error-text login-error-text">{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="login-form-group-mb">
              <label className="login-label">ログインID</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                placeholder="例: admin / ks_narita / st_suzuki"
              />
            </div>

            <div className="login-form-group-mb">
              <label className="login-label">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="例：aaa / bbb / ccc"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="btn btn-primary login-submit-btn"
            >
              ログイン
            </Button>

            <div className="login-link">
              <Link to="/forgot-password">パスワードをお忘れですか？</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
