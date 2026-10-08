import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "react-router";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import { userApi } from "../../api/userApi";
import { VALIDATION_MESSAGES } from "../../utils/validationMessages";
import PageHeader from "../../components/PageHeader";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import NoDataMessage from "../../components/NoDataMessage";
import FieldError from "../../components/FieldError";
import Button from "../../atoms/Button";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompanyUsers() {
  const loginUser = useAtomValue(loginUserAtom);
  const navigate = useNavigate();
  const { confirm, prompt } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});

  // 代表ユーザー以外はホームへ
  useEffect(() => {
    if (loginUser && loginUser.roleFlag !== 2) {
      navigate("/");
    }
  }, [loginUser, navigate]);

  const fetchUsers = () => {
    userApi
      .getMyCompanyUsers()
      .then((res) => setUsers(res.users || []))
      .catch((err) => console.error("ユーザー一覧取得エラー:", err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 成功したとき：共通欄のエラーを消して、成功メッセージを出す
  const showSuccess = (message) => {
    clearMessage();
    setSuccessMessage(message);
  };

  // 失敗したとき：成功メッセージを消して、共通欄にエラーを出す
  const showFailure = (err) => {
    setSuccessMessage("");
    showError(err.response?.data?.errorMessage || "処理に失敗しました。");
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = VALIDATION_MESSAGES.required("氏名");
    }
    if (!email.trim()) {
      newErrors.email = VALIDATION_MESSAGES.required("メールアドレス");
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = "メールアドレスの形式が正しくありません。";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    userApi
      .addGeneralUser(name, email)
      .then((res) => {
        showSuccess(res.message);
        setName("");
        setEmail("");
        fetchUsers();
      })
      .catch(showFailure);
  };

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
      .then((res) => {
        showSuccess(res.message);
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === user.userId ? { ...u, isActive: newStatus } : u,
          ),
        );
      })

      .catch(showFailure);
  };

  const handleResetPassword = async (user) => {
    const ok = await confirm(
      `${user.name} さんのパスワードを再発行しますか？`,
      {
        title: "パスワードの再発行",
        okLabel: "再発行する",
      },
    );
    if (!ok) return;
    userApi
      .resetGeneralUserPassword(user.userId)
      .then((res) => showSuccess(res.message))
      .catch(showFailure);
  };

  const handleUpdateEmail = async (user) => {
    const newEmail = (
      await prompt(
        `${user.name} さんの新しいメールアドレスを入力してください`,
        user.email,
        {
          title: "メールアドレスの変更",
          okLabel: "変更",
          inputType: "email",
        },
      )
    )?.trim();
    if (!newEmail || newEmail === user.email) return;

    userApi
      .updateGeneralUserEmail(user.userId, newEmail)
      .then((res) => {
        showSuccess(res.message);
        fetchUsers();
      })
      .catch(showFailure);
  };

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
      render: (u) =>
        u.roleFlag === 3 ? (
          <div className="btn-row-sm">
            <Button
              type="button"
              variant={u.isActive === 1 ? "danger" : "primary"}
              className="btn-sm"
              onClick={() => handleToggleStatus(u)}
            >
              {u.isActive === 1 ? "無効化" : "有効化"}
            </Button>
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
          </div>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="content-wrapper theme-contractee">
      <PageHeader title="ユーザー管理" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>一般ユーザーの追加</h3>
        <form onSubmit={handleAddUser}>
          <div className="login-form-group-mb">
            <label>
              氏名 <span className="required">(必須)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "field-error" : ""}
              placeholder="山田太郎"
            />
            <FieldError message={errors.name} />
          </div>

          <div className="login-form-group-mb">
            <label>
              メールアドレス <span className="required">(必須)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "field-error" : ""}
              placeholder="example@email.com"
            />
            <FieldError message={errors.email} />
          </div>

          <div className="action-buttons-form">
            <Button type="submit" variant="primary">
              追加する
            </Button>
          </div>
        </form>
      </div>

      <div className="card mt-20">
        <h3>所属ユーザー一覧</h3>
        {users.length > 0 ? (
          <DataTable columns={userColumns} data={users} />
        ) : (
          <NoDataMessage message="ユーザーが登録されていません。" />
        )}
      </div>
    </div>
  );
}
