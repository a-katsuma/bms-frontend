import { axiosInstance } from "./axiosInstance";

export const companyApi = {
  // 業者一覧の取得
  getList: async (page = 1) => {
    const response = await axiosInstance.get("/companys", { params: { page } });
    return response.data;
  },

  // 業者詳細の取得
  getDetail: async (id, page = 1) => {
    const response = await axiosInstance.get(`/companys/${id}`, {
      params: { page },
    });
    return response.data;
  },

  // 編集用データの取得
  getEditData: async (id) => {
    const response = await axiosInstance.get(`/companys/edit/${id}`);
    return response.data;
  },

  // 業者登録
  add: async (data) => {
    const response = await axiosInstance.post("/companys", data);
    return response.data;
  },

  // 業者更新
  update: async (id, data) => {
        const response = await axiosInstance.put(`/companys/${id}`, data);
    return response.data;
  },

  // 業者削除
  delete: async (id) => {
    const response = await axiosInstance.delete(`/companys/${id}`);
    return response.data;
  },
};