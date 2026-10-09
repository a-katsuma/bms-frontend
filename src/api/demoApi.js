import { axiosInstance } from "./axiosInstance";

// 公開デモ用（サーバーがデモモードのときだけ使える）
export const demoApi = {
  // デモモードかどうか（{ enabled: true / false }）
  getInfo: async () => {
    const response = await axiosInstance.get("/demo");
    return response.data;
  },

  // パスワードなしのデモ用ログイン（role："ADMIN" / "MASTER" / "GENERAL"）
  login: async (role) => {
    const response = await axiosInstance.post("/demo/login", { role });
    return response.data;
  },
};
