import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import NoDataMessage from "../../components/NoDataMessage";
import Button from "../../atoms/Button";
import Pagination from "../../components/Pagination";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { useLocation } from "react-router";
import { useAtomValue } from "jotai";
import { projectApi } from "../../api/projectApi";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import { ORDER_ROUTE_POLICY } from "../../utils/extraWorkUtils";

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // API側でルーティングがカプセル化されたためすっきりと呼び出せる
        const data = await projectApi.getList(currentPage, isAdmin);
        setProjects(data.projects || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("通信エラー:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [isAdmin, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const columns = [
    { label: "顧客名", key: "clientName" },
    { label: "案件名", key: "projectName" },
    ...(isAdmin ? [{ label: "発注元", key: "companyName" }] : []),
    { label: "案件状態", key: "status" },
    {
      label: "見積状態",
      render: (p) => {
        // 緊急・追加作業の例外の案件は見積りを通さない
        if (p.orderRoute === ORDER_ROUTE_POLICY) {
          return <span className="text-muted">事前承認</span>;
        }

        const isExpired =
          p.deadlineDate &&
          p.deadlineDate < today &&
          (p.latestQuoteStatus === "見積中" ||
            p.latestQuoteStatus === "未判定");
        return isExpired ? (
          <span className="text-danger">期限切れ</span>
        ) : (
          <span>{p.latestQuoteStatus || "見積中"}</span>
        );
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

  if (loading) return <Loading />;

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="案件管理" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      {isAdmin && (
        <div className="action-bar">
          <Button to="/projects/add" variant="primary">
            新規案件登録
          </Button>
          <Button to="/projects/deleted">削除済みの案件</Button>
        </div>
      )}

      <div className="card">
        <h3>案件一覧</h3>
        {projects && projects.length > 0 ? (
          <>
            <DataTable columns={columns} data={projects} />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <NoDataMessage message="現在、登録されている案件はありません。" />
        )}
      </div>
    </div>
  );
}
