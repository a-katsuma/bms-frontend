import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageHeader from "../../components/PageHeader";
import Button from "../../atoms/Button";
import DetailList from "../../components/DetailList";
import { projectApi } from "../../api/projectApi";
import { useAdminGuard } from "./../../hooks/useAdminGuard";
import { useMessage } from "./../../hooks/useMessage";
import { fileUrl } from "../../config";


// 見積りの判定期限の変更（最新・未判定の見積りだけ）
// ファイルを差し替えるときは、案件詳細の［再見積りを登録］から新しい見積りとして登録する
export default function QuoteEdit() {
  const { pid, id } = useParams();
  const navigate = useNavigate();
  const { showError } = useMessage();

  // 管理者以外はプロジェクト詳細へリダイレクト
  useAdminGuard(`/projects/${pid}`);

  const [quote, setQuote] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi
      .getQuote(pid, id)
      .then((data) => {
        setQuote(data);
        setDeadlineDate(data.deadlineDate || "");
      })
      .catch((err) => {
        console.error("データ取得エラー:", err);
        navigate(`/projects/${pid}`); // 削除済み・別の案件の見積り
      })
      .finally(() => setLoading(false));
  }, [pid, id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    projectApi
      .updateQuoteDeadline(pid, id, deadlineDate)
      .then((res) => {
        navigate(`/projects/${pid}`, { state: { message: res.message } });
      })
      .catch((error) => {
        console.error("更新エラー:", error);
        showError(error.response?.data?.errorMessage || "更新に失敗しました。");
      });
  };

  if (loading || !quote) return <p>読み込み中...</p>;

  const editable = quote.quoteStatus === "未判定";

  const detailItems = [
    {
      label: "見積書",
      value: (
        <a
          href={fileUrl(quote.quoteFilepath)}
          target="_blank"
          rel="noreferrer"
        >
          PDFを確認
        </a>
      ),
    },
    { label: "判定状態", value: quote.quoteStatus },
    {
      label: "判定期限",
      value: editable ? (
        <input
          type="date"
          value={deadlineDate}
          required
          onChange={(e) => setDeadlineDate(e.target.value)}
        />
      ) : (
        quote.deadlineDate || "期限設定なし"
      ),
    },
  ];

  return (
    <div className="content-wrapper">
      <PageHeader title="判定期限の変更" />

      <div className="card">
        <h3>見積りの判定期限</h3>

        {!editable && (
          <p className="text-muted mb-10">
            ※判定期限を変更できるのは、未判定の見積りだけです。
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <DetailList items={detailItems} />

          <div className="action-buttons-form">
            {editable && (
              <Button type="submit" variant="primary">
                変更する
              </Button>
            )}
            <Button to={`/projects/${pid}`} variant="cancel">
              {editable ? "キャンセル" : "案件詳細へ戻る"}
            </Button>
          </div>
        </form>

        <p className="note mt-15">
          ※見積書のファイルを差し替えるときは、案件詳細の［再見積りを登録］から新しい見積りとして登録してください（判定後に登録できます）。
        </p>
      </div>
    </div>
  );
}
