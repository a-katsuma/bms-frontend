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
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

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

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", quoteFile);
    formData.append("quoteStatus", "未判定");
    formData.append("registerAsOrdered", registerAsOrdered);
    if (!registerAsOrdered) {
      formData.append("deadlineDate", deadlineDate);
    }

    projectApi
      .addQuote(id, formData)
      .then(() => {
        clearMessage();
        setSuccessMessage(
          registerAsOrdered
            ? "見積を発注済みとして登録しました。"
            : "見積情報を登録しました。",
        );
        setQuoteFile(null);
        setDeadlineDate("");
        setRegisterAsOrdered(false);
        fetchProjectDetail();
      })
      .catch((error) => {
        console.error("見積登録エラー:", error);
        showError(
          error.response?.data?.errorMessage || "見積の登録に失敗しました。",
        );
      });
  };

  const handleQuoteDelete = async (quoteId) => {
    const ok = await confirm("最新の見積を削除しますか？", {
      title: "見積の削除",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;
    projectApi
      .deleteQuote(id, quoteId)
      .then(() => {
        clearMessage();
        setSuccessMessage("見積情報を削除しました。");
        fetchProjectDetail();
      })
      .catch((error) => {
        console.error("見積削除エラー:", error);
        showError(
          error.response?.data?.errorMessage || "見積の削除に失敗しました。",
        );
      });
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
    historyList = [],
    billingSummary,
  } = projectData;

  // 例外の案件（緊急・追加作業。見積りを通さず、事前承認で受けた案件）
  const isException = project.orderRoute === ORDER_ROUTE_POLICY;

  const isExpired =
    latestQuote &&
    latestQuote.deadlineDate &&
    latestQuote.deadlineDate < today &&
    latestQuote.quoteStatus === "未判定";

  const projectDetailItems = [
    {
      label: "顧客名",
      value: (
        <Link to={`/clients/${project.clientId}`}>{project.clientName}</Link>
      ),
    },
    { label: "案件名", value: project.projectName },
    { label: isAdmin ? "発注業者" : "担当業者", value: project.companyName },
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

  const latestQuoteDetailItems = latestQuote
    ? [
        {
          label: "見積ファイル",
          value: (
            <a
              href={`http://localhost:8080/${latestQuote.quoteFilepath}`}
              target="_blank"
              rel="noreferrer"
            >
              PDFを表示
            </a>
          ),
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
        { label: "最終更新日", value: latestQuote.quoteDate },
      ]
    : [];

  const historyColumns = [
    { label: "判定日", key: "quoteDate" },
    { label: "判定状態", key: "quoteStatus" },
    { label: "判定者", render: (h) => h.judgeUser || "-" },
    {
      label: "ファイル",
      render: (h) => (
        <a
          href={`http://localhost:8080/${h.quoteFilepath}`}
          target="_blank"
          rel="noreferrer"
        >
          閲覧
        </a>
      ),
    },
  ];

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
                    <Button
                      to={`/projects/${project.projectId}/quotes/edit/${latestQuote.quoteId}`}
                      variant="primary"
                    >
                      編集
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleQuoteDelete(latestQuote.quoteId)}
                    >
                      削除
                    </Button>
                  </div>
                ) : (
                  <div className="mb-20">
                    {latestQuote.quoteStatus === "未判定" && !isExpired ? (
                      <>
                        <p>この見積を判定する</p>
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
                    ) : latestQuote.quoteStatus === "未判定" && isExpired ? (
                      <p className="text-danger">
                        ※有効期限が過ぎているため、判定はできません。
                      </p>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <div className="add-quote-area">
                <p className="no-quote-msg">
                  現在、登録されている見積はありません。
                </p>

                {isAdmin && (
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

                    <div className="form-group-block mb-15">
                      <label>
                        <input
                          type="checkbox"
                          checked={registerAsOrdered}
                          onChange={(e) =>
                            setRegisterAsOrdered(e.target.checked)
                          }
                        />{" "}
                        発注済みとして登録する（運用中案件の取り込み用）
                      </label>
                    </div>

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

                    <Button
                      type="submit"
                      variant="primary"
                      className="btn-submit-quote"
                    >
                      登録する
                    </Button>
                  </form>
                )}
              </div>
            )}

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
