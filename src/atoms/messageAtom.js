import { atom, getDefaultStore } from "jotai";

// 画面上部の共通メッセージ（null＝表示なし）
// { type: "danger", text, id, keep }
//   id  ：同じ文言を続けて出したときも、表示し直してスクロールするため
//   keep：true なら、次の画面移動1回では消さない（エラーのあとに別の画面へ移動する場合）
export const globalMessageAtom = atom(null);

// React の外（axiosInstance など）からエラーを出す
export const showGlobalError = (text, { keep = false } = {}) =>
  getDefaultStore().set(globalMessageAtom, {
    type: "danger",
    text,
    id: Date.now(),
    keep,
  });
