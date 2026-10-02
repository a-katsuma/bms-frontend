import { axiosInstance } from "./axiosInstance";

const prefixOf = (isAdmin) => (isAdmin ? "" : "/contractee");

export const statementApi = {
  // 一覧（業者は確定分のみ）
  getList: async (projectId, isAdmin = true) => {
    const response = await axiosInstance.get(`${prefixOf(isAdmin)}/projects/${projectId}/statements`);
    return response.data;
  },

  // 1件
  get: async (projectId, statementId, isAdmin = true) => {
    const response = await axiosInstance.get(
      `${prefixOf(isAdmin)}/projects/${projectId}/statements/${statementId}`,
    );
    return response.data;
  },

  // 作成（ベースの現在の版をコピー）
  create: async (projectId, billingMonth) => {
    const response = await axiosInstance.post(`/projects/${projectId}/statements/add`, { billingMonth });
    return response.data;
  },

  // 下書き保存
  save: async (projectId, statementId, payload) => {
    const response = await axiosInstance.post(
      `/projects/${projectId}/statements/${statementId}/save`,
      payload,
    );
    return response.data;
  },

  // 確定（保存してから確定）
  confirm: async (projectId, statementId, payload) => {
    const response = await axiosInstance.post(
      `/projects/${projectId}/statements/${statementId}/confirm`,
      payload,
    );
    return response.data;
  },

  // 確定解除
  unconfirm: async (projectId, statementId) => {
    const response = await axiosInstance.post(`/projects/${projectId}/statements/${statementId}/unconfirm`);
    return response.data;
  },

  // 削除（下書きのみ）
  remove: async (projectId, statementId) => {
    const response = await axiosInstance.delete(`/projects/${projectId}/statements/${statementId}`);
    return response.data;
  },
};
