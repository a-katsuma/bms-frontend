import { useState, useEffect } from "react";
import { extraWorkApi } from "../../api/extraWorkApi";
import { yen, formatDate } from "../../utils/baseUtils";
import { WORK_TYPE_CLASS, extraItemAmount } from "../../utils/extraWorkUtils";

/**
 * 毎次明細（下書き）に、受注済みの緊急・追加作業を取り込むダイアログ
 * 開くたびにサーバーから候補を取り直す（画面を開いたあとに削除・請求・取り込みされた作業を出さないため）
 * 候補：同じ顧客・業者で、受注済み・未請求・未取り込み。この明細にもう入れた作業（excludeIds）は除く
 * 選んだ作業を onImport(works) で返す（行への変換は呼び出し側で rowsFromExtraWork）
 */
export default function ImportExtraWorksDialog({
  clientId,
  companyId,
  excludeIds = [],
  onImport,
  onCancel,
}) {
  const [candidates, setCandidates] = useState(null); // null は読み込み中
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    extraWorkApi
      .getImportCandidates(clientId, companyId)
      .then((res) =>
        setCandidates(
          (res.extraWorks ?? []).filter((w) => !excludeIds.includes(w.extraWorkId)),
        ),
      )
      .catch((error) => {
        console.error("取り込める作業の取得エラー:", error);
        setCandidates([]);
      });
  }, [clientId, companyId]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const amountOf = (w) =>
    (w.items ?? []).reduce((sum, i) => sum + extraItemAmount(i), 0);

  return (
    <div
      className="dialog-overlay"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}
    >
      <div
        className="dialog dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-label="受注済みから取り込む"
      >
        <h3 className="dialog-title">受注済みの緊急・追加作業を取り込む</h3>
        <div className="dialog-message note">
          この明細と同じ顧客・発注元で、受注済み・未請求・未取り込みの作業です。作業の行ごとに、緊急・追加作業の行としてコピーします（取り込んだ行は、明細の上では直せません）。
        </div>

        {candidates === null ? (
          <div className="note mt-10">読み込み中…</div>
        ) : candidates.length === 0 ? (
          <div className="note mt-10">取り込める作業はありません。</div>
        ) : (
          <div className="table-container mt-10">
            <table className="compact-table">
              <thead>
                <tr>
                  <th />
                  <th className="center">区分</th>
                  <th>実施日</th>
                  <th>場所</th>
                  <th>依頼内容</th>
                  <th className="num">当社→発注元</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((w) => (
                  <tr key={w.extraWorkId}>
                    <td className="center">
                      <input
                        type="checkbox"
                        checked={selected.includes(w.extraWorkId)}
                        onChange={() => toggle(w.extraWorkId)}
                      />
                    </td>
                    <td className="center">
                      <span className={WORK_TYPE_CLASS[w.workType]}>{w.workType}</span>
                    </td>
                    <td>{formatDate(w.workDate)}</td>
                    <td>{w.location || "-"}</td>
                    <td>{w.content}</td>
                    <td className="num">
                      {yen(amountOf(w))}（{(w.items ?? []).length}行）
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn btn-cancel" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={selected.length === 0}
            onClick={() =>
              onImport(
                (candidates ?? []).filter((w) => selected.includes(w.extraWorkId)),
              )
            }
          >
            取り込む（{selected.length}件）
          </button>
        </div>
      </div>
    </div>
  );
}
