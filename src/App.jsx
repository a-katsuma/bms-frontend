import { Outlet, useNavigate, useLocation, useMatches } from "react-router";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PolicyWarningAlert from "./components/PolicyWarningAlert";
import DialogHost from "./components/DialogHost";
import GlobalMessage from "./components/GlobalMessage";
import { useAtomValue, useSetAtom } from "jotai";
import { loginUserAtom } from "./atoms/loginUserAtom";
import { userApi } from "./api/userApi";

function App() {
  const loginUser = useAtomValue(loginUserAtom);
  const setLoginUser = useSetAtom(loginUserAtom);
  const navigate = useNavigate();
  const location = useLocation();
  // ルートに handle: { fullScreen: true } があるページは、サイドバーなしの全画面で出す（顧客向けプレビューなど）
  const fullScreen = useMatches().some((m) => m.handle?.fullScreen);

  // 1. ページリロード時（loginUserが完全に空の時だけ）セッション復元を行う
  useEffect(() => {
    // 既に User.jsx などで setLoginUser されている場合は何もしない
    if (loginUser) return;

    let isMounted = true;

    userApi
      .getCurrentUser()
      .then((data) => {
        if (isMounted) {
          setLoginUser({
            ...data.user,
            businessPolicyAgreed: data.businessPolicyAgreed,
            businessPolicySet: data.businessPolicySet,
          });
        }
      })
      .catch((err) => {
        // 未ログイン時のみログイン画面へ飛ばす
        if (isMounted) {
          navigate("/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []); // 依存配列を空にして、App の初回マウント時（リロード時）のみ実行させる

  // 2. 未設定時の強制リダイレクト（スキップ不可ガード）
  useEffect(() => {
    if (loginUser) {
      const isPolicyMissing =
        loginUser.roleFlag === 2 && loginUser.businessPolicySet === false;
      const isPolicyPage = location.pathname === "/company/business-policy";

      if (isPolicyMissing && !isPolicyPage) {
        navigate("/company/business-policy", { replace: true });
      }
    }
  }, [loginUser, location.pathname, navigate]);

  if (!loginUser) return null;

  const themeClass = loginUser.roleFlag !== 1 ? "theme-contractee" : "";

  // 全画面（サイドバー・事前承認の警告なし）
  if (fullScreen) {
    return (
      <div className={`app-container ${themeClass}`}>
        <main className="fullscreen-content">
          <GlobalMessage />
          <Outlet />
        </main>
        <DialogHost />
      </div>
    );
  }

  return (
    <div className={`app-container ${themeClass}`}>
      <Sidebar roleFlag={loginUser.roleFlag} />
      <main className="main-content">
        <PolicyWarningAlert loginUser={loginUser} />
        <GlobalMessage />
        <Outlet />
      </main>
      <DialogHost />
    </div>
  );
}

export default App;
