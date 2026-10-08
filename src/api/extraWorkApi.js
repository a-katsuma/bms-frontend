import { axiosInstance } from "./axiosInstance";

const baseOf = (projectId) => `/projects/${projectId}/extra-works`;

// 緊急・追加作業（管理者のみ）
//   全体の一覧・新規受注：/extra-works
//   作業ごとの操作　　　：/projects/{projectId}/extra-works/{extraWorkId}
export const extraWorkApi = {
  // 全体の一覧（openOnly：済んでいないもの＝未請求・未取り込みだけ。clientId・companyId で絞り込み）
  search: async ({ clientId, companyId, openOnly = true } = {}) => {
    const response = await axiosInstance.get("/extra-works", {
      params: { clientId, companyId, openOnly },
    });
    return response.data;
  },

  // 新規受注の選択肢（clients・companies（事前承認の履歴付き）・pairs・defaultTaxRate）
  getNewForm: async () => {
    const response = await axiosInstance.get("/extra-works/new");
    return response.data;
  },

  // 新規受注（例外の案件と作業を一緒に作る）。payload：{ clientId, companyId, projectName, work }
  create: async (payload) => {
    const response = await axiosInstance.post("/extra-works/add", payload);
    return response.data;
  },

  // 毎次明細に取り込める作業（同じ顧客・業者で、受注済み・未請求・未取り込み。行付き）
  getImportCandidates: async (clientId, companyId) => {
    const response = await axiosInstance.get("/extra-works/import-candidates", {
      params: { clientId, companyId },
    });
    return response.data;
  },

  // 案件の作業（案件詳細用。1案件＝1作業）
  getByProject: async (projectId) => {
    const response = await axiosInstance.get(baseOf(projectId));
    return response.data;
  },

  // 1件
  get: async (projectId, extraWorkId) => {
    const response = await axiosInstance.get(
      `${baseOf(projectId)}/${extraWorkId}`,
    );
    return response.data;
  },

  // 保存（受注済みは保留に戻る）
  save: async (projectId, extraWorkId, payload) => {
    const response = await axiosInstance.put(
      `${baseOf(projectId)}/${extraWorkId}`,
       payload,
    );
    return response.data;
  },

  // 受注
  order: async (projectId, extraWorkId) => {
    const response = await axiosInstance.post(
      `${baseOf(projectId)}/${extraWorkId}/order`,
    );
    return response.data;
  },

  // 保留（下書きから）
  hold: async (projectId, extraWorkId) => {
    const response = await axiosInstance.post(
      `${baseOf(projectId)}/${extraWorkId}/hold`,
    );
    return response.data;
  },

  // 下書きに戻す（受注済み・未取り込み・未請求）
  revert: async (projectId, extraWorkId) => {
    const response = await axiosInstance.post(
      `${baseOf(projectId)}/${extraWorkId}/revert`,
    );
    return response.data;
  },

  // 請求済みにする（billedDate：YYYY-MM-DD）
  billed: async (projectId, extraWorkId, billedDate) => {
    const response = await axiosInstance.post(
      `${baseOf(projectId)}/${extraWorkId}/billed`,
      {
        billedDate,
      },
    );
    return response.data;
  },

  // 請求済みを取り消す
  unbilled: async (projectId, extraWorkId) => {
    const response = await axiosInstance.post(
      `${baseOf(projectId)}/${extraWorkId}/unbilled`,
    );
    return response.data;
  },

  // 削除（例外の案件は案件も削除）
  remove: async (projectId, extraWorkId) => {
    const response = await axiosInstance.delete(
      `${baseOf(projectId)}/${extraWorkId}`,
    );
    return response.data;
  },
};
