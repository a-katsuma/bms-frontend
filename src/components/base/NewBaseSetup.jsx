import { useState } from "react";
import Button from "../../atoms/Button";
import { keyOf } from "../../utils/baseUtils";

const SOURCE_SURVEY = "SURVEY";
const SOURCE_COPY = "COPY";
const NAME_MAX = 50;

/**
 * 新しいベースの準備（ベース名と初期値を決める）
 *   初期値：現況確認表から行を選ぶ／既存のベースをコピーする
 * @param bases       案件のベース（使用停止中を含む）
 * @param preview     現況確認表の集計
 * @param activeItems 使用中のベースの現在の版の行（baseId 付き）
 * @param onStart     { baseName, source: "SURVEY", rows } または { baseName, source: "COPY", copyBaseId }
 */
export default function NewBaseSetup({
  bases,
  preview,
  activeItems,
  blockReason,
  initialName = "",
  onStart,
  onCancel,
}) {
  // 行ごとに、その行がある使用中のベースの名前
  const nameOf = new Map(bases.map((b) => [b.baseId, b.baseName]));
  const ownersOf = new Map();
  activeItems.forEach((i) => {
    const k = keyOf(i);
    ownersOf.set(k, [...(ownersOf.get(k) ?? []), nameOf.get(i.baseId)]);
  });
  const copyable = bases.filter((b) => b.currentVersionNo != null);

  const [baseName, setBaseName] = useState(initialName);
  const [source, setSource] = useState(SOURCE_SURVEY);
  // 初期値：どのベースにもない行にチェック
  const [checked, setChecked] = useState(
    () => new Set(preview.filter((p) => !ownersOf.has(keyOf(p))).map(keyOf)),
  );
  const [copyBaseId, setCopyBaseId] = useState(copyable[0]?.baseId ?? "");

  const name = baseName.trim();
  const nameError =
    name.length > NAME_MAX
      ? `ベース名は${NAME_MAX}文字以内で入力してください。`
      : bases.some((b) => b.baseName.toLowerCase() === name.toLowerCase())
        ? `「${name}」というベースは既にあります（使用停止中を含む）。`
        : "";
  const canStart =
    !blockReason &&
    name !== "" &&
    !nameError &&
    (source === SOURCE_SURVEY ? checked.size > 0 : copyBaseId !== "");

  const toggle = (key) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const handleStart = () => {
    if (source === SOURCE_SURVEY) {
      onStart({
        baseName: name,
        source,
        rows: preview.filter((p) => checked.has(keyOf(p))),
      });
    } else {
      onStart({ baseName: name, source, copyBaseId: Number(copyBaseId) });
    }
  };

  return (
    <div className="card">
      <h3>新しいベース</h3>

      {blockReason && (
        <div className="alert alert-danger mb-15">※{blockReason}</div>
      )}

      <h4 className="section-title">ベース名（必須）</h4>
      <input
        type="text"
        value={baseName}
        maxLength={NAME_MAX}
        placeholder="例：通常点検、総合点検"
        aria-label="ベース名"
        onChange={(e) => setBaseName(e.target.value)}
      />
      {nameError && <div className="text-danger mt-5">{nameError}</div>}

      <h4 className="section-title">初期値</h4>
      <div className="flex-row mb-10">
        <label className="inline-label nowrap">
          <input
            type="radio"
            name="new-base-source"
            checked={source === SOURCE_SURVEY}
            onChange={() => setSource(SOURCE_SURVEY)}
          />
          現況確認表から行を選ぶ
        </label>
        <label className="inline-label nowrap">
          <input
            type="radio"
            name="new-base-source"
            checked={source === SOURCE_COPY}
            disabled={copyable.length === 0}
            onChange={() => setSource(SOURCE_COPY)}
          />
          既存のベースをコピー
        </label>
      </div>

      {source === SOURCE_SURVEY && (
        <>
          <div className="flex-row mb-10">
            <Button
              className="btn-sm"
              onClick={() => setChecked(new Set(preview.map(keyOf)))}
            >
              すべて選ぶ
            </Button>
            <Button className="btn-sm" onClick={() => setChecked(new Set())}>
              すべて外す
            </Button>
            <span className="note">
              {checked.size} / {preview.length} 行を選択中
            </span>
          </div>
          <table className="compact-table">
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr>
                <th className="align-center">選択</th>
                <th>棟</th>
                <th>項目</th>
                <th className="align-right">数量</th>
                <th>単位</th>
                <th className="align-right">対象外数</th>
                <th>ほかのベース</th>
              </tr>
            </thead>
            <tbody>
              {preview.length === 0 && (
                <tr>
                  <td colSpan={7} className="align-center">
                    現況確認表に行がありません。
                  </td>
                </tr>
              )}
              {preview.map((p) => {
                const k = keyOf(p);
                const owners = ownersOf.get(k);
                return (
                  <tr key={k}>
                    <td className="align-center">
                      <input
                        type="checkbox"
                        checked={checked.has(k)}
                        aria-label={`${p.building} ${p.itemName}`}
                        onChange={() => toggle(k)}
                      />
                    </td>
                    <td>{p.building}</td>
                    <td>{p.itemName}</td>
                    <td className="align-right">{p.baseQuantity}</td>
                    <td>{p.unit}</td>
                    <td className="align-right">{p.excludedQuantity || ""}</td>
                    <td>
                      {owners ? (
                        owners.join("・")
                      ) : (
                        <span className="text-muted">なし</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="note mt-10">
            ※単価は、ほかのベースに同じ行があればその単価を入れます。ない行は次の画面で入力してください。
          </div>
        </>
      )}

      {source === SOURCE_COPY && (
        <>
          <select
            value={copyBaseId}
            onChange={(e) => setCopyBaseId(e.target.value)}
          >
            {copyable.map((b) => (
              <option key={b.baseId} value={b.baseId}>
                {`${b.baseName}（第${b.currentVersionNo}版）${b.stopped ? "（使用停止）" : ""}`}
              </option>
            ))}
          </select>
          <div className="note mt-10">
            ※コピー元の現在の版の明細・単価・その他項目・税率をコピーします。不要な行は次の画面で削除してください。
          </div>
        </>
      )}

      <div className="action-buttons-form">
        <Button variant="primary" onClick={handleStart} disabled={!canStart}>
          次へ（明細の入力）
        </Button>
        <Button variant="cancel" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
