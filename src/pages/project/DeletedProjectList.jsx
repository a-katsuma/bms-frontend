import { useState, useEffect } from "react";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import NoDataMessage from "../../components/NoDataMessage";
import Button from "../../atoms/Button";
import Pagination from "../../components/Pagination";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { projectApi } from "../../api/projectApi";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { formatDateTime } from "../../utils/baseUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

export default function DeletedProjectList() {
  const { isAdmin } = useAdminGuard();
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();
  const [projects, setProjects] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchDeleted = () => {
    setLoading(true);
    projectApi
      .getDeletedList(currentPage)
      .then((data) => {
        setProjects(data.projects || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((error) => console.error("削除済み案件の取得エラー:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) fetchDeleted();
  }, [isAdmin, currentPage]);

  const handleRestore = async (p) => {
    const ok = await confirm(`「${p.projectName}」を復元しますか？`, {
      title: "案件の復元",
      okLabel: "復元する",
    });
    if (!ok) return;
    projectApi
      .restore(p.projectId)
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        fetchDeleted();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "復元に失敗しました。");
      });
  };

  const columns = [
    { label: "顧客名", key: "clientName" },
    { label: "案件名", key: "projectName" },
    { label: "発注元", key: "companyName" },
    { label: "削除日時", render: (p) => formatDateTime(p.deletedAt) },
    {
      label: "操作",
      render: (p) => (
        <Button variant="primary" onClick={() => handleRestore(p)}>
          復元
        </Button>
      ),
    },
  ];

  if (!isAdmin || loading) return <Loading />;

  return (
    <div className="content-wrapper">
      <PageHeader title="削除済みの案件" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>削除済みの案件一覧</h3>
        <div className="note mb-10">
          ※復元すると、現況確認表・ベース明細・毎次明細・見積りも削除前の状態で表示されます。
        </div>
        {projects.length > 0 ? (
          <>
            <DataTable columns={columns} data={projects} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <NoDataMessage message="削除済みの案件はありません。" />
        )}
        <div className="action-buttons-form">
          <Button to="/projects" variant="cancel">
            案件一覧へ戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
