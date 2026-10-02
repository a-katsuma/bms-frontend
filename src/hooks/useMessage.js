import { useSetAtom } from "jotai";
import { globalMessageAtom } from "../atoms/messageAtom";

/**
 * 画面上部の共通メッセージ欄にエラーを出す（alert の代わり）
 *   const { showError } = useMessage();
 *   showError(error.response?.data?.errorMessage || "処理に失敗しました。");
 */
export function useMessage() {
  const setMessage = useSetAtom(globalMessageAtom);

  const showError = (text, { keep = false } = {}) =>
    setMessage({ type: "danger", text, id: Date.now(), keep });

  const clearMessage = () => setMessage(null);

  return { showError, clearMessage };
}
