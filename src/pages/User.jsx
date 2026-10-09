import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useSetAtom } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";
import { userApi } from "../api/userApi";
import { demoApi } from "../api/demoApi";
import Button from "../atoms/Button";

// デモ用ログインのボタン（公開デモの環境だけ表示する）
const DEMO_ROLES = [
  {
    role: "ADMIN",
    label: "管理者として試す",
    note: "自社の担当者。見積り・現況確認表・ベース・毎次明細を作る",
  },
  {
    role: "MASTER",
    label: "業者（代表）として試す",
    note: "発注元の代表。見積りの判定・事前承認・自社ユーザーの管理",
  },
  {
    role: "GENERAL",
    label: "業者（一般）として試す",
    note: "発注元の一般ユーザー。見積りの判定・明細の閲覧",
  },
];

export default function User() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoEnabled, setDemoEnabled] = useState(false);
  const setLoginUser = useSetAtom(loginUserAtom);
  const navigate = useNavigate();

  // 公開デモの環境か（サーバーの設定 app.demo.enabled）
  useEffect(() => {
    demoApi
      .getInfo()
      .then((info) => setDemoEnabled(Boolean(info.enabled)))
      .catch(() => setDemoEnabled(false));
  }, []);

  // ログインしたあとの共通処理
  const afterLogin = async () => {
    // ログイン直後に current を取得（businessPolicyAgreed を取得するため）
    const currentUserData = await userApi.getCurrentUser();

    // ユーザー情報と businessPolicyAgreed を結合して Atom に保存
    setLoginUser({
      ...currentUserData.user,
      businessPolicyAgreed: currentUserData.businessPolicyAgreed,
      businessPolicySet: currentUserData.businessPolicySet,
    });

    // ホームへ遷移（App.jsx 側のガードで未設定なら自動的に設定画面へ弾かれます）
    navigate("/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await userApi.login({ loginId, password });
      await afterLogin();
    } catch (err) {
      console.error("ログインエラー:", err);
      // バックエンドからのメッセージ(401/403)を取得し、なければデフォルトメッセージを表示
      const message =
        err.response?.data || "ログインIDまたはパスワードが間違っています。";
      setError(message);
    }
  };

  // デモ用ログイン（パスワードなし）
  const handleDemoLogin = async (role) => {
    setError("");
    try {
      await demoApi.login(role);
      await afterLogin();
    } catch (err) {
      console.error("デモ用ログインエラー:", err);
      setError(
        err.response?.data?.errorMessage || "デモ用のログインに失敗しました。",
      );
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
                placeholder="ログインID"
              />
            </div>

            <div className="login-form-group-mb">
              <label className="login-label">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワード"
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

          {/* 公開デモの環境だけ：パスワードなしで、それぞれの立場で試せる */}
          {demoEnabled && (
            <div className="demo-box">
              <p className="demo-box-title">デモ環境</p>
              <p className="demo-box-text">
                パスワードなしで、それぞれの立場で試せます。
              </p>
              {DEMO_ROLES.map((d) => (
                <div key={d.role} className="demo-role">
                  <Button
                    className="demo-login-btn"
                    onClick={() => handleDemoLogin(d.role)}
                  >
                    {d.label}
                  </Button>
                  <span className="demo-role-note">{d.note}</span>
                </div>
              ))}
              <p className="demo-box-note">
                ※データは毎晩3時に元に戻ります。
                <br />
                ※メール（パスワード再設定・ユーザーの招待など）は外には送らず、
                <a href="/mail/" target="_blank" rel="noreferrer">
                  メールの確認画面
                </a>
                で見られます。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
