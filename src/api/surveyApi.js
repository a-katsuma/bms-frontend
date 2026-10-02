import { axiosInstance } from "./axiosInstance";

export const surveyApi = {
  // 現状確認表取得（isAdmin に応じてパスを切り替える）
  get: async (projectId, isAdmin = true) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/projects/${projectId}/survey`);
    return response.data;
  },

  // 保存（新規作成・編集）
  save: async (projectId, items) => {
    const response = await axiosInstance.post(`/projects/${projectId}/survey/save`, { items });
    return response.data;
  },
};
