import React from "react";
import { Link, useLocation } from "react-router";

export default function PolicyWarningAlert({ loginUser }) {
  const location = useLocation();

  if (loginUser?.roleFlag === 1 || loginUser?.businessPolicyAgreed !== false) {
    return null;
  }

  // 設定画面内ではアラートを表示しない
  if (location.pathname === "/company/business-policy") {
    return null;
  }

  return (
    <div className="alert alert-danger policy-warning-alert">
      ※事前承認が未承認です。代表ユーザーが承認するまで、
      お客様からの緊急・追加作業を現場で承ることが出来ません。
      {loginUser.roleFlag === 2 && (
        <>
          {" "}
          <Link to="/company/business-policy">今すぐ設定する</Link>
        </>
      )}
    </div>
  );
}