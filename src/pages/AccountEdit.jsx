import { useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";
import { userApi } from "../api/userApi";
import { VALIDATION_MESSAGES } from "../utils/validationMessages";
import PasswordFields from "../components/PasswordFields";
import PasswordInput from "../atoms/PasswordInput";
import FieldError from "../components/FieldError";
import Button from "../atoms/Button";
import PageHeader from "../components/PageHeader";
import AlertMessage from "../components/AlertMessage";
import { useMessage } from "../hooks/useMessage";

export default function AccountEdit() {
  const loginUser = useAtomValue(loginUserAtom);
  const setLoginUser = useSetAtom(loginUserAtom);
  const { showError, clearMessage } = useMessage();

  const [successMessage, setSuccessMessage] = useState("");

  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(loginUser?.email || "");
  const [emailErrors, setEmailErrors] = useState({});

  const [pwCurrentPassword, setPwCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors, setPwErrors] = useState({});

  const [name, setName] = useState(loginUser?.name || "");
  const [nameError, setNameError] = useState("");

  const isNameUnchanged = name.trim() === loginUser?.name;

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

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(VALIDATION_MESSAGES.required("氏名"));
      return;
    }
    if (isNameUnchanged) {
      setNameError("現在の氏名と同じです。");
      return;
    }
    setNameError("");

    userApi
      .updateMyName(name)
      .then((res) => {
        showSuccess(res.message);
        setLoginUser((prev) => ({ ...prev, name }));
      })
      .catch(showFailure);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!emailCurrentPassword.trim()) {
      newErrors.emailCurrentPassword =
        VALIDATION_MESSAGES.required("現在のパスワード");
    }
    if (!newEmail.trim()) {
      newErrors.newEmail = VALIDATION_MESSAGES.required("新しいメールアドレス");
    }

    if (Object.keys(newErrors).length > 0) {
      setEmailErrors(newErrors);
      return;
    }
    setEmailErrors({});

    userApi
      .updateMyEmail(emailCurrentPassword, newEmail)
      .then((res) => {
        showSuccess(res.message);
        setEmailCurrentPassword("");
        setLoginUser((prev) => ({
          ...prev,
          email: newEmail,
          loginId: newEmail,
        }));
      })
      .catch(showFailure);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!pwCurrentPassword.trim()) {
      newErrors.pwCurrentPassword =
        VALIDATION_MESSAGES.required("現在のパスワード");
    }
    if (!newPassword.trim()) {
      newErrors.newPassword = VALIDATION_MESSAGES.required("新しいパスワード");
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "8文字以上で入力してください。";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "パスワードが一致しません。";
    }

    if (Object.keys(newErrors).length > 0) {
      setPwErrors(newErrors);
      return;
    }
    setPwErrors({});

    userApi
      .changeMyPassword(pwCurrentPassword, newPassword)
      .then((res) => {
        showSuccess(res.message);
        setPwCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch(showFailure);
  };

  return (
    <div className="content-wrapper">
      <PageHeader title="マイページ" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>氏名変更</h3>
        <form onSubmit={handleNameSubmit}>
          <div className="login-form-group-mb">
            <label>
              氏名 <span className="required">(必須)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={nameError ? "field-error" : ""}
            />
            <FieldError message={nameError} />
          </div>
          <div className="action-buttons-form">
            <Button type="submit" variant="primary">
              氏名を変更する
            </Button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>メールアドレス変更</h3>
        <div className="text-muted mb-15">
          現在のメールアドレス：{loginUser?.email}{" "}
        </div>
        <form onSubmit={handleEmailSubmit}>
          <div className="login-form-group-mb">
            <label>
              新しいメールアドレス <span className="required">(必須)</span>
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={emailErrors.newEmail ? "field-error" : ""}
            />
            <FieldError message={emailErrors.newEmail} />
          </div>

          <div className="login-form-group-mb">
            <label>
              現在のパスワード <span className="required">(必須)</span>
            </label>
            <PasswordInput
              value={emailCurrentPassword}
              onChange={(e) => setEmailCurrentPassword(e.target.value)}
              className={emailErrors.emailCurrentPassword ? "field-error" : ""}
              autoComplete="current-password"
            />
            <FieldError message={emailErrors.emailCurrentPassword} />
          </div>

          <div className="action-buttons-form">
            <Button type="submit" variant="primary">
              メールアドレスを変更する
            </Button>
          </div>
        </form>
      </div>

      <div className="card mt-20">
        {" "}
        <h3>パスワード変更</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="login-form-group-mb">
            <label>
              現在のパスワード <span className="required">(必須)</span>
            </label>
            <PasswordInput
              value={pwCurrentPassword}
              onChange={(e) => setPwCurrentPassword(e.target.value)}
              className={pwErrors.pwCurrentPassword ? "field-error" : ""}
              autoComplete="current-password"
            />
            <FieldError message={pwErrors.pwCurrentPassword} />
          </div>

          <PasswordFields
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            errors={pwErrors}
          />

          <div className="action-buttons-form">
            <Button type="submit" variant="primary">
              パスワードを変更する
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
