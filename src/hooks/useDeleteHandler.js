import { useNavigate } from "react-router";
import { axiosInstance } from "../api/axiosInstance";
import { useDialog } from "./useDialog";
import { useMessage } from "./useMessage";

export function useDeleteHandler(deleteUrl, redirectUrl, successMessage) {
  const navigate = useNavigate();
  const { confirm } = useDialog();
  const { showError } = useMessage();

  const handleDelete = async (confirmMessage = "本当に削除しますか？") => {
    const ok = await confirm(confirmMessage, {
      title: "削除の確認",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;

    axiosInstance
      .delete(deleteUrl)
      .then(() => {
        navigate(redirectUrl, { state: { message: successMessage } });
      })
      .catch((error) => {
        console.error("削除エラー:", error);
        showError(error.response?.data?.errorMessage || "削除に失敗しました。");
      });
  };

  return { handleDelete };
}
