import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import FieldError from "../../components/FieldError";
import FormAlert from "../../components/FormAlert";
import { FORM_LABELS } from "../../utils/formLabels";
import { VALIDATION_MESSAGES } from "../../utils/validationMessages";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import { projectApi } from "../../api/projectApi";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { useMessage } from "../../hooks/useMessage";

export default function ProjectEdit() {
  const { id } = useParams();

  // 管理者以外は詳細画面へリダイレクト
  useAdminGuard(`/projects/${id}`);

  const navigate = useNavigate();
  const { showError, clearMessage } = useMessage();

  const labels = FORM_LABELS.project;

  const [projectForm, setProjectForm] = useState({
    projectId: id,
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
      .getEditData(id)
      .then((data) => {
        if (data.project) {
          setProjectForm(data.project);
        } else {
          setProjectForm(data);
        }
        if (data.clients) setClients(data.clients);
        if (data.companies) setCompanies(data.companies);
      })
      .catch((err) => {
        console.error("データ取得エラー:", err);
        showError("案件情報の取得に失敗しました。");
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectForm({
      ...projectForm,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!projectForm.projectName.trim()) {
      newErrors.projectName = VALIDATION_MESSAGES.required(labels.projectName);
    }
    if (!projectForm.clientId) {
      newErrors.clientId = VALIDATION_MESSAGES.required(labels.clientId);
    }
    if (!projectForm.companyId) {
      newErrors.companyId = VALIDATION_MESSAGES.required(labels.companyId);
    }
    if (!projectForm.projectStaffname.trim()) {
      newErrors.projectStaffname = VALIDATION_MESSAGES.required(
        labels.projectStaffname,
      );
    }
    if (!projectForm.contractType) {
      newErrors.contractType = VALIDATION_MESSAGES.required(
        labels.contractType,
      );
    }
    if (!projectForm.status) {
      newErrors.status = VALIDATION_MESSAGES.required(labels.status);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setHasError(true);
      return;
    }

    setHasError(false);
    setErrors({});
    clearMessage();

    projectApi
      .update(id, projectForm)
      .then(() => {
        navigate(`/projects/${id}`, {
          state: { message: "案件情報を更新しました。" },
        });
      })
      .catch((err) => {
        console.error("更新エラー:", err);
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
          showError(errorData?.errorMessage || "更新処理に失敗しました。");
        }
      });
  };

  return (
    <div className="content-wrapper">
      <PageHeader title="案件情報編集" />

      <div className="card">
        <form onSubmit={handleSubmit} className="edit-form">
          <FormAlert hasError={hasError} />

          <div className="form-vertical-layout">
            <div className="form-group-block">
              <label>
                {labels.projectName} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={projectForm.projectName || ""}
                onChange={handleChange}
                placeholder="案件名を入力"
                className={errors.projectName ? "field-error" : ""}
              />
              <FieldError message={errors.projectName} />
            </div>

            <div className="form-group-block">
              <label>
                {labels.clientId} <span className="required">(必須)</span>
              </label>
              <select
                name="clientId"
                value={projectForm.clientId || ""}
                onChange={handleChange}
                className={errors.clientId ? "field-error" : ""}
              >
                <option value="">顧客を選択してください</option>
                {clients.map((c) => (
                  <option key={c.clientId} value={c.clientId}>
                    {c.clientName}
                  </option>
                ))}
              </select>
              <FieldError message={errors.clientId} />
            </div>

            <div className="form-group-block">
              <label>
                {labels.companyId} <span className="required">(必須)</span>
              </label>
              <select
                name="companyId"
                value={projectForm.companyId || ""}
                onChange={handleChange}
                className={errors.companyId ? "field-error" : ""}
              >
                <option value="">発注業者を選択してください</option>
                {companies.map((comp) => (
                  <option key={comp.companyId} value={comp.companyId}>
                    {comp.companyName}
                  </option>
                ))}
              </select>
              <FieldError message={errors.companyId} />
            </div>

            <div className="form-group-block">
              <label>
                {labels.projectStaffname}{" "}
                <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name="projectStaffname"
                value={projectForm.projectStaffname || ""}
                onChange={handleChange}
                placeholder="担当者名を入力"
                className={errors.projectStaffname ? "field-error" : ""}
              />
              <FieldError message={errors.projectStaffname} />
            </div>

            <div className="form-group-block">
              <label>
                {labels.contractType} <span className="required">(必須)</span>
              </label>
              <select
                name="contractType"
                value={projectForm.contractType || ""}
                onChange={handleChange}
                className={errors.contractType ? "field-error" : ""}
              >
                <option value="">契約種別を選択してください</option>
                <option value="定期">定期</option>
                <option value="臨時">臨時</option>
              </select>
              <FieldError message={errors.contractType} />
            </div>

            <div className="form-group-block">
              <label>
                {labels.status} <span className="required">(必須)</span>
              </label>
              <select
                name="status"
                value={projectForm.status || ""}
                onChange={handleChange}
                className={errors.status ? "field-error" : ""}
              >
                <option value="">案件状態を選択してください</option>
                <option value="進行中">進行中</option>
                <option value="休止中">休止中</option>
                <option value="完了">完了</option>
              </select>
              <FieldError message={errors.status} />
            </div>

            <div className="form-group-block">
              <label>{labels.projectRemarks}</label>
              <textarea
                name="projectRemarks"
                value={projectForm.projectRemarks || ""}
                onChange={handleChange}
                placeholder="特記事項を入力"
                rows="4"
                className={errors.projectRemarks ? "field-error" : ""}
              ></textarea>
              <FieldError message={errors.projectRemarks} />
            </div>

            <div className="action-buttons-form">
              <Button type="submit" variant="primary">
                更新する
              </Button>
              <Button to={`/projects/${id}`} variant="cancel">
                戻る
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
