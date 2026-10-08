import { axiosInstance } from "./axiosInstance";

export const baseApi = {
  // ベース明細取得（isAdmin に応じてパスを切り替える。baseId を省略したら使用中の先頭のベース）
  get: async (projectId, isAdmin = true, baseId = null) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/projects/${projectId}/base`, {
      params: baseId ? { baseId } : {},
    });
    return response.data;
  },

    // 新しいベースの作成（payload：baseName, quoteId, taxRate, items, otherItems）
  create: async (projectId, payload) => {
    const response = await axiosInstance.post(`/projects/${projectId}/base`, payload);
    return response.data;
  },

  // 訂正（今の版を上書き。payload：quoteId, taxRate, items, otherItems）
  correct: async (projectId, baseId, payload) => {
    const response = await axiosInstance.put(`/projects/${projectId}/base/${baseId}`, payload);
    return response.data;
  },

  // 改版（新しい版を作る。payload は訂正と同じ）
  revise: async (projectId, baseId, payload) => {
    const response = await axiosInstance.post(
      `/projects/${projectId}/base/${baseId}/versions`,
      payload,
    );
    return response.data;
  },

  // ベース名の変更
  rename: async (projectId, baseId, baseName) => {
    const response = await axiosInstance.put(`/projects/${projectId}/base/${baseId}/name`, {
      baseName,
    });
    return response.data;
  },


  // 使用停止
  stop: async (projectId, baseId) => {
    const response = await axiosInstance.post(`/projects/${projectId}/base/${baseId}/stop`);
    return response.data;
  },

  // 使用再開
  resume: async (projectId, baseId) => {
    const response = await axiosInstance.post(`/projects/${projectId}/base/${baseId}/resume`);
    return response.data;
  },

  // 削除（使用停止中で、毎次明細がないベースだけ）
  remove: async (projectId, baseId) => {
    const response = await axiosInstance.delete(`/projects/${projectId}/base/${baseId}`);
    return response.data;
  },

  // 現況確認表とベース明細に差がある案件（管理者ホーム用）
  getDiffAlerts: async () => {
    const response = await axiosInstance.get("/home/base-alerts");
    return response.data;
  },
};
