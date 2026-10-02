import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";
import { useDialog } from "./useDialog";

const LEAVE_MESSAGE =
  "保存していない変更があります。\nこのページを離れると、変更は失われます。よろしいですか？";

/**
 * 未保存の変更があるときに、ページを離れる前に確認する。
 * - 画面内の移動（リンク・ブラウザの戻る・navigate）：useBlocker ＋ 共通ダイアログ
 * - リロード・タブを閉じる：beforeunload（文言はブラウザ標準）
 * 保存・削除のあとに navigate するときは、先に allowLeave() を呼ぶ。
 */
export function useUnsavedChangesGuard(dirty) {
  const allowedRef = useRef(false);
  const askingRef = useRef(false); // 確認ダイアログを二重に開かない
  const { confirm } = useDialog();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allowedRef.current &&
      nextLocation.pathname !== "/login" && // ログアウトは止めない
      currentLocation.pathname !== nextLocation.pathname,
  );

  // 画面内の移動を止めたときの確認
  useEffect(() => {
    if (blocker.state !== "blocked" || askingRef.current) return;
    askingRef.current = true;
    confirm(LEAVE_MESSAGE, {
      title: "未保存の変更があります",
      okLabel: "移動する",
      danger: true,
    })
      .then((ok) => (ok ? blocker.proceed() : blocker.reset()))
      .finally(() => {
        askingRef.current = false;
      });
  }, [blocker]);

  // リロード・タブを閉じるときの確認
  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // 古いブラウザ向け
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // 次の移動だけ確認なしで通す（保存・削除のあと）
  const allowLeave = () => {
    allowedRef.current = true;
  };

  return { allowLeave };
}
