import axios from "axios";
import { showGlobalError } from "../atoms/messageAtom";
import { API_BASE_URL } from "../config";

// 共通のベースURLを持つAxiosインスタンスを作成
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // 開発は http://localhost:8080/api、本番は /api（config.js）
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// レスポンス・エラーのインターセプター（共通エラーハンドリング）
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 403) {
      showGlobalError("アクセス権限がありません（403 Forbidden）。", {
        keep: true,
      });
    } else if (status === 500) {
      showGlobalError("サーバー側でエラーが発生しました。", { keep: true });
    } else if (!error.response) {
      showGlobalError(
        "サーバーに接続できませんでした。通信状態を確認してください。",
        { keep: true },
      );
    }
    return Promise.reject(error);
  },
);
