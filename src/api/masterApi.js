import { axiosInstance } from "./axiosInstance";

export const masterApi = {
  // 一覧取得（{ ITEM: [...], UNIT: [...], OTHER: [...] }）
  getAll: async () => {
    const response = await axiosInstance.get("/masters");
    return response.data;
  },

  // 新規登録
  add: async (master) => {
    const response = await axiosInstance.post("/masters/add", master);
    return response.data;
  },

  // 編集
  update: async (id, master) => {
    const response = await axiosInstance.post(`/masters/edit/${id}`, master);
    return response.data;
  },

  // 削除
  remove: async (id) => {
    const response = await axiosInstance.delete(`/masters/${id}`);
    return response.data;
  },

  // 並び替え（direction: "up" | "down"）
  move: async (id, direction) => {
    const response = await axiosInstance.post(`/masters/move/${id}`, null, {
      params: { direction },
    });
    return response.data;
  },

};
