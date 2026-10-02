import { axiosInstance } from "./axiosInstance";

export const projectApi = {
  // ダッシュボード（Home）用データ取得
  getHomeData: async (qPage = 1, pPage = 1, isAdmin = true) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/home`, {
      params: { qPage, pPage },
    });
    return response.data;
  },

  // 案件一覧取得（isAdmin に応じてパスを切り替える）
  getList: async (page = 1, isAdmin = true) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/projects`, { params: { page } });
    return response.data;
  },


  // 削除済みの案件一覧（管理者のみ）
  getDeletedList: async (page = 1) => {
    const response = await axiosInstance.get("/projects/deleted", { params: { page } });
    return response.data;
  },

  // 復元（管理者のみ）
  restore: async (id) => {
    const response = await axiosInstance.post(`/projects/${id}/restore`);
    return response.data;
  },


  // 案件新規登録用のフォームデータ（顧客・業者一覧）取得
  getFormData: async () => {
    const response = await axiosInstance.get("/projects/form-data");
    return response.data;
  },

  // 案件新規登録
  add: async (projectForm) => {
    const response = await axiosInstance.post("/projects/add", projectForm);
    return response.data;
  },

  // 案件詳細取得
  getDetail: async (id, isAdmin = true) => {
    const prefix = isAdmin ? "" : "/contractee";
    const response = await axiosInstance.get(`${prefix}/projects/${id}`);
    return response.data;
  },

  // 案件編集用データ取得
  getEditData: async (id) => {
    const response = await axiosInstance.get(`/projects/edit/${id}`);
    return response.data;
  },

  // 案件更新
  update: async (id, projectForm) => {
    const response = await axiosInstance.post(`/projects/edit/${id}`, projectForm);
    return response.data;
  },

  // 見積追加
  addQuote: async (id, formData) => {
    const response = await axiosInstance.post(`/projects/${id}/quotes/add`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 見積削除
  deleteQuote: async (id, quoteId) => {
    const response = await axiosInstance.delete(`/projects/${id}/quotes/${quoteId}`);
    return response.data;
  },

  // 見積編集用データ取得
  getQuote: async (pid, id) => {
    const response = await axiosInstance.get(`/projects/${pid}/quotes/${id}`);
    return response.data;
  },

  // 見積更新
  updateQuote: async (pid, id, formData) => {
    const response = await axiosInstance.post(`/projects/${pid}/quotes/edit/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 見積判定用API
  judgeQuote: async (projectId, quoteId, status) => {
    const response = await axiosInstance.post(
      `/contractee/projects/${projectId}/quotes/judge/${quoteId}`,
      { status: status } // JSONボディとして送信する
    );
    return response.data;
  },
};