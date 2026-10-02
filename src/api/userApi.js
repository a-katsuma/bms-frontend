import { axiosInstance } from "./axiosInstance";

export const userApi = {
  // ログイン
  login: async (credentials) => {
    const response = await axiosInstance.post("/users/login", credentials);
    return response.data;
  },

  // ログアウト
  logout: async () => {
    const response = await axiosInstance.post("/users/logout");
    return response.data;
  },

  // 現在のログインユーザー情報取得
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/users/current");
    return response.data;
  },

  toggleStatus: async (userId) => {
    const response = await axiosInstance.patch(`/users/${userId}/status`);
    return response.data;
  },

  // パスワード再発行（管理者代理）
  resetPassword: async (userId) => {
    const response = await axiosInstance.post(
      `/users/${userId}/reset-password`,
    );
    return response.data;
  },

  // メールアドレス変更（管理者代理）
  updateEmail: async (userId, newEmail) => {
    const response = await axiosInstance.patch(`/users/${userId}/email`, {
      email: newEmail,
    });
    return response.data;
  },

  // 代表ユーザーの交代
  transferMaster: async (companyId, newMasterUserId) => {
    const response = await axiosInstance.patch(
      `/users/companys/${companyId}/master/transfer`,
      { newMasterUserId },
    );
    return response.data;
  },

  // パスワードを忘れた（本人・未ログイン）
  forgotPassword: async (loginId) => {
    const response = await axiosInstance.post("/users/forgot-password", {
      loginId,
    });
    return response.data;
  },

  // トークンから新パスワード確定
  confirmResetPassword: async (token, newPassword) => {
    const response = await axiosInstance.post("/users/reset-password/confirm", {
      token,
      newPassword,
    });
    return response.data;
  },

  // 本人がログイン後にパスワード変更
  changeMyPassword: async (currentPassword, newPassword) => {
    const response = await axiosInstance.post("/users/me/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // 本人がログイン後にメール変更
  updateMyEmail: async (currentPassword, newEmail) => {
    const response = await axiosInstance.patch("/users/me/email", {
      currentPassword,
      newEmail,
    });
    return response.data;
  },

  // 一般ユーザー追加
  getMyCompanyUsers: async () => {
    const response = await axiosInstance.get("/users/me/company/users");
    return response.data;
  },

  addGeneralUser: async (name, email) => {
    const response = await axiosInstance.post("/users/me/company/users", {
      name,
      email,
    });
    return response.data;
  },

  // 一般ユーザーのメールアドレスを変更(代表ユーザー代理)
  updateGeneralUserEmail: async (userId, newEmail) => {
    const response = await axiosInstance.patch(
      `/users/me/company/users/${userId}/email`,
      { email: newEmail },
    );
    return response.data;
  },

// ユーザー名変更（本人）
    updateMyName: async (name) => {
    const response = await axiosInstance.patch("/users/me/name", { name });
    return response.data;
  },

  // 一般ユーザーのパスワードを変更(代理)
 resetGeneralUserPassword: async (userId) => {
  const response = await axiosInstance.post(`/users/me/company/users/${userId}/reset-password`);
  return response.data;
  },

    getMyBusinessPolicy: async () => {
  const response = await axiosInstance.get("/users/me/company/business-policy");
  return response.data;
},

setMyBusinessPolicy: async (isAgreed, markupRate, acknowledgePendingWorkUsesOldRate) => {
  const response = await axiosInstance.post("/users/me/company/business-policy", {
    isAgreed,
    markupRate,
    acknowledgePendingWorkUsesOldRate,
  });
  return response.data;
},
};
