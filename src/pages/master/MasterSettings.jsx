import { useState, useEffect } from "react";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import { masterApi } from "../../api/masterApi";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

const SECTIONS = [
  {
    type: "UNIT",
    title: "単位",
    fields: [{ key: "name", label: "単位名", maxLength: 20 }],
  },
  {
    type: "ITEM",
    title: "項目",
    fields: [
      { key: "name", label: "項目名", maxLength: 100 },
      {
        key: "defaultUnit",
        label: "既定の単位",
        maxLength: 20,
        list: "master-unit-list",
      },
    ],
  },
  {
    type: "OTHER",
    title: "その他項目（ベース明細用）",
    fields: [{ key: "name", label: "項目名", maxLength: 100 }],
  },
];

const emptyOf = (section) =>
  Object.fromEntries(
    section.fields.map((f) => [f.key, f.type === "checkbox" ? 0 : ""]),
  );

const toPayload = (type, row) => ({
  masterType: type,
  name: String(row.name ?? "").trim(),
  defaultUnit: row.defaultUnit?.trim() || null,
});

export default function MasterSettings() {
  const { isAdmin } = useAdminGuard();
  const { confirm } = useDialog();
  const { showError, clearMessage } = useMessage();
  const [masters, setMasters] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchMasters = (showLoading = true) => {
    if (showLoading) setLoading(true);
    masterApi
      .getAll()
      .then(setMasters)
      .catch((error) => console.error("常用項目取得エラー:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) fetchMasters();
  }, [isAdmin]);

  const run = (request, message) =>
    request
      .then(() => {
        clearMessage();
        setSuccessMessage(message);
        fetchMasters();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "処理に失敗しました。");
      });

  const handleMove = (row, direction) =>
    masterApi
      .move(row.masterId, direction)
      .then(() => fetchMasters(false))
      .catch((error) => {
        setSuccessMessage("");
        showError(
          error.response?.data?.errorMessage || "並び替えに失敗しました。",
        );
      });

  if (!isAdmin || loading) {
    return <Loading />;
  }

  return (
    <div className="content-wrapper">
      <PageHeader title="常用項目管理" />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      {SECTIONS.map((section) => (
        <MasterSection
          key={section.type}
          section={section}
          rows={masters[section.type] ?? []}
          onAdd={(row) =>
            run(
              masterApi.add(toPayload(section.type, row)),
              `${section.title}を追加しました。`,
            )
          }
          onUpdate={(row) =>
            run(
              masterApi.update(row.masterId, toPayload(section.type, row)),
              `${section.title}を更新しました。`,
            )
          }
          onDelete={async (row) => {
            const ok = await confirm(`「${row.name}」を削除しますか？`, {
              title: `${section.title}の削除`,
              okLabel: "削除",
              danger: true,
            });
            if (!ok) return;
            run(
              masterApi.remove(row.masterId),
              `${section.title}を削除しました。`,
            );
          }}
          onMove={handleMove}
        />
      ))}

      <datalist id="master-unit-list">
        {(masters.UNIT ?? []).map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
    </div>
  );
}

function MasterSection({ section, rows, onAdd, onUpdate, onDelete, onMove }) {
  const [editRows, setEditRows] = useState(rows);
  const [newRow, setNewRow] = useState(emptyOf(section));

  // 並び替え後の再取得を表に反映する
  useEffect(() => setEditRows(rows), [rows]);

  // 列の揃え（数値は右、チェックは中央、それ以外は左）
  const alignOf = (f) =>
    f.type === "number"
      ? "align-right"
      : f.type === "checkbox"
        ? "align-center"
        : "align-left";

  const field = (row, f, onChange) =>
    f.type === "checkbox" ? (
      <input
        type="checkbox"
        checked={Boolean(row[f.key])}
        onChange={(e) => onChange(f.key, e.target.checked ? 1 : 0)}
      />
    ) : (
      <input
        type={f.type ?? "text"}
        value={row[f.key] ?? ""}
        maxLength={f.maxLength}
        min={f.min}
        list={f.list}
        className="input-full"
        onChange={(e) => onChange(f.key, e.target.value)}
      />
    );

  const updateEditRow = (index) => (key, value) =>
    setEditRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );

  return (
    <div className="card">
      <h3>{section.title}</h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {section.fields.map((f) => (
                <th key={f.key} className={alignOf(f)}>
                  {f.label}
                </th>
              ))}
              <th className="align-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {editRows.map((row, index) => (
              <tr key={row.masterId}>
                {section.fields.map((f) => (
                  <td key={f.key} className={alignOf(f)}>
                    {field(row, f, updateEditRow(index))}
                  </td>
                ))}
                <td className="align-center nowrap">
                  <Button
                    className="btn-sm"
                    title="上へ"
                    disabled={index === 0}
                    onClick={() => onMove(row, "up")}
                  >
                    ▲
                  </Button>{" "}
                  <Button
                    className="btn-sm"
                    title="下へ"
                    disabled={index === editRows.length - 1}
                    onClick={() => onMove(row, "down")}
                  >
                    ▼
                  </Button>{" "}
                  <Button
                    variant="primary"
                    className="btn-sm"
                    onClick={() => onUpdate(row)}
                  >
                    更新
                  </Button>{" "}
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => onDelete(row)}
                  >
                    削除
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              {section.fields.map((f) => (
                <td key={f.key} className={alignOf(f)}>
                  {field(newRow, f, (key, value) =>
                    setNewRow((prev) => ({ ...prev, [key]: value })),
                  )}
                </td>
              ))}
              <td className="align-center">
                <Button className="btn-sm" onClick={() => onAdd(newRow)}>
                  追加
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
