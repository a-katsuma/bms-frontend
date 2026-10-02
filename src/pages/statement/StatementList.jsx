import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import DataTable from "../../components/DataTable";
import NoDataMessage from "../../components/NoDataMessage";
import { statementApi } from "../../api/statementApi";
import { yen, formatDate } from "../../utils/baseUtils";
import {
  formatMonth,
  thisMonth,
  statusClass,
  totalsFromSubtotal,
} from "../../utils/statementUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

export default function StatementList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { confirm } = useDialog();
  const { showError } = useMessage();

  const [data, setData] = useState(null);
  const [billingMonth, setBillingMonth] = useState(thisMonth());
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message ?? "",
  );

  useEffect(() => {
    setLoading(true);
    statementApi
      .getList(id, isAdmin)
      .then(setData)
      .catch((error) => {
        console.error("毎次明細一覧取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate(`/projects/${id}`);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

  if (loading || !data) {
    return <Loading />;
  }

  const { project, statements = [], currentVersionNo = null } = data;

  const handleCreate = async () => {
    if (!billingMonth) {
      showError("請求年月を入力してください。");
      return;
    }
    const exists = statements.some((s) => s.billingMonth === billingMonth);
    const message = exists
      ? `${formatMonth(billingMonth)}の明細は既にあります。もう1件作成しますか？`
      : `${formatMonth(billingMonth)}の明細を作成しますか？\n（ベース明細 第${currentVersionNo}版の内容をコピーします）`;
    const ok = await confirm(message, {
      title: "毎次明細の作成",
      okLabel: "作成",
    });
    if (!ok) return;

    setCreating(true);
    statementApi
      .create(id, billingMonth)
      .then((res) =>
        navigate(`/projects/${id}/statements/${res.statementId}`, {
          state: { message: res.message },
        }),
      )
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "作成に失敗しました。");
      })
      .finally(() => setCreating(false));
  };

  const summaryItems = [
    { label: "案件名", value: project.projectName },
    { label: "顧客名", value: project.clientName },
  ];
  if (isAdmin) {
    summaryItems.push({
      label: "ベース明細",
      value: currentVersionNo ? (
        `第${currentVersionNo}版`
      ) : (
        <span className="text-danger">未生成</span>
      ),
    });
  }

  const columns = [
    { label: "請求年月", render: (s) => formatMonth(s.billingMonth) },
    {
      label: "状態",
      render: (s) => <span className={statusClass(s.status)}>{s.status}</span>,
    },
    {
      label: "合計（税込）",
      align: "right",
      render: (s) => yen(totalsFromSubtotal(s.subtotal, s.taxRate).total),
    },
    {
      label: "元のベース",
      render: (s) => (s.versionNo ? `第${s.versionNo}版` : "-"),
    },
    {
      label: "発行日",
      render: (s) => (s.issuedDate ? formatDate(s.issuedDate) : "-"),
    },
    {
      label: "操作",
      render: (s) => (
        <Button
          to={`/projects/${id}/statements/${s.statementId}`}
          variant="primary"
        >
          開く
        </Button>
      ),
    },
  ];

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="毎次明細" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>概要</h3>
        <DetailList items={summaryItems} />
        <div className="survey-back">
          <Button to={`/projects/${id}`} variant="cancel">
            案件詳細へ戻る
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h3>新しい明細を作成</h3>
          {currentVersionNo ? (
            <div className="flex-row">
              <label>請求年月</label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                作成
              </Button>
              <span className="note">
                ※ベース明細の現在の版（第{currentVersionNo}
                版）の内容をコピーして下書きを作ります。
              </span>
            </div>
          ) : (
            <p className="text-danger">
              ベース明細がまだ生成されていません。
              <Button to={`/projects/${id}/base`} className="ml-10">
                ベース明細へ
              </Button>
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h3>明細一覧</h3>
        {statements.length > 0 ? (
          <DataTable columns={columns} data={statements} />
        ) : (
          <NoDataMessage
            message={
              isAdmin
                ? "毎次明細はまだありません。"
                : "確定した明細はまだありません。"
            }
          />
        )}
      </div>
    </div>
  );
}
