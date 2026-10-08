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
    const response = await axiosInstance.get(`${prefix}/projects`, {
      params: { page },
    });
    return response.data;
  },

  // 削除済みの案件一覧（管理者のみ）
  getDeletedList: async (page = 1) => {
    const response = await axiosInstance.get("/projects/deleted", {
      params: { page },
    });
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
    const response = await axiosInstance.put(`/projects/${id}`, projectForm);

    return response.data;
  },

  // 見積追加
  addQuote: async (id, formData) => {
    const response = await axiosInstance.post(
      `/projects/${id}/quotes/add`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

    // 見積りの削除（論理削除。削除済みの見積りから復元できる）
  deleteQuote: async (id, quoteId) => {
    const response = await axiosInstance.delete(
      `/projects/${id}/quotes/${quoteId}`,
    );
    return response.data;
  },

  // 見積りの復元
  restoreQuote: async (id, quoteId) => {
    const response = await axiosInstance.post(
      `/projects/${id}/quotes/${quoteId}/restore`,
    );
    return response.data;
  },

  // 見積りを完全に削除（削除済みの見積りだけ。判定履歴・PDF も削除）
  purgeQuote: async (id, quoteId) => {
    const response = await axiosInstance.delete(
      `/projects/${id}/quotes/${quoteId}/permanent`,
    );
    return response.data;
  },

  // 見積編集用データ取得
  getQuote: async (pid, id) => {
    const response = await axiosInstance.get(`/projects/${pid}/quotes/${id}`);
    return response.data;
  },

    // 見積りの判定期限の変更（最新・未判定の見積りだけ。ファイルの差し替えは再見積りで登録する）
  updateQuoteDeadline: async (pid, id, deadlineDate) => {
    const response = await axiosInstance.put(`/projects/${pid}/quotes/${id}`, {
      deadlineDate,
    });
    return response.data;
  },


  // 見積判定用API
  judgeQuote: async (projectId, quoteId, status) => {
    const response = await axiosInstance.post(
      `/contractee/projects/${projectId}/quotes/judge/${quoteId}`,
      { status: status }, // JSONボディとして送信する
    );
    return response.data;
  },
};
