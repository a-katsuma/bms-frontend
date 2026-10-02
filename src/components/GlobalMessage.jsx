import { useEffect } from "react";
import { useAtom } from "jotai";
import { useLocation } from "react-router";
import { globalMessageAtom } from "../atoms/messageAtom";
import AlertMessage from "./AlertMessage";

// 画面上部の共通メッセージ欄（App に1つだけ置く。出すのは useMessage / showGlobalError から）
export default function GlobalMessage() {
  const [message, setMessage] = useAtom(globalMessageAtom);
  const { pathname } = useLocation();

  // 別の画面に移動したら消す（keep のものは、1回だけ残す）
  useEffect(() => {
    setMessage((prev) => (prev?.keep ? { ...prev, keep: false } : null));
  }, [pathname]);

  return (
    <AlertMessage
      message={message?.text}
      type={message?.type ?? "danger"}
      scrollKey={message?.id}
      onClose={() => setMessage(null)}
    />
  );
}
