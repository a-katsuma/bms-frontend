import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAtomValue } from "jotai";
import AlertMessage from "../../components/AlertMessage";
import { clientApi } from "../../api/clientApi";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import NoDataMessage from "../../components/NoDataMessage";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";
import { fileUrl } from "../../config";


export default function ClientDocuments() {
  const { id } = useParams();

  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [client, setClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    docTitle: "",
    docType: "機器一覧表",
    docRemarks: "",
    file: null,
  });

  // 資料の削除（1件ずつ）
  const handleDelete = async (docId) => {
    const ok = await confirm("資料を削除しますか？", {
      title: "資料の削除",
      okLabel: "削除",
      danger: true,
    });
    if (!ok) return;
    clientApi
      .deleteDocument(id, docId)
      .then((res) => {
        setDocuments((prevDocs) =>
          prevDocs.filter((doc) => doc.docId !== docId),
        );
        clearMessage();
        setSuccessMessage(res.message);
      })
      .catch((error) => {
        showError(
          error.response?.data?.errorMessage || "資料の削除に失敗しました。",
        );
      });
  };

  useEffect(() => {
    clientApi
      .getDocuments(id, isAdmin)
      .then((res) => {
        setClient(res.client);
        setDocuments(res.documents || []);
      })
      .catch((error) => {
        console.error("データ取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate("/clients");
        }
      });
  }, [isAdmin, id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({ ...prev, file: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.docTitle.trim() || !formData.file) {
      showError("資料名とファイルは必須です。");
      return;
    }

    const data = new FormData();
    data.append("docTitle", formData.docTitle);
    data.append("docType", formData.docType);
    data.append("docRemarks", formData.docRemarks || "");
    data.append("file", formData.file);

    clientApi
      .addDocument(id, data)
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        setFormData({
          docTitle: "",
          docType: "機器一覧表",
          docRemarks: "",
          file: null,
        });
        return clientApi.getDocuments(id, isAdmin);
      })
      .then((res) => {
        if (res) {
          setDocuments(res.documents || []);
        }
      })
      .catch((error) => {
        console.error("登録エラー:", error);
        showError(
          error.response?.data?.errorMessage || "資料の登録に失敗しました。",
        );
      });
  };

  if (!client) {
    return <Loading />;
  }

  const formItems = [
    {
      label: "資料名",
      value: (
        <input
          type="text"
          name="docTitle"
          value={formData.docTitle}
          onChange={handleChange}
          required
          className="input-full"
          placeholder="資料名を入力"
        />
      ),
    },
    {
      label: "分類",
      value: (
        <select name="docType" value={formData.docType} onChange={handleChange}>
          <option value="機器一覧表">機器一覧表</option>
          <option value="機器配置図">機器配置図</option>
          <option value="画像">画像</option>
          <option value="その他">その他</option>
        </select>
      ),
    },
    {
      label: "備考",
      value: (
        <textarea
          name="docRemarks"
          value={formData.docRemarks}
          onChange={handleChange}
          className="textarea-sm"
          placeholder="備考を入力（任意）"
        />
      ),
    },
    {
      label: "ファイルを選択",
      value: (
        <input
          type="file"
          name="file"
          onChange={handleChange}
          accept=".pdf, .jpg, .jpeg, .png"
          required
        />
      ),
    },
  ];

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="関連資料一覧" />

      <div className="mb-25">
        <span className="page-target-label">対象顧客：</span>
        <Link to={`/clients/${client.clientId}`} className="page-target-link">
          {client.clientName}
        </Link>
      </div>

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      {isAdmin && (
        <div className="card">
          <h3>資料登録</h3>
          <form onSubmit={handleSubmit}>
            <DetailList items={formItems} />

            <div className="action-buttons">
              <Button type="submit" variant="primary">
                登録する
              </Button>
              <Button to={`/clients/${client.clientId}`} variant="cancel">
                顧客詳細へ戻る
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3>資料情報</h3>
        {documents.length > 0 ? (
          <div className="doc-grid">
            {documents.map((doc) => {
              const isPdf =
                doc.docFilePath &&
                doc.docFilePath.toLowerCase().endsWith(".pdf");
              return (
                <div className="doc-item" key={doc.docId}>
                  <div className="preview-box">
                    {isPdf ? (
                      <iframe
                        src={`${fileUrl(doc.docFilePath)}#view=Fit&scrollbar=0&toolbar=0&navpanes=0`}
                        scrolling="no"
                        title={doc.docTitle}
                      />
                    ) : (
                      <img src={fileUrl(doc.docFilePath)} alt="プレビュー" />
                    )}
                  </div>

                  <a
                    href={fileUrl(doc.docFilePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <strong>{doc.docTitle}</strong>
                  </a>
                  <div className="doc-meta">{doc.docType}</div>
                  <div className="doc-meta">
                    {doc.docCreatedAt
                      ? new Date(doc.docCreatedAt).toLocaleDateString()
                      : ""}
                  </div>

                  <div className="remarks-container">
                    {doc.docRemarks && (
                      <details>
                        <summary>備考を表示</summary>
                        <p>
                          <span>{doc.docRemarks}</span>
                        </p>
                      </details>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="doc-item-actions">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => handleDelete(doc.docId)}
                        className="btn-text-danger"
                      >
                        削除
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <NoDataMessage message="登録されている資料はありません。" />
        )}

        {!isAdmin && (
          <div className="action-buttons flex-row mt-20">
            <Button to={`/clients/${client.clientId}`} variant="cancel">
              顧客詳細へ戻る
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
