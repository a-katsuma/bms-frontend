import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router";
import { formatPhone, formatPostal } from "../../utils/formatUtils";
import AlertMessage from "../../components/AlertMessage";
import { companyApi } from "../../api/companyApi";
import { userApi } from "../../api/userApi";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import NoDataMessage from "../../components/NoDataMessage";
import Pagination from "../../components/Pagination";
import DetailList from "../../components/DetailList";
import DataTable from "../../components/DataTable";
import { useDeleteWithCheck } from "../../hooks/useDeleteWithCheck";
import { useAdminGuard } from "../../hooks/useAdminGuard.js";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

export default function CompanyDetail() {
  const { id } = useParams();
  const location = useLocation();

  useAdminGuard("/");
  const { confirm, prompt } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );

  const { handleDeleteWithCheck } = useDeleteWithCheck(
    `/companys/${id}`,
    "/companys",
    "発注元情報を削除しました。",
    async () => {
      return projects.length > 0;
    },
  );

  const fetchDetail = () => {
    companyApi
      .getDetail(id, currentPage)
      .then((res) => {
        setCompany(res.company);
        setProjects(res.projects || []);
        setUsers(res.users || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch((error) => {
        console.error("データ取得エラー:", error);
      });
  };

  useEffect(() => {
    fetchDetail();
  }, [id, currentPage]);

  // 成功したとき：共通欄のエラーを消して、成功メッセージを出す
  const showSuccess = (message) => {
    clearMessage();
    setSuccessMessage(message);
  };

  // 失敗したとき：成功メッセージを消して、共通欄にエラーを出す
  const showFailure = (error) => {
    setSuccessMessage("");
    showError(error.response?.data?.errorMessage || "処理に失敗しました。");
  };

  // アカウント有効/無効の切り替え処理
  const handleToggleStatus = async (user) => {
    const actionText = user.isActive === 1 ? "無効" : "有効";
    const ok = await confirm(
      `${user.name} さんのアカウントを${actionText}にしますか？`,
      {
        title: `アカウントの${actionText}化`,
        okLabel: `${actionText}にする`,
        danger: user.isActive === 1, // 無効にするときは赤
      },
    );
    if (!ok) return;

        const newStatus = user.isActive === 1 ? 0 : 1;
    userApi
      .setStatus(user.userId, newStatus)
      .then(() => {
        showSuccess(`ユーザーのアカウント状態を${actionText}に変更しました。`);
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.userId === user.userId ? { ...u, isActive: newStatus } : u,
          ),
        );
      })

      .catch((error) => {
        console.error("ステータス変更エラー:", error);
        showFailure(error);
      });
  };

  // パスワード再発行
  const handleResetPassword = async (user) => {
    const ok = await confirm(
      `${user.name} さんのパスワードを再発行しますか？\n新しいパスワードが登録メールアドレスに送信されます。`,
      { title: "パスワードの再発行", okLabel: "再発行する" },
    );
    if (!ok) return;
    userApi
      .resetPassword(user.userId)
      .then((res) => showSuccess(res.message))
      .catch((error) => {
        console.error("パスワード再発行エラー:", error);
        showFailure(error);
      });
  };

  // メールアドレス変更
  const handleUpdateEmail = async (user) => {
    const newEmail = (
      await prompt(
        `${user.name} さんの新しいメールアドレスを入力してください`,
        user.email,
        { title: "メールアドレスの変更", okLabel: "変更", inputType: "email" },
      )
    )?.trim();
    if (!newEmail || newEmail === user.email) return;

    userApi
      .updateEmail(user.userId, newEmail)
      .then((res) => {
        showSuccess(res.message);
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.userId === user.userId ? { ...u, email: newEmail } : u,
          ),
        );
      })
      .catch((error) => {
        console.error("メールアドレス変更エラー:", error);
        showFailure(error);
      });
  };

  // 代表ユーザーの交代
  const handleTransferMaster = async (user) => {
    const ok = await confirm(
      `${user.name} さんを新しい代表ユーザーにしますか？\n現在の代表ユーザーは一般ユーザーに変更されます。`,
      { title: "代表ユーザーの交代", okLabel: "交代する", danger: true },
    );
    if (!ok) return;
    userApi
      .transferMaster(company.companyId, user.userId)
      .then((res) => {
        showSuccess(res.message);
        fetchDetail();
      })
      .catch((error) => {
        console.error("代表交代エラー:", error);
        showFailure(error);
      });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (!company) {
    return <Loading />;
  }

  const detailItems = [
    { label: "発注元名", value: company.companyName },
    { label: "フリガナ", value: company.companyKana },
    { label: "郵便番号", value: formatPostal(company.companyPostalcode) },
    { label: "住所", value: company.companyAddress },
    { label: "電話番号", value: formatPhone(company.companyPhone) },
  ];

  const userColumns = [
    { label: "氏名", key: "name" },
    { label: "メールアドレス", key: "email" },
    {
      label: "権限",
      render: (u) => (u.roleFlag === 2 ? "代表" : "一般"),
    },
    {
      label: "ステータス",
      render: (u) => (
        <span
          className={u.isActive === 1 ? "text-success" : "text-muted text-bold"}
        >
          {u.isActive === 1 ? "有効" : "無効"}
        </span>
      ),
    },
    {
      label: "操作",
      render: (u) => (
        <div className="btn-row-sm">
          <Button
            type="button"
            variant={u.isActive === 1 ? "danger" : "primary"}
            className="btn-sm"
            onClick={() => handleToggleStatus(u)}
          >
            {u.isActive === 1 ? "無効化" : "有効化"}
          </Button>

          {u.roleFlag === 2 && (
            <>
              <Button
                type="button"
                variant="secondary"
                className="btn-sm"
                onClick={() => handleResetPassword(u)}
              >
                PW再発行
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="btn-sm"
                onClick={() => handleUpdateEmail(u)}
              >
                メール変更
              </Button>
            </>
          )}

          {u.roleFlag !== 2 && u.isActive === 1 && (
            <Button
              type="button"
              variant="secondary"
              className="btn-sm"
              onClick={() => handleTransferMaster(u)}
            >
              代表にする
            </Button>
          )}
        </div>
      ),
    },
  ];

  const projectColumns = [
    { label: "顧客名", key: "clientName" },
    { label: "案件名", key: "projectName" },
    { label: "案件状態", key: "status" },
    {
      label: "操作",
      render: (p) => (
        <Link to={`/projects/${p.projectId}`} className="btn btn-primary">
          詳細
        </Link>
      ),
    },
  ];

  return (
    <div className="content-wrapper">
      <PageHeader title="発注元詳細" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>発注元情報</h3>
        <DetailList items={detailItems} />

        <div className="action-buttons-form">
          <Button to={`/companys/edit/${company.companyId}`} variant="primary">
            編集
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDeleteWithCheck}
          >
            削除
          </Button>
          <Button to="/companys" variant="cancel">
            発注元一覧へ戻る
          </Button>
        </div>
      </div>

      <div className="card mt-20">
        <h3>所属ユーザー一覧</h3>
        {users.length > 0 ? (
          <DataTable columns={userColumns} data={users} />
        ) : (
          <NoDataMessage message="現在、登録されているユーザーはありません。" />
        )}
      </div>

      <div className="card mt-20">
        <h3>関連案件</h3>
        {projects.length > 0 ? (
          <>
            <DataTable columns={projectColumns} data={projects} />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <NoDataMessage message="現在、この発注元に紐づく案件はありません。" />
        )}
      </div>
    </div>
  );
}
