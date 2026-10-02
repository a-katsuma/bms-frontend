import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageHeader from "../../components/PageHeader";
import Button from "../../atoms/Button";
import DetailList from "../../components/DetailList";
import { projectApi } from "../../api/projectApi";
import { useAdminGuard } from "./../../hooks/useAdminGuard";
import { useMessage } from './../../hooks/useMessage';

export default function QuoteEdit() {
  const { pid, id } = useParams();
  const navigate = useNavigate();
  const { showError } = useMessage();

  // 管理者以外はプロジェクト詳細へリダイレクト
  useAdminGuard(`/projects/${pid}`);

  const [quoteForm, setQuoteForm] = useState({
    quoteId: id,
    projectId: pid,
    quoteStatus: "",
    deadlineDate: "",
    quoteFilepath: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi
      .getQuote(pid, id)
      .then((data) => {
        setQuoteForm(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("データ取得エラー:", err);
        setLoading(false);
      });
  }, [pid, id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("quoteId", quoteForm.quoteId);
    formData.append("projectId", quoteForm.projectId);
    formData.append("quoteStatus", quoteForm.quoteStatus);
    formData.append("deadlineDate", quoteForm.deadlineDate);
    if (file) {
      formData.append("file", file);
    }

    projectApi
      .updateQuote(pid, id, formData)
      .then(() => {
        navigate(`/projects/${pid}`, {
          state: { message: "見積情報を更新しました。" },
        });
      })
      .catch((error) => {
        console.error("更新エラー:", error);
        showError("更新に失敗しました。");
      });
  };

  if (loading) return <p>読み込み中...</p>;

  const detailItems = [
    {
      label: "現在の見積書",
      value: (
        <a
          href={`http://localhost:8080/${quoteForm.quoteFilepath}`}
          target="_blank"
          rel="noreferrer"
        >
          PDFを確認
        </a>
      ),
    },
    {
      label: "ファイルを選択",
      value: (
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
      ),
    },
    {
      label: "判定期限",
      value: (
        <input
          type="date"
          value={quoteForm.deadlineDate || ""}
          required
          onChange={(e) =>
            setQuoteForm({ ...quoteForm, deadlineDate: e.target.value })
          }
        />
      ),
    },
    {
      label: "現在のステータス",
      value: quoteForm.quoteStatus,
    },
  ];

  return (
    <div className="content-wrapper">
      <PageHeader title="見積編集" />

      <div className="card">
        <h3>見積内容の編集</h3>

        <form onSubmit={handleSubmit}>
          <DetailList items={detailItems} />

          <div className="action-buttons-form">
            <Button type="submit" variant="primary">
              更新する
            </Button>
            <Button to={`/projects/${pid}`} variant="cancel">
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
