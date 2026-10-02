import { useSetAtom } from "jotai";
import { dialogAtom } from "../atoms/dialogAtom";

/**
 * window.confirm / window.prompt の代わり（答えを Promise で返す）
 *   if (!(await confirm("削除しますか？", { danger: true, okLabel: "削除" }))) return;
 *   const name = (await prompt("新しい棟名を入力してください", "A棟"))?.trim(); // キャンセルは null
 * options：title（見出し）、okLabel（OKボタンの文字）、danger（OKボタンを赤に）、maxLength（入力の文字数）、inputType（"email" など） */
export function useDialog() {
  const setDialog = useSetAtom(dialogAtom);

  const open = (dialog) =>
    new Promise((resolve) =>
      setDialog((prev) => {
        // 念のため：前のダイアログが開いたままなら、キャンセル扱いで閉じる
        prev?.resolve(prev.kind === "prompt" ? null : false);
        return { ...dialog, resolve };
      }),
    );

  const confirm = (message, options = {}) =>
    open({ kind: "confirm", message, ...options });

  const prompt = (message, defaultValue = "", options = {}) =>
    open({ kind: "prompt", message, defaultValue, ...options });

  return { confirm, prompt };
}
