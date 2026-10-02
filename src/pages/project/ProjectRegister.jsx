import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FORM_LABELS } from "../../utils/formLabels";
import { VALIDATION_MESSAGES } from "../../utils/validationMessages";
import { projectApi } from "../../api/projectApi";
import BaseProjectForm from "../../components/BaseProjectForm";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { useMessage } from "../../hooks/useMessage";

export default function ProjectRegister() {
  // 管理者以外は案件一覧へリダイレクト
  useAdminGuard("/projects");

  const navigate = useNavigate();
  const { showError, clearMessage } = useMessage();

  const labels = FORM_LABELS.project;

  const [projectForm, setProjectForm] = useState({
    projectName: "",
    clientId: "",
    companyId: "",
    projectStaffname: "",
    contractType: "",
    status: "",
    projectRemarks: "",
  });

  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [errors, setErrors] = useState({});
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    projectApi
      .getFormData()
      .then((data) => {
        setClients(data.clients);
        setCompanies(data.companies);
      })
      .catch((err) => {
        console.error("フォームデータ取得エラー:", err);
        showError("顧客・業者の一覧の取得に失敗しました。");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectForm({ ...projectForm, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!projectForm.projectName.trim())
      newErrors.projectName = VALIDATION_MESSAGES.required(labels.projectName);
    if (!projectForm.clientId)
      newErrors.clientId = VALIDATION_MESSAGES.required(labels.clientId);
    if (!projectForm.companyId)
      newErrors.companyId = VALIDATION_MESSAGES.required(labels.companyId);
    if (!projectForm.projectStaffname.trim())
      newErrors.projectStaffname = VALIDATION_MESSAGES.required(
        labels.projectStaffname,
      );
    if (!projectForm.contractType)
      newErrors.contractType = VALIDATION_MESSAGES.required(
        labels.contractType,
      );
    if (!projectForm.status)
      newErrors.status = VALIDATION_MESSAGES.required(labels.status);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setHasError(true);
      return;
    }

    setHasError(false);
    setErrors({});
    clearMessage();

    projectApi
      .add(projectForm)
      .then((res) => {
        // ★ レスポンスの構造に合わせてIDの取得先を調整（res または res.data など）
        const createdId = res?.projectId || res?.data?.projectId;

        if (createdId) {
          navigate(`/projects/${createdId}`, {
            state: { message: "新規案件を登録しました。" },
          });
        } else {
          // 万が一IDが取れなくても登録自体は成功しているので一覧へ飛ばす場合
          navigate("/projects", {
            state: { message: "新規案件を登録しました。" },
          });
        }
      })
      .catch((err) => {
        console.error("登録エラー詳細:", err); // デバッグ用にコンソール出力
        const errorData = err.response?.data;
        if (err.response?.status === 400 && Array.isArray(errorData)) {
          // 項目ごとのエラー → 入力欄の下に出す
          const errorMap = {};
          errorData.forEach((error) => {
            errorMap[error.field] = error.defaultMessage;
          });
          setErrors(errorMap);
          setHasError(true);
        } else {
          // それ以外 → 画面上部の共通欄
          showError(errorData?.errorMessage || "登録処理に失敗しました。");
        }
      });
  };

  return (
    <BaseProjectForm
      title="新規案件登録"
      projectForm={projectForm}
      clients={clients}
      companies={companies}
      errors={errors}
      hasError={hasError}
      labels={labels}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isEdit={false}
      cancelTo="/projects"
    />
  );
}
