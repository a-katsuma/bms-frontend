import BaseEntityForm from "../../components/BaseEntityForm";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { FORM_LABELS } from "../../utils/formLabels";

export default function ClientRegister() {
  // 管理者以外は自動で "/clients" へリダイレクト
 useAdminGuard("/clients");

  return (
    <BaseEntityForm
      title="新規顧客登録"
      apiEndpoint="/clients"
      idKey="clientId"
      labels={FORM_LABELS.client}
    />
  );
}
