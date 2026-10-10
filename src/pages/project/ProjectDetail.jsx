import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import DataTable from "../../components/DataTable";
import { projectApi } from "../../api/projectApi";
import { extraWorkApi } from "../../api/extraWorkApi";
import { useDeleteWithCheck } from "../../hooks/useDeleteWithCheck";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import BillingSummaryCard from "../../components/project/BillingSummaryCard";
import ExtraWorkProjectCard from "../../components/extraWork/ExtraWorkProjectCard";
import { ORDER_ROUTE_POLICY } from "../../utils/extraWorkUtils";
import { formatDateTime } from "../../utils/baseUtils";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";
import { fileUrl } from "../../config";

const QUOTE_UNJUDGED = "未判定";

export default function ProjectDetail() {
  const { id } = useParams();
  const location = useLocation();

  const loginUser = useAtomValue(loginUserAtom);
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();
  const isAdmin = loginUser?.roleFlag === 1;

  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 緊急・追加作業（管理者）
  //   例外の案件：その作業（undefined は読み込み中、null は作業なし）
  //   通常の案件：同じ顧客・業者の作業の件数 { total, open }
  const [extraWork, setExtraWork] = useState(undefined);
  const [extraWorkSummary, setExtraWorkSummary] = useState(null);

  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || "",
  );

  const [quoteFile, setQuoteFile] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [registerAsOrdered, setRegisterAsOrdered] = useState(false);
  const [requoteOpen, setRequoteOpen] = useState(false); // 再見積りの登録フォームを表示中

  const today = new Date().toISOString().split("T")[0];

  const navigate = useNavigate();

  // 共通化したカスタムフックで2段階削除を適用
  const { handleDeleteWithCheck } = useDeleteWithCheck(
    `/projects/${id}`,
    "/projects",
    "案件情報を削除しました。",
    async () => {
      if (!projectData) return false;
      const { latestQuote, historyList = [] } = projectData;
      return Boolean(latestQuote || historyList.length > 0);
    },
  );

  // 緊急・追加作業（管理者のみ。業者は案件詳細の API に受注済みの作業が入っている）
  const loadExtraWorks = (project) => {
    if (project.orderRoute === ORDER_ROUTE_POLICY) {
      extraWorkApi
        .getByProject(project.projectId)
        .then((res) => setExtraWork(res.extraWork ?? null))
        .catch((error) => console.error("緊急・追加作業取得エラー:", error));
    } else {
      extraWorkApi
        .search({
          clientId: project.clientId,
          companyId: project.companyId,
          openOnly: false,
        })
        .then((res) => {
          const works = res.extraWorks ?? [];
          setExtraWorkSummary({
            total: works.length,
            open: works.filter((w) => !w.billedDate && !w.importedStatementId)
              .length,
          });
        })
        .catch((error) => console.error("緊急・追加作業取得エラー:", error));
    }
  };

  const fetchProjectDetail = () => {
    setLoading(true);
    projectApi
      .getDetail(id, isAdmin)
      .then((data) => {
        setProjectData(data);
        if (isAdmin) {
          loadExtraWorks(data.project);
        }
      })
      .catch((error) => {
        console.error("データ取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate("/projects"); // ★一覧へ戻す
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id, isAdmin]);

  // 見積りの登録（初回・再見積り）
  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", quoteFile);
    formData.append("quoteStatus", QUOTE_UNJUDGED);
    formData.append("registerAsOrdered", registerAsOrdered);
    if (!registerAsOrdered) {
      formData.append("deadlineDate", deadlineDate);
    }

    projectApi
      .addQuote(id, formData)
      .then((res) => {
        clearMessage();
        setSuccessMessage(
          registerAsOrdered
            ? "見積を発注済みとして登録しました。"
            : res?.message || "見積情報を登録しました。",
        );
        setQuoteFile(null);
        setDeadlineDate("");
        setRegisterAsOrdered(false);
        setRequoteOpen(false);
        fetchProjectDetail();
      })
      .catch((error) => {
        console.error("見積登録エラー:", error);
        showError(
          error.response?.data?.errorMessage || "見積の登録に失敗しました。",
        );
      });
  };

  // 見積りの操作（削除・復元・完全に削除）の共通処理
  const runQuoteAction = (request, failMessage) =>
    request
      .then((res) => {
        clearMessage();
        setSuccessMessage(res?.message || "");
        setRequoteOpen(false);
        fetchProjectDetail();
      })
      .catch((error) => {
        console.error(failMessage, error);
        showError(error.response?.data?.errorMessage || failMessage);
      });

  // 削除（論理削除）。isLatest は最新の見積りか
  const handleQuoteDelete = async (quote, isLatest) => {
    const target = isLatest
      ? "最新の見積り"
      : `${quote.quoteDate} 登録の見積り`;
    const ok = await confirm(
      `${target}を削除しますか？\n削除済みの見積りに移り、あとで復元できます（判定履歴は残ります）。`,
      { title: "見積りの削除", okLabel: "削除", danger: true },
    );
    if (!ok) return;
    runQuoteAction(
      projectApi.deleteQuote(id, quote.quoteId),
      "見積りの削除に失敗しました。",
    );
  };

  const handleQuoteRestore = async (quote) => {
    const ok = await confirm(
      `${quote.quoteDate} 登録の見積りを復元しますか？`,
      {
        title: "見積りの復元",
        okLabel: "復元",
      },
    );
    if (!ok) return;
    runQuoteAction(
      projectApi.restoreQuote(id, quote.quoteId),
      "見積りの復元に失敗しました。",
    );
  };

  // 完全に削除（物理削除）
  const handleQuotePurge = async (quote) => {
    const ok = await confirm(
      `${quote.quoteDate} 登録の見積りを完全に削除しますか？\n判定履歴と PDF ファイルも削除され、元に戻せません。`,
      { title: "見積りの完全な削除", okLabel: "完全に削除", danger: true },
    );
    if (!ok) return;
    runQuoteAction(
      projectApi.purgeQuote(id, quote.quoteId),
      "見積りの完全な削除に失敗しました。",
    );
  };

  const handleJudge = async (quoteId, status) => {
    const ok = await confirm(`この見積を「${status}」にしますか？`, {
      title: "見積の判定",
      okLabel: status,
      danger: status !== "発注", // 失注・差戻しは赤
    });
    if (!ok) return;

    projectApi
      .judgeQuote(id, quoteId, status)
      .then(() => {
        clearMessage();
        setSuccessMessage(`見積を「${status}」判定しました。`);
        fetchProjectDetail();
      })
      .catch((error) => {
        console.error("判定エラー:", error);
        showError(
          error.response?.data?.errorMessage || "判定処理に失敗しました。",
        );
      });
  };

  if (loading || !projectData) {
    return <Loading />;
  }

  const {
    project,
    latestQuote,
    pastQuotes = [], // 過去の受注（最新以外で、発注になった見積りだけ）
    deletedQuotes = [], // 管理者のみ
    historyList = [],
    billingSummary,
  } = projectData;

  // 例外の案件（緊急・追加作業。見積りを通さず、事前承認で受けた案件）
  const isException = project.orderRoute === ORDER_ROUTE_POLICY;

  const isUnjudged = latestQuote?.quoteStatus === QUOTE_UNJUDGED;
  const isExpired =
    latestQuote &&
    latestQuote.deadlineDate &&
    latestQuote.deadlineDate < today &&
    isUnjudged;

  const projectDetailItems = [
    {
      label: "顧客名",
      value: (
        <Link to={`/clients/${project.clientId}`}>{project.clientName}</Link>
      ),
    },
    { label: "案件名", value: project.projectName },
    { label: "発注元", value: project.companyName },
    { label: "契約種別", value: project.contractType },
    ...(isException
      ? [{ label: "受注", value: "事前承認（見積りなし）" }]
      : []),
    { label: "担当者名", value: project.projectStaffname },
    { label: "案件状態", value: project.status },
    {
      label: "特記事項",
      value: <span className="pre-wrap">{project.projectRemarks}</span>,
    },
  ];

  const pdfLink = (filepath, label) => (
    <a href={fileUrl(filepath)} target="_blank" rel="noreferrer">
      {label}
    </a>
  );

  const latestQuoteDetailItems = latestQuote
    ? [
        {
          label: "見積ファイル",
          value: pdfLink(latestQuote.quoteFilepath, "PDFを表示"),
        },
        { label: "現在の判定状態", value: latestQuote.quoteStatus },
        {
          label: "判定期限",
          value: (
            <span>
              <span className={isExpired ? "text-danger" : ""}>
                {latestQuote.deadlineDate
                  ? latestQuote.deadlineDate
                  : "期限設定なし"}
              </span>
              {isExpired && (
                <span className="text-danger ml-8">(期限切れ)</span>
              )}
            </span>
          ),
        },
        { label: "登録日", value: latestQuote.quoteDate },
      ]
    : [];

  // 過去の受注（最新以外で、発注になった見積りだけ。新しい順）
  // 値上げなどで見積りが変わったとき、以前どの内容で受注していたかを見るため
  const pastQuoteColumns = [
    { label: "登録日", key: "quoteDate" },
    { label: "判定者", render: (q) => q.judgeUser || "-" },
    { label: "ファイル", render: (q) => pdfLink(q.quoteFilepath, "閲覧") },
    ...(isAdmin
      ? [
          {
            label: "操作",
            render: (q) => (
              <Button
                variant="danger"
                className="btn-sm"
                onClick={() => handleQuoteDelete(q, false)}
              >
                削除
              </Button>
            ),
          },
        ]
      : []),
  ];

  // 削除済みの見積り（管理者のみ。新しく削除した順）
  const deletedQuoteColumns = [
    { label: "登録日", key: "quoteDate" },
    { label: "判定状態", key: "quoteStatus" },
    { label: "削除日時", render: (q) => formatDateTime(q.deletedAt) },
    { label: "ファイル", render: (q) => pdfLink(q.quoteFilepath, "閲覧") },
    {
      label: "操作",
      render: (q) => (
        <div className="btn-row-sm">
          <Button className="btn-sm" onClick={() => handleQuoteRestore(q)}>
            復元
          </Button>
          <Button
            variant="danger"
            className="btn-sm"
            onClick={() => handleQuotePurge(q)}
            disabled={q.baseVersionCount > 0}
          >
            完全に削除
          </Button>
        </div>
      ),
    },
  ];

  const historyColumns = [
    { label: "判定日", key: "quoteDate" },
    {
      label: "判定状態",
      render: (h) => (
        <>
          {h.quoteStatus}
          {h.quoteDeleted && (
            <span className="text-muted">（削除済みの見積り）</span>
          )}
        </>
      ),
    },
    { label: "判定者", render: (h) => h.judgeUser || "-" },
    { label: "ファイル", render: (h) => pdfLink(h.quoteFilepath, "閲覧") },
  ];

  // 見積りの登録フォーム（初回・再見積りで共通。「発注済みとして登録」は初回だけ）
  const quoteFormElement = (
    <form onSubmit={handleQuoteSubmit}>
      <div className="form-group-block mb-15">
        <label>見積PDFファイルを選択</label>
        <input
          type="file"
          accept=".pdf"
          required
          onChange={(e) => setQuoteFile(e.target.files[0])}
        />
      </div>

      {!latestQuote && (
        <div className="form-group-block mb-15">
          <label>
            <input
              type="checkbox"
              checked={registerAsOrdered}
              onChange={(e) => setRegisterAsOrdered(e.target.checked)}
            />{" "}
            発注済みとして登録する（運用中案件の取り込み用）
          </label>
        </div>
      )}

      {!registerAsOrdered && (
        <div className="form-group-block mb-15">
          <label>判定期限</label>
          <input
            type="date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            required
          />
        </div>
      )}

      {/* ボタンの並び（PC は横並び、スマホは縦並びで同じ幅。間隔は .action-buttons の gap） */}
      <div className="action-buttons">
        <Button type="submit" variant="primary">
          登録する
        </Button>
        {latestQuote && (
          <Button variant="cancel" onClick={() => setRequoteOpen(false)}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="案件詳細" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>案件情報</h3>
        <DetailList items={projectDetailItems} />

        <div className="action-buttons-form">
          {isAdmin ? (
            <>
              <Button
                to={`/projects/edit/${project.projectId}`}
                variant="primary"
              >
                編集
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteWithCheck}
              >
                削除
              </Button>
              <Button to="/projects" variant="cancel">
                案件一覧へ戻る
              </Button>
            </>
          ) : (
            <Button to="/projects" variant="cancel">
              案件一覧へ戻る
            </Button>
          )}
        </div>
      </div>

      {isException ? (
        /* 例外の案件：見積り・請求状況の代わりに作業のカード */
        <ExtraWorkProjectCard
          work={isAdmin ? extraWork : (projectData.extraWork ?? null)}
          projectId={project.projectId}
          isAdmin={isAdmin}
        />
      ) : (
        <>
          <BillingSummaryCard
            projectId={project.projectId}
            summary={billingSummary}
            isAdmin={isAdmin}
            extraWorkSummary={extraWorkSummary}
            clientId={project.clientId}
            companyId={project.companyId}
          />

          <div className="card">
            <h3>見積情報・履歴</h3>

            {latestQuote ? (
              <>
                <div className="mb-20">
                  <DetailList items={latestQuoteDetailItems} />
                </div>

                {isAdmin ? (
                  <div className="action-buttons-form mb-20">
                    {isUnjudged && (
                      <Button
                        to={`/projects/${project.projectId}/quotes/edit/${latestQuote.quoteId}`}
                        variant="primary"
                      >
                        判定期限を変更
                      </Button>
                    )}
                    {!isUnjudged && !requoteOpen && (
                      <Button
                        variant="primary"
                        onClick={() => setRequoteOpen(true)}
                      >
                        再見積りを登録
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleQuoteDelete(latestQuote, true)}
                    >
                      削除
                    </Button>
                  </div>
                ) : (
                  <div className="mb-20">
                    {isUnjudged && !isExpired ? (
                      <>
                        <h4 className="section-title">この見積を判定する</h4>
                        <div className="action-buttons quote-action-buttons flex-row">
                          <Button
                            type="button"
                            variant="primary"
                            onClick={() =>
                              handleJudge(latestQuote.quoteId, "発注")
                            }
                          >
                            発注
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                              handleJudge(latestQuote.quoteId, "失注")
                            }
                          >
                            失注
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() =>
                              handleJudge(latestQuote.quoteId, "差戻し")
                            }
                          >
                            差戻し
                          </Button>
                        </div>
                      </>
                    ) : isUnjudged && isExpired ? (
                      <p className="text-danger">
                        ※有効期限が過ぎているため、判定はできません。
                      </p>
                    ) : null}
                  </div>
                )}

                {/* 再見積り（管理者。最新の見積りが判定済みのとき） */}
                {isAdmin && requoteOpen && (
                  <div className="add-quote-area mb-20">
                    <h4 className="section-title">再見積りの登録</h4>
                    <p className="note mb-10">
                      ※今の見積りが発注済みなら「過去の受注」に残ります。差戻し・失注の見積りは、判定履歴から確認できます。
                    </p>
                    {quoteFormElement}
                  </div>
                )}
              </>
            ) : (
              <div className="add-quote-area">
                <p className="no-quote-msg">
                  現在、登録されている見積はありません。
                </p>
                {isAdmin && quoteFormElement}
              </div>
            )}

            {/* 過去の受注（最新以外で、発注になった見積りだけ。折りたたみ） */}
            {pastQuotes.length > 0 && (
              <details className="mb-20">
                <summary>
                  過去の受注（発注した見積り {pastQuotes.length}件）
                </summary>
                <DataTable columns={pastQuoteColumns} data={pastQuotes} />
              </details>
            )}

            {/* 削除済みの見積り（管理者のみ。折りたたみ） */}
            {isAdmin && deletedQuotes.length > 0 && (
              <details className="mb-20">
                <summary>削除済みの見積り（{deletedQuotes.length}件）</summary>
                <DataTable columns={deletedQuoteColumns} data={deletedQuotes} />
                <p className="note-sm mt-10">
                  ※ベース明細の元の見積りになっている見積りは、完全には削除できません。
                </p>
              </details>
            )}

            <h4 className="section-title">判定履歴</h4>
            <DataTable
              columns={historyColumns}
              data={historyList}
              noDataMessage="履歴はありません。"
            />
          </div>
        </>
      )}
    </div>
  );
}
