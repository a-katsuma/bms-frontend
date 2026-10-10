import BaseEntityForm from "../../components/BaseEntityForm";
import { FORM_LABELS } from "../../utils/formLabels";
import { useAdminGuard } from "../../hooks/useAdminGuard";

export default function CompanyRegister() {
   // 管理者以外はホームへリダイレクト
  useAdminGuard("/");

  return (
    <BaseEntityForm
      title="新規発注元登録"
      apiEndpoint="/companys"
      idKey="companyId"
      labels={FORM_LABELS.company}
    />
  );
}