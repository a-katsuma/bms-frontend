import { axiosInstance } from "./axiosInstance";

export const baseApi = {
  // ベース明細取得（isAdmin に応じてパスを切り替える）
  get: async (projectId, isAdmin = true) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/projects/${projectId}/base`);
    return response.data;
  },

  // 保存（生成・訂正・改版）
  save: async (projectId, payload) => {
    const response = await axiosInstance.post(`/projects/${projectId}/base/save`, payload);
    return response.data;
  },


  // 現況確認表とベース明細に差がある案件（管理者ホーム用）
  getDiffAlerts: async () => {
    const response = await axiosInstance.get("/home/base-alerts");
    return response.data;
  },

};
