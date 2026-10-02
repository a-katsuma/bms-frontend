import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import Pagination from "../components/Pagination";
import Button from "../atoms/Button";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import { getRemainingDaysText } from "../utils/dateUtils";
import { projectApi } from "../api/projectApi";
import { loginUserAtom } from "../atoms/loginUserAtom";
import NoDataMessage from "../components/NoDataMessage";
import { baseApi } from "../api/baseApi";

export default function Home() {
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;

  // 上部セクション・下部セクションのページ番号をそれぞれ独立して管理
  const [topPage, setTopPage] = useState(1);
  const [bottomPage, setBottomPage] = useState(1);

  const [topList, setTopList] = useState([]);
  const [topTotalPages, setTopTotalPages] = useState(1);

  const [bottomList, setBottomList] = useState([]);
  const [bottomTotalPages, setBottomTotalPages] = useState(1);
  const [baseAlerts, setBaseAlerts] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  // ロールが切り替わったときにデータを取得
  useEffect(() => {
    const qPage = isAdmin ? topPage : bottomPage;
    const pPage = isAdmin ? bottomPage : topPage;

    // projectApi を経由してデータを取得
    projectApi
      .getHomeData(qPage, pPage, isAdmin)
      .then((res) => {
        if (res) {
          if (isAdmin) {
            // 管理者の場合
            setTopList(res.needQuoteList || []);
            setTopTotalPages(res.qTotalPages || 1);
            setBottomList(res.pendingList || []);
            setBottomTotalPages(res.pTotalPages || 1);
          } else {
            // 発注業者の場合：上部に判定待ち、下部に見積待ち
            setTopList(res.pendingList || []);
            setTopTotalPages(res.pTotalPages || 1);
            setBottomList(res.needQuoteList || []);
            setBottomTotalPages(res.qTotalPages || 1);
          }
        }
      })
      .catch((error) => {
        console.error("ダッシュボードデータの取得に失敗しました", error);
      });
  }, [isAdmin, topPage, bottomPage]);

  // 現況確認表とベース明細の差（管理者のみ）
  useEffect(() => {
    if (!isAdmin) {
      setBaseAlerts([]);
      return;
    }
    baseApi
      .getDiffAlerts()
      .then(setBaseAlerts)
      .catch((error) => console.error("ベース差分アラート取得エラー:", error));
  }, [isAdmin]);

  // ★ 上部セクション用のカラム定義
  const topColumns = [
    { label: "顧客名", key: "clientName" },
    ...(isAdmin ? [{ label: "発注業者", key: "companyName" }] : []),
    { label: "案件名", key: "projectName" },
    {
      label: isAdmin ? "見積状態" : "判定期限",
      render: (p) => {
        if (!isAdmin) {
          // 発注業者の場合（上部は「判定待ち案件」なので判定期限を表示）
          const isExpired =
            p.deadlineDate &&
            p.deadlineDate < today &&
            p.quoteStatus === "未判定";
          return (
            <span className={isExpired ? "text-danger" : ""}>
              {getRemainingDaysText(p.deadlineDate, today)}
            </span>
          );
        }
        // 管理者の場合の見積状態
        const isExpired =
          p.deadlineDate &&
          p.deadlineDate < today &&
          (p.latestQuoteStatus === "見積中" ||
            p.latestQuoteStatus === "未判定");
        if (isExpired) {
          return <span className="text-danger">期限切れ</span>;
        }
        const statusText = p.latestQuoteStatus ? p.latestQuoteStatus : "見積中";
        return <span>{statusText}</span>;
      },
    },
    {
      label: "操作",
      render: (p) => (
        <Button to={`/projects/${p.projectId}`} variant="primary">
          {isAdmin ? "詳細" : "判定"}
        </Button>
      ),
    },
  ];

  // ★ 下部セクション用のカラム定義
  const bottomColumns = [
    { label: "顧客名", key: "clientName" },
    ...(isAdmin ? [{ label: "発注業者", key: "companyName" }] : []),
    { label: "案件名", key: "projectName" },
    {
      label: isAdmin ? "判定期限" : "見積状態",
      render: (p) => {
        if (isAdmin) {
          // 管理者の場合（下部は「判定待ち案件」なので判定期限を表示）
          const isExpired =
            p.deadlineDate &&
            p.deadlineDate < today &&
            p.quoteStatus === "未判定";
          return (
            <span className={isExpired ? "text-danger" : ""}>
              {getRemainingDaysText(p.deadlineDate, today)}
            </span>
          );
        }
        // 発注業者の場合（下部は「見積状態」を表示）
        const statusText = p.latestQuoteStatus ? p.latestQuoteStatus : "見積中";
        return <span>{statusText}</span>;
      },
    },
    {
      label: "操作",
      render: (p) => (
        <Button to={`/projects/${p.projectId}`} variant="primary">
          詳細
        </Button>
      ),
    },
  ];

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="ダッシュボード">
        <div className="login-status">
          お疲れ様です、
          <strong>
            {loginUser?.name}さん
            {loginUser?.companyName && `：${loginUser.companyName}`}
          </strong>
        </div>
      </PageHeader>

      {isAdmin && baseAlerts.length > 0 && (
        <div className="alert alert-danger">
          <strong>
            現況確認表とベース明細に差がある案件が {baseAlerts.length}{" "}
            件あります。
          </strong>
          <ul className="alert-list">
            {baseAlerts.map((a) => (
              <li key={a.projectId}>
                {a.clientName}／{a.projectName}
                {a.companyName && `（${a.companyName}）`}：差分 {a.diffCount}件
                <Button
                  to={`/projects/${a.projectId}/base`}
                  className="btn-sm ml-10"
                >
                  ベース明細を開く
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="dashboard-grid">
        {/* 上部セクション */}
        <section className="card">
          <h3>{isAdmin ? "見積待ち案件" : "判定待ち案件"}</h3>
          {topList.length > 0 ? (
            <DataTable columns={topColumns} data={topList} />
          ) : (
            <NoDataMessage message="現在、表示する案件はありません。" />
          )}

          <Pagination
            currentPage={topPage}
            totalPages={topTotalPages}
            onPageChange={(newPage) => setTopPage(newPage)}
          />
        </section>

        {/* 下部セクション */}
        <section className="card">
          <h3>{isAdmin ? "判定待ち案件" : "見積待ち案件"}</h3>
          {bottomList.length > 0 ? (
            <DataTable columns={bottomColumns} data={bottomList} />
          ) : (
            <NoDataMessage message="現在、表示する案件はありません。" />
          )}

          <Pagination
            currentPage={bottomPage}
            totalPages={bottomTotalPages}
            onPageChange={(newPage) => setBottomPage(newPage)}
          />
        </section>
      </div>
    </div>
  );
}
