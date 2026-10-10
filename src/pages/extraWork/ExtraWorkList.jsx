import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DataTable from "../../components/DataTable";
import { extraWorkApi } from "../../api/extraWorkApi";
import { yen, formatDate } from "../../utils/baseUtils";
import { formatMonth, totalsFromSubtotal } from "../../utils/statementUtils";
import {
  EW_STATUS_ORDERED,
  extraWorkStatusClass,
  WORK_TYPE_CLASS,
} from "../../utils/extraWorkUtils";

const byKana = (key) => (a, b) =>
  String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "ja");

// 緊急・追加作業の一覧（サイドバー）。すべての例外の案件の作業
// 絞り込みは URL に持つ：clientId・companyId・all=1（すべて。なければ済んでいないものだけ）
export default function ExtraWorkList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const openOnly = searchParams.get("all") !== "1";

  const [works, setWorks] = useState(null);
  const [options, setOptions] = useState({ clients: [], companies: [] });
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message ?? "",
  );

  // 絞り込みの選択肢（顧客・業者）は最初に1回だけ取る
  useEffect(() => {
    extraWorkApi
      .getNewForm()
      .then((res) =>
        setOptions({
          clients: [...(res.clients ?? [])].sort(byKana("clientKana")),
          companies: [...(res.companies ?? [])].sort(byKana("companyKana")),
        }),
      )
      .catch((error) => console.error("絞り込みの選択肢取得エラー:", error));
  }, []);

  useEffect(() => {
    extraWorkApi
      .search({
        clientId: clientId || undefined,
        companyId: companyId || undefined,
        openOnly,
      })
      .then((res) => setWorks(res.extraWorks ?? []))
      .catch((error) => {
        console.error("緊急・追加作業一覧取得エラー:", error);
        if (error.response?.status === 403) {
          navigate("/");
        }
      });
  }, [clientId, companyId, openOnly]);

  if (works === null) {
    return <Loading />;
  }

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  // 請求：取り込み先の明細／請求済みの日／受注済みなら未請求
  const billingText = (w) => {
    if (w.importedStatementId) {
      return `${formatMonth(w.importedBillingMonth)}の明細に取り込み済み`;
    }
    if (w.billedDate) {
      return `${formatDate(w.billedDate)} 請求済み`;
    }
    return w.status === EW_STATUS_ORDERED ? (
      <span className="text-warning">未請求</span>
    ) : (
      "-"
    );
  };

  const columns = [
       { label: "実施日", nowrap: true, render: (w) => formatDate(w.workDate) },
    {
      label: "区分",
      align: "center",
      render: (w) => (
        <span className={WORK_TYPE_CLASS[w.workType]}>{w.workType}</span>
      ),
    },
    { label: "顧客", key: "clientName" },
    { label: "発注元", key: "companyName" },
    { label: "場所", render: (w) => w.location || "-" },
    { label: "依頼内容", key: "content" },
    {
      label: "発注元→顧客（税込）",
      align: "right",
      render: (w) =>
        yen(totalsFromSubtotal(w.presentedSubtotal, w.taxRate).total),
    },
    {
      label: "状態",
      align: "center",
      render: (w) => (
        <span className={extraWorkStatusClass(w.status)}>{w.status}</span>
      ),
    },
    { label: "請求", render: billingText },
    {
      label: "操作",
      align: "center",
      render: (w) => (
        <Button
          to={`/projects/${w.projectId}/extra-works/${w.extraWorkId}`}
          variant="primary"
        >
          開く
        </Button>
      ),
    },
  ];

  return (
    <div className="content-wrapper">
      <PageHeader title="緊急・追加作業" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      {/* 案件一覧と同じく、一覧のカードの上に操作のボタン */}
      <div className="action-bar">
        <Button to="/extra-works/new" variant="primary">
          新規受注
        </Button>
      </div>

      <div className="card">
        <h3>作業一覧</h3>

        <div className="note mb-10">
          ※事前承認が有効な発注元の案件に限り、見積りを省略して受注する作業です。請求は、作業の画面で［請求済みにする］か、同じ顧客・発注元の毎次明細に取り込みます。
        </div>

                {/* 絞り込み：1行目は表示の切り替え、2行目は顧客・業者（見出しの下にプルダウン。PC は横に2つ、スマホは縦） */}
        <div className="flex-row mb-10">
          <label className="inline-label nowrap">
            <input
              type="radio"
              checked={openOnly}
              onChange={() => setFilter("all", "")}
            />
            済んでいないもの
          </label>
          <label className="inline-label nowrap">
            <input
              type="radio"
              checked={!openOnly}
              onChange={() => setFilter("all", "1")}
            />
            すべて
          </label>
        </div>
        <div className="filter-grid mb-15">
          <div className="form-group">
            <label>顧客</label>
            <select
              value={clientId}
              onChange={(e) => setFilter("clientId", e.target.value)}
            >
              <option value="">すべて</option>
              {options.clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>発注元</label>
            <select
              value={companyId}
              onChange={(e) => setFilter("companyId", e.target.value)}
            >
              <option value="">すべて</option>
              {options.companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>


        <DataTable
          columns={columns}
          data={works}
          noDataMessage={
            openOnly
              ? "済んでいない緊急・追加作業はありません。"
              : "緊急・追加作業はありません。"
          }
        />
      </div>
    </div>
  );
}
