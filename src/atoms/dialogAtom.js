import { atom } from "jotai";

// 表示中の確認・入力ダイアログ（null＝表示していない）
// { kind: "confirm" | "prompt", message, title, defaultValue, okLabel, danger, maxLength, resolve }
export const dialogAtom = atom(null);
