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

// ベース名と版（例：総合点検（第1版））
const baseLabel = (name, versionNo) => `${name}（第${versionNo}版）`;

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
  const [baseId, setBaseId] = useState(""); // コピー元のベース（使用中のベースが2つ以上のとき）
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

  const { project, statements = [], bases = [] } = data; // bases：使用中のベース（管理者のみ）

  // コピー元にできるベース（版があるもの）。1つだけなら選ばなくてよい
  const usable = bases.filter((b) => b.currentVersionNo != null);
  const multiBase = usable.length > 1;
  const selectedBase = multiBase
    ? usable.find((b) => String(b.baseId) === String(baseId))
    : usable[0];

  const handleCreate = async () => {
    if (!billingMonth) {
      showError("請求年月を入力してください。");
      return;
    }
    if (!selectedBase) {
      showError("コピー元のベースを選択してください。");
      return;
    }
    const label = baseLabel(selectedBase.baseName, selectedBase.currentVersionNo);
    const exists = statements.some(
      (s) => s.billingMonth === billingMonth && s.baseId === selectedBase.baseId,
    );
    const message = exists
      ? `${formatMonth(billingMonth)}の「${label}」の明細は既にあります。もう1件作成しますか？`
      : `${formatMonth(billingMonth)}の明細を作成しますか？\n（ベース明細「${label}」の内容をコピーします）`;
    const ok = await confirm(message, {
      title: "毎次明細の作成",
      okLabel: "作成",
    });
    if (!ok) return;

    setCreating(true);
    statementApi
      .create(id, billingMonth, selectedBase.baseId)
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
      value:
        usable.length > 0 ? (
          usable.map((b) => baseLabel(b.baseName, b.currentVersionNo)).join("、")
        ) : (
          <span className="text-muted">なし</span>
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
      render: (s) => (s.versionNo ? baseLabel(s.baseName, s.versionNo) : "-"),
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
          {usable.length > 0 ? (
            <>
              <div className="flex-row">
                {multiBase && (
                  <>
                    <label htmlFor="statement-base">コピー元のベース</label>
                    <select
                      id="statement-base"
                      value={baseId}
                      onChange={(e) => setBaseId(e.target.value)}
                    >
                      <option value="">選択してください</option>
                      {usable.map((b) => (
                        <option key={b.baseId} value={b.baseId}>
                          {baseLabel(b.baseName, b.currentVersionNo)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label htmlFor="statement-month">請求年月</label>
                <input
                  id="statement-month"
                  type="month"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={handleCreate}
                  disabled={creating || !selectedBase}
                >
                  作成
                </Button>
              </div>
              <div className="note mt-10">
                ※
                {selectedBase
                  ? `ベース明細「${baseLabel(selectedBase.baseName, selectedBase.currentVersionNo)}」`
                  : "選んだベース明細の現在の版"}
                の内容をコピーして下書きを作ります。
              </div>
            </>
          ) : (
            <p className="text-muted">
              使用中のベース明細がありません。
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
