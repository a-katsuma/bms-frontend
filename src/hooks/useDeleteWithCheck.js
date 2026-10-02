// src/hooks/useDeleteWithCheck.js
import { useDeleteHandler } from "./useDeleteHandler";
import { useDialog } from "./useDialog";

export function useDeleteWithCheck(
  deleteUrl,
  redirectUrl,
  successMessage,
  checkFunction,
) {
  // 2回目の確認（本当に削除しますか？）と削除API実行を担当する既存フックを内部で利用
  const { handleDelete: executeDelete } = useDeleteHandler(
    deleteUrl,
    redirectUrl,
    successMessage,
  );
  const { confirm } = useDialog();

  const handleDeleteWithCheck = async () => {
    try {
      // 1. 各ページから渡された「関連データの有無をチェックする関数」を実行
      if (checkFunction) {
        const hasRelatedData = await checkFunction();

        // 2. 関連データがある場合のみ、1回目の確認メッセージを表示
        if (hasRelatedData) {
          const ok = await confirm(
            "関連データが登録されていますが削除しますか？",
            { title: "関連データがあります", okLabel: "次へ", danger: true },
          );
          if (!ok) return; // 「キャンセル」が選ばれたらここでストップ
        }
      }

      // 3. 関連データがない場合、または1回目の確認で「次へ」が選ばれた場合
      //    既存フック（useDeleteHandler）による2回目の確認へ進む
      executeDelete();
    } catch (error) {
      console.error("削除前チェックエラー:", error);
      // 万が一チェック処理自体がエラーになった場合は、安全のためそのまま2回目の確認へ進む
      executeDelete();
    }
  };

  return { handleDeleteWithCheck };
}
