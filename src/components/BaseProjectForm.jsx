// src/components/BaseProjectForm.jsx
import FieldError from "./FieldError";
import FormAlert from "./FormAlert";
import Button from "../atoms/Button";
import PageHeader from "./PageHeader";

export default function BaseProjectForm({
  title,
  projectForm,
  clients,
  companies,
  errors,
  hasError,
  labels,
  onChange,
  onSubmit,
  isEdit = false,
  cancelTo,
}) {
  return (
    <div className="content-wrapper">
      <PageHeader title={title} />

      <div className="card">
        <form onSubmit={onSubmit} className={isEdit ? "edit-form" : ""}>
          <FormAlert hasError={hasError} />

          <div className="form-vertical-layout">
            {/* 案件名 */}
            <div className="form-group-block">
              <label>
                {labels.projectName} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={projectForm.projectName || ""}
                onChange={onChange}
                placeholder="案件名を入力"
                className={errors.projectName ? "field-error" : ""}
              />
              <FieldError message={errors.projectName} />
            </div>

            {/* 顧客選択 */}
            <div className="form-group-block">
              <label>
                {labels.clientId} <span className="required">(必須)</span>
              </label>
              <select
                name="clientId"
                value={projectForm.clientId || ""}
                onChange={onChange}
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

            {/* 発注業者選択 */}
            <div className="form-group-block">
              <label>
                {labels.companyId} <span className="required">(必須)</span>
              </label>
              <select
                name="companyId"
                value={projectForm.companyId || ""}
                onChange={onChange}
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

            {/* 担当者名 */}
            <div className="form-group-block">
              <label>
                {labels.projectStaffname} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name="projectStaffname"
                value={projectForm.projectStaffname || ""}
                onChange={onChange}
                placeholder="担当者名を入力"
                className={errors.projectStaffname ? "field-error" : ""}
              />
              <FieldError message={errors.projectStaffname} />
            </div>

            {/* 契約種別 */}
            <div className="form-group-block">
              <label>
                {labels.contractType} <span className="required">(必須)</span>
              </label>
              <select
                name="contractType"
                value={projectForm.contractType || ""}
                onChange={onChange}
                className={errors.contractType ? "field-error" : ""}
              >
                <option value="">契約種別を選択してください</option>
                <option value="定期">定期</option>
                <option value="臨時">臨時</option>
              </select>
              <FieldError message={errors.contractType} />
            </div>

            {/* 案件状態 */}
            <div className="form-group-block">
              <label>
                {labels.status} <span className="required">(必須)</span>
              </label>
              <select
                name="status"
                value={projectForm.status || ""}
                onChange={onChange}
                className={errors.status ? "field-error" : ""}
              >
                <option value="">案件状態を選択してください</option>
                <option value="進行中">進行中</option>
                <option value="休止中">休止中</option>
                <option value="完了">完了</option>
              </select>
              <FieldError message={errors.status} />
            </div>

            {/* 特記事項 */}
            <div className="form-group-block">
              <label>{labels.projectRemarks}</label>
              <textarea
                name="projectRemarks"
                value={projectForm.projectRemarks || ""}
                onChange={onChange}
                placeholder="特記事項を入力"
                rows="4"
                className={errors.projectRemarks ? "field-error" : ""}
              ></textarea>
              <FieldError message={errors.projectRemarks} />
            </div>

            {/* ボタン */}
            <div className={isEdit ? "action-buttons-form" : "action-buttons"}>
              <Button type="submit" variant="primary">
                {isEdit ? "更新する" : "登録する"}
              </Button>
              <Button to={cancelTo} variant="cancel">
                {isEdit ? "戻る" : "戻る"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}