import Button from "../../atoms/Button";
import { formatDate } from "../../utils/baseUtils";
import {
  formatMonth,
  statusClass,
  STATUS_CONFIRMED,
} from "../../utils/statementUtils";

// 案件詳細の「現況確認表・ベース明細・毎次明細」カード（状態＋リンク）
// ※項目や数量が多い案件だけ作るので、作成していないのは正常
//   管理者：作成していないものはグレーの「なし」。4つ目に「緊急・追加作業」の枠
//   業者　：作成済みのものだけ表示（1つもなければカードごと出さない）
// surveyDiffCount・draftCount は管理者のみ（業者は null）
export default function BillingSummaryCard({
  projectId,
  summary,
  isAdmin,
  extraWorkSummary, // 管理者：同じ顧客・業者の緊急・追加作業の件数 { total, open }（読み込み中は null）
  clientId,
  companyId,
}) {
  const s = summary ?? {};
  const hasSurvey = (s.surveyItemCount ?? 0) > 0;
  const hasBase = (s.bases ?? []).length > 0;
  const hasStatement = Boolean(s.latestBillingMonth); // 業者は確定済みだけが対象

  const showSurvey = isAdmin || hasSurvey;
  const showBase = isAdmin || hasBase;
  const showStatement = isAdmin || hasStatement;

  if (!showSurvey && !showBase && !showStatement) {
    return null;
  }

  // 注意が必要な数字は赤字
  const subClass = (warn) => `billing-summary-sub${warn ? " is-warn" : ""}`;
  const none = <div className="billing-summary-sub">なし</div>;

  return (
    <div className="card">
      <h3>{isAdmin ? "請求状況" : "現況確認表・ベース明細・毎次明細"}</h3>
      <div className={`billing-summary${isAdmin ? " cols-4" : ""}`}>
        {/* 現況確認表 */}
        {showSurvey && (
          <div className="billing-summary-panel">
            <div className="billing-summary-title">現況確認表</div>
            {hasSurvey ? (
              <>
                <div className="billing-summary-main">
                  {s.surveyItemCount}行
                </div>
                <div className={subClass(s.surveyPendingCount > 0)}>
                  発注状況 未 {s.surveyPendingCount}件
                </div>
              </>
            ) : (
              none
            )}
            <Button to={`/projects/${projectId}/survey`} variant="primary">
              {isAdmin ? "作成・編集" : "見る"}
            </Button>
          </div>
        )}

        {/* ベース明細 */}
        {showBase && (
          <div className="billing-summary-panel">
            <div className="billing-summary-title">ベース明細</div>
            {hasBase ? (
              <>
                <div className="billing-summary-main">
                  {s.bases.length === 1
                    ? `第${s.bases[0].versionNo}版`
                    : `${s.bases.length}件`}
                </div>
                {s.bases.length > 1 &&
                  s.bases.map((b) => (
                    <div key={b.baseId} className="billing-summary-sub">
                      {b.baseName} 第{b.versionNo}版
                    </div>
                  ))}
                {isAdmin && (
                  <div className={subClass(s.surveyDiffCount > 0)}>
                    現況との差分{" "}
                    {s.surveyDiffCount > 0 ? `${s.surveyDiffCount}件` : "なし"}
                  </div>
                )}
              </>
            ) : (
              none
            )}
            <Button to={`/projects/${projectId}/base`} variant="primary">
              ベース明細
            </Button>
          </div>
        )}

        {/* 毎次明細 */}
        {showStatement && (
          <div className="billing-summary-panel">
            <div className="billing-summary-title">
              毎次明細{isAdmin ? "（最新）" : "（最新の発行分）"}
            </div>
            {hasStatement ? (
              <>
                <div className="billing-summary-main">
                  {formatMonth(s.latestBillingMonth)}
                </div>
                <div className="billing-summary-sub">
                  <span className={statusClass(s.latestStatus)}>
                    {" "}
                    {s.latestStatus}
                  </span>
                  {s.latestStatus === STATUS_CONFIRMED &&
                    s.latestIssuedDate &&
                    `（発行日 ${formatDate(s.latestIssuedDate)}）`}
                </div>
              </>
            ) : (
              none
            )}
            {isAdmin && s.draftCount > 0 && (
              <div className={subClass(true)}>下書き {s.draftCount}件</div>
            )}
            <Button to={`/projects/${projectId}/statements`} variant="primary">
              毎次明細
            </Button>
          </div>
        )}

        {/* 緊急・追加作業（管理者のみ）：同じ顧客・業者の例外の案件の作業 */}
        {isAdmin && (
          <div className="billing-summary-panel">
            <div className="billing-summary-title">
              緊急・追加作業（この顧客・業者）
            </div>
            {extraWorkSummary && extraWorkSummary.total > 0 ? (
              <>
                <div className="billing-summary-main">
                  {extraWorkSummary.total}件
                </div>
                <div className={subClass(extraWorkSummary.open > 0)}>
                  済んでいないもの {extraWorkSummary.open}件
                </div>
              </>
            ) : (
              none
            )}
            <Button
              to={`/extra-works?clientId=${clientId}&companyId=${companyId}&all=1`}
              variant="primary"
            >
              一覧を開く
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
