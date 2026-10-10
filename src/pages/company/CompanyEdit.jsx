import { useParams } from "react-router";
import BaseEntityForm from "../../components/BaseEntityForm";
import { FORM_LABELS } from "../../utils/formLabels";
import { useAdminGuard } from "../../hooks/useAdminGuard";

export default function CompanyEdit() {
  const { id } = useParams();

   // 管理者以外はホームへリダイレクト
    useAdminGuard("/");

  return (
    <BaseEntityForm
      title="発注元情報編集"
      apiEndpoint="/companys"
      idKey="companyId"
      labels={FORM_LABELS.company}
      isEdit={true}
    />
  );
}
