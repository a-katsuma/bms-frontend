import { useParams } from "react-router";
import BaseEntityForm from "../../components/BaseEntityForm";
import { FORM_LABELS } from "../../utils/formLabels";
import { useAdminGuard } from "../../hooks/useAdminGuard";



export default function ClientEdit() {
  const { id } = useParams();

  // 管理者以外は自動で "/clients" へリダイレクト
useAdminGuard("/clients");

  return (
    <BaseEntityForm
      title="顧客情報編集"
      apiEndpoint="/clients"
      idKey="clientId"
      labels={FORM_LABELS.client}
      isEdit={true}
    />
  );
}
