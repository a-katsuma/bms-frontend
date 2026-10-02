// src/hooks/useAdminGuard.js
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../atoms/loginUserAtom";

/**
 * 管理者権限（roleFlag === 1）をチェックし、管理者以外なら指定パスにリダイレクトするカスタムフック
 * @param {string} redirectPath - 管理者以外を飛ばす先のパス (デフォルト: "/")
 */
export const useAdminGuard = (redirectPath = "/") => {
  const loginUser = useAtomValue(loginUserAtom);
  const navigate = useNavigate();
  const isAdmin = loginUser?.roleFlag === 1;

  useEffect(() => {
    // ユーザー情報がロードされた後（必要に応じて）、管理者でなければリダイレクト
    // ※loginUserがnullの間の考慮が必要な場合は適宜調整が必要
    if (loginUser !== null && !isAdmin) {
      navigate(redirectPath, { replace: true });
    }
  }, [loginUser, isAdmin, navigate, redirectPath]);

  return { isAdmin };
};