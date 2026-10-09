import { NavLink, useNavigate } from "react-router";
import { useSetAtom } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";
import { axiosInstance } from "../api/axiosInstance";

export default function Sidebar({ roleFlag }) {
  const isAdmin = roleFlag === 1;
  const isRepresentative = roleFlag === 2;
  const setLoginUser = useSetAtom(loginUserAtom);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // サーバー側のセッションを破棄
      await axiosInstance.post("/users/logout");
    } catch (err) {
      console.error("ログアウトに失敗しました", err);
    } finally {
      // フロントエンドの状態をクリアしてログイン画面へ
      setLoginUser(null);
      navigate("/login");
    }
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">BMS System</div>

      {/* メニューとログアウトボタンをまとめるコンテナ */}
      <div className="sidebar-nav-container">
        <ul>
          {/* ホーム */}
          <li>
            <NavLink to="/">ホーム</NavLink>
          </li>
          {/* 顧客管理 */}
          <li>
            <NavLink to="/clients">顧客管理</NavLink>
          </li>
          {/* 案件管理 */}
          <li>
            <NavLink to="/projects">案件管理</NavLink>
          </li>
          {/* 管理者のみ：緊急・追加作業（見積りを通さない例外の受注） */}
          {isAdmin && (
            <li>
              <NavLink to="/extra-works">緊急・追加作業</NavLink>
            </li>
          )}

          {/* 管理者のみ業者管理 */}
          {isAdmin && (
            <>
              <li>
                <NavLink to="/companys">業者管理</NavLink>
              </li>
              <li>
                <NavLink to="/masters">常用項目管理</NavLink>
              </li>
            </>
          )}
          {isRepresentative && (
            <>
              <li>
                <NavLink to="/company/users">ユーザー管理</NavLink>
              </li>
              {/* ★ 代表ユーザーのみ「事前承認設定」を表示 */}
              <li>
                <NavLink to="/company/business-policy">事前承認設定</NavLink>
              </li>
            </>
          )}
        </ul>

        {/* 自分のアカウントに関する項目（マイページ・ログアウト）は下にまとめる */}
        <div className="sidebar-footer">
          <ul>
            <li>
              <NavLink to="/account">マイページ</NavLink>
            </li>
            <li>
              {/* ログアウトは画面の移動ではなく操作なので button のまま。見た目だけメニューにそろえる */}
              <button type="button" onClick={handleLogout} className="logout-btn">
                ログアウト
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
