import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router";
import { useSetAtom } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";
import { axiosInstance } from "../api/axiosInstance";
import { useMediaQuery } from "../hooks/useMediaQuery";

// スマホ（style.css の @media (max-width: 768px) と同じ境目）
const MOBILE_QUERY = "(max-width: 768px)";

export default function Sidebar({ roleFlag }) {
  const isAdmin = roleFlag === 1;
  const isRepresentative = roleFlag === 2;
  const setLoginUser = useSetAtom(loginUserAtom);
  const navigate = useNavigate();
  const location = useLocation();

  // スマホのメニュー（☰）を開いているか。PC では使わない（メニューは常に表示）
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [menuOpen, setMenuOpen] = useState(false);

  // 画面を移動したとき・PC の幅に広げたときは閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, isMobile]);

  // 開いている間：Esc キーで閉じる・後ろの画面をスクロールさせない
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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

  // メニューの中のリンクを押したら閉じる（今いる画面のリンクを押したときも閉じるため）
  const handleMenuClick = (e) => {
    if (e.target.closest("a")) setMenuOpen(false);
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">BMS System</div>

      {/* スマホだけ表示：メニューを開く・閉じるボタン（☰ ／ ×） */}
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-controls="sidebar-menu"
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {menuOpen ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* スマホでメニューを開いている間の、後ろの暗い幕（押すと閉じる） */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* メニューとログアウトボタンをまとめるコンテナ
          スマホでは左から出てくる引き出し。閉じている間は Tab で入れないようにする（inert） */}
      <div
        id="sidebar-menu"
        className={`sidebar-nav-container${menuOpen ? " is-open" : ""}`}
        onClick={handleMenuClick}
        inert={isMobile && !menuOpen}
      >
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
                <NavLink to="/companys">発注元管理</NavLink>
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
