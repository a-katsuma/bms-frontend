import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import BaseItemsTable from "../../components/base/BaseItemsTable";
import VersionDiff from "../../components/base/VersionDiff";
import BaseOtherItemsTable from "../../components/base/BaseOtherItemsTable";
import { baseApi } from "../../api/baseApi";
import { masterApi } from "../../api/masterApi";
import {
  keyOf,
  yen,
  calcTotals,
  countDiffs,
  missingRows,
  isStructuralChange,
  formatDate,
  quoteLabel,
  newBaseItem,
} from "../../utils/baseUtils";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useDialog } from "../../hooks/useDialog";
import { useMessage } from "../../hooks/useMessage";

const emptyOther = () => ({
  feeName: "",
  defaultUnitPrice: "",
  defaultQuantity: 1,
  isVariable: 0,
});

// 保存用の形にそろえる（未保存の判定にも使う）
const toPayload = ({ items, others, taxRate, quoteId }) => ({
  quoteId: quoteId === "" || quoteId == null ? null : Number(quoteId),
  taxRate: Number(taxRate),
  items: items.map((i) => ({
    building: String(i.building ?? "").trim(),
    itemName: String(i.itemName ?? "").trim(),
    unit: String(i.unit ?? "").trim(),
    baseQuantity: Number(i.baseQuantity || 0),
    excludedQuantity: Number(i.excludedQuantity || 0),
    excludedReason: i.excludedReason?.trim() || null,
    unitPrice:
      i.unitPrice === "" || i.unitPrice == null ? null : Number(i.unitPrice),
  })),
  otherItems: others.map((o) => ({
    feeName: String(o.feeName ?? "").trim(),
    defaultUnitPrice: o.isVariable
      ? 0
      : o.defaultUnitPrice === ""
        ? null
        : Number(o.defaultUnitPrice),
    defaultQuantity: Number(o.defaultQuantity || 0),
    isVariable: o.isVariable ? 1 : 0,
  })),
});

// 版の内容 → 編集フォームの形
const formOf = (version) => ({
  items: version.items,
  others: version.otherItems,
  taxRate: version.taxRate,
  quoteId: version.quoteId ?? "",
});

// 版に紐づく見積りのリンク
function QuoteLink({ quoteId, filepath, date, status }) {
  if (!quoteId) return "指定なし";
  return (
    <a
      href={`http://localhost:8080/${filepath}`}
      target="_blank"
      rel="noreferrer"
    >
      ID {quoteId}（{date}・{status}）
    </a>
  );
}

const totalRows = (totals, taxRate) => [
  { label: "小計", value: yen(totals.subtotal) },
  { label: `消費税（${Number(taxRate)}%）`, value: yen(totals.tax) },
  { label: "合計（実費除く）", value: <strong>{yen(totals.total)}</strong> },
];

export default function BillingBase() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { confirm, prompt } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [data, setData] = useState(null);
  const [masters, setMasters] = useState({});
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [others, setOthers] = useState([]);
  const [taxRate, setTaxRate] = useState(10);
  const [quoteId, setQuoteId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [editStart, setEditStart] = useState(null); // 読み込んだ時点のフォーム（未保存の判定の基準）

  // 編集フォームに読み込み、未保存の判定の基準にする
  const loadForm = (form) => {
    setItems(form.items.map((i) => ({ ...i })));
    setOthers(form.others.map((o) => ({ ...o })));
    setTaxRate(Number(form.taxRate));
    setQuoteId(form.quoteId);
    setEditStart(form);
  };

  const fetchBase = () => {
    setLoading(true);
    baseApi
      .get(id, isAdmin)
      .then((res) => {
        setData(res);
        setSelectedVersionId("");
        if (res.base?.currentVersion) {
          loadForm(formOf(res.base.currentVersion));
          setEditing(false);
        } else {
          // 未生成：現況確認表の集計から生成フォームを作る
          const ordered = (res.quotes ?? []).find(
            (q) => q.quoteStatus === "発注",
          );
          loadForm({
            items: (res.preview ?? []).map((p) => ({ ...p, unitPrice: "" })),
            others: [],
            taxRate: 10,
            quoteId: ordered?.quoteId ?? "",
          });
          setEditing(isAdmin);
        }
      })
      .catch((error) => {
        console.error("ベース明細取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate(`/projects/${id}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBase();
    if (isAdmin) {
      masterApi
        .getAll()
        .then(setMasters)
        .catch((error) => console.error("常用項目取得エラー:", error));
    }
  }, [id, isAdmin]);

  // 未保存の変更（読み込んだ時点・キャンセルした時点との比較）
  const dirty =
    editing &&
    editStart != null &&
    JSON.stringify(toPayload({ items, others, taxRate, quoteId })) !==
      JSON.stringify(toPayload(editStart));
  useUnsavedChangesGuard(dirty);

  if (loading || !data) {
    return <Loading />;
  }

  const { project, base, preview = [], quotes = [], blockReason } = data;
  const current = base?.currentVersion ?? null;

  // 業者側で未生成
  if (!isAdmin && !current) {
    return (
      <div className="content-wrapper theme-contractee">
        <PageHeader title="ベース明細" />
        <div className="card">
          <div className="text-muted mb-10">
            ベース明細はまだ作成されていません。
          </div>
          <Button to={`/projects/${id}`} variant="cancel">
            案件詳細へ戻る
          </Button>
        </div>
      </div>
    );
  }

  // --- 保存 ---
  const buildPayload = (mode) => ({
    mode,
    ...toPayload({ items, others, taxRate, quoteId }),
  });

  const handleSave = async (mode) => {
    const confirmMessage = !current
      ? "ベース明細を生成しますか？"
      : mode === "CORRECT"
        ? `第${current.versionNo}版を上書きして保存しますか？（入力ミスの訂正）`
        : `第${current.versionNo + 1}版として新しく保存しますか？`;
    const ok = await confirm(confirmMessage, {
      title: !current
        ? "ベース明細の生成"
        : mode === "CORRECT"
          ? "訂正として保存"
          : "新しい版として保存",
      okLabel: !current ? "生成" : "保存",
    });
    if (!ok) return;

    baseApi
      .save(id, buildPayload(mode))
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        fetchBase();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "保存に失敗しました。");
      });
  };

  const handleCancel = async () => {
    if (dirty) {
      const ok = await confirm("編集中の内容を破棄しますか？", {
        title: "編集の取り消し",
        okLabel: "破棄する",
        danger: true,
      });
      if (!ok) return;
    }
    loadForm(formOf(current));
    setEditing(false);
    clearMessage();
  };

  // 棟を追加（棟名を入力して、空の行を1つ作る）
  const addBuilding = async () => {
    const name = (
      await prompt("追加する棟名を入力してください", "", {
        title: "棟の追加",
        okLabel: "追加",
        maxLength: 50,
      })
    )?.trim();
    if (!name) return;
    if (items.some((r) => r.building === name)) {
      showError(
        `「${name}」は既にあります。行の追加は棟の［行追加］から行ってください。`,
      );
      return;
    }
    setItems((prev) => [...prev, newBaseItem(name)]);
  };

  // 差分をすべて現況に合わせる（数量の反映＋未登録行の追加）
  const applyAllSurvey = () => {
    const surveyMap = new Map(preview.map((p) => [keyOf(p), p]));
    const updated = items.map((r) => {
      const s = surveyMap.get(keyOf(r));
      return s
        ? {
            ...r,
            baseQuantity: s.baseQuantity,
            excludedQuantity: s.excludedQuantity,
            excludedReason: s.excludedReason ?? "",
          }
        : r;
    });
    const added = missingRows(items, preview).map((s) => ({
      ...s,
      unitPrice: "",
    }));
    setItems([...updated, ...added]);
  };

  // --- 表示用の値 ---
  const shownItems = editing ? items : current.items;
  const shownOthers = editing ? others : current.otherItems;
  const shownTaxRate = editing ? taxRate : current.taxRate;
  const totals = calcTotals(shownItems, shownOthers, shownTaxRate);

  // 合計欄（編集中は、税率と見積りの入力を合計の上に1行ずつ並べる）
  const totalItems = [
    ...(editing
      ? [
          {
            label: "税率（%）",
            value: (
              <input
                type="number"
                min={0}
                max={99}
                step={0.01}
                value={taxRate}
                className="input-qty"
                onChange={(e) => setTaxRate(e.target.value)}
              />
            ),
          },
          {
            label: "元になる見積り",
            value: (
              <select
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
              >
                <option value="">指定なし</option>
                {quotes.map((q) => (
                  <option key={q.quoteId} value={q.quoteId}>
                    {quoteLabel(q)}
                  </option>
                ))}
              </select>
            ),
          },
        ]
      : []),
    ...totalRows(totals, shownTaxRate),
  ];

  const savedDiffCount =
    isAdmin && current ? countDiffs(current.items, preview) : 0;
  const editDiffCount = editing ? countDiffs(items, preview) : 0;
  const recommendRevise =
    editing &&
    current &&
    (isStructuralChange(current.items, items) ||
      Number(taxRate) !== Number(current.taxRate));

  // 過去の版（現在の版を除く）
  const pastVersions = (base?.versions ?? []).filter(
    (v) => v.versionId !== current?.versionId,
  );
  const selectedVersion = pastVersions.find(
    (v) => String(v.versionId) === String(selectedVersionId),
  );

  // 1つ前の版（第1版なら null）
  const prevVersionOf = (v) =>
    base?.versions?.find((x) => x.versionNo === v.versionNo - 1) ?? null;
  const currentPrev = current ? prevVersionOf(current) : null;
  const selectedPrev = selectedVersion ? prevVersionOf(selectedVersion) : null;

  const summaryItems = [
    { label: "案件名", value: project.projectName },
    { label: "顧客名", value: project.clientName },
    {
      label: "現在の版",
      value: current
        ? `第${current.versionNo}版（作成 ${formatDate(current.createdAt)}）`
        : "未生成",
    },
    {
      label: "見積り",
      value: current ? (
        <QuoteLink
          quoteId={current.quoteId}
          filepath={current.quoteFilepath}
          date={current.quoteDate}
          status={current.quoteStatus}
        />
      ) : (
        "-"
      ),
    },
  ];
  if (isAdmin && current) {
    summaryItems.push({
      label: "現況確認表との差分",
      value:
        savedDiffCount > 0 ? (
          <span className="text-danger">{savedDiffCount}件（赤色の行）</span>
        ) : (
          "なし"
        ),
    });
  }

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title={current ? "ベース明細" : "ベース明細生成"} />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <div className="card">
        <h3>概要</h3>
        <DetailList items={summaryItems} />
        <div className="survey-back">
          <Button to={`/projects/${id}`} variant="cancel">
            案件詳細へ戻る
          </Button>
        </div>
      </div>

      {/* --- 明細〜合計（1枚のカード） --- */}
      <div className="card base-card">
        <h3>
          最新ベース明細
          {current && !editing ? `（第${current.versionNo}版）` : ""}
        </h3>

        {/* 見出しの下の操作（閲覧中：編集する／編集中：棟を追加） */}
        {isAdmin && current && !editing && (
          <div className="base-toolbar">
            <Button variant="primary" onClick={() => setEditing(true)}>
              編集する
            </Button>
          </div>
        )}
        {editing && (
          <div className="base-toolbar">
            <Button onClick={addBuilding}>棟を追加</Button>
          </div>
        )}

        {dirty && (
          <div className="text-danger mb-10">※未保存の変更があります。</div>
        )}

        {editing && !current && blockReason && (
          <div className="alert alert-danger mb-15">※{blockReason}</div>
        )}

        {editing && editDiffCount > 0 && (
          <div className="alert alert-danger mb-15">
            現況確認表と異なる行が {editDiffCount} 件あります（赤色の行）。
            <div className="alert-action">
              <Button onClick={applyAllSurvey}>すべて現況に合わせる</Button>
            </div>
            <div className="note-sm">
              ※「現況になし」の行は自動では削除しません。不要な場合は行を削除してください。
            </div>
          </div>
        )}

        <BaseItemsTable
          items={shownItems}
          editable={editing}
          preview={isAdmin ? preview : null}
          onChange={setItems}
        />

        <h4 className="section-title">その他項目</h4>
        <BaseOtherItemsTable
          others={shownOthers}
          editable={editing}
          onChange={setOthers}
        />
        {editing && (
          <div className="mt-10">
            <Button
              onClick={() => setOthers((prev) => [...prev, emptyOther()])}
            >
              その他項目を追加
            </Button>
            <span className="note ml-10">
              ※「毎回変動」にチェックを入れると単価は「実費」になり、明細を作るたびに金額を入力します（駐車場代など）
            </span>
          </div>
        )}

        <DetailList variant="totals" items={totalItems} />

        {!editing && currentPrev && (
          <VersionDiff prev={currentPrev} next={current} />
        )}

        {recommendRevise && (
          <div className="text-danger mt-15">
            ※数量・項目・税率が変わっているため「新しい版として保存」をおすすめします。
          </div>
        )}

        {editing && (
          <div className="action-buttons-form">
            {!current && (
              <Button
                variant="primary"
                onClick={() => handleSave("REVISE")}
                disabled={Boolean(blockReason) || items.length === 0}
              >
                ベース明細を生成
              </Button>
            )}
            {current && (
              <>
                <Button
                  variant={recommendRevise ? "secondary" : "primary"}
                  onClick={() => handleSave("CORRECT")}
                >
                  訂正として保存（第{current.versionNo}版を上書き）
                </Button>
                <Button
                  variant={recommendRevise ? "primary" : "secondary"}
                  onClick={() => handleSave("REVISE")}
                >
                  新しい版として保存（第{current.versionNo + 1}版）
                </Button>
                <Button variant="cancel" onClick={handleCancel}>
                  キャンセル
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- 過去のベース明細 --- */}
      {pastVersions.length > 0 && (
        <div className="card base-card">
          <h3>過去のベース明細</h3>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
          >
            <option value="">版を選択してください</option>
            {pastVersions.map((v) => (
              <option key={v.versionId} value={v.versionId}>
                {`第${v.versionNo}版（${formatDate(v.createdAt)}）`}
              </option>
            ))}
          </select>

          {selectedVersion && (
            <div className="mt-15">
              <DetailList
                items={[
                  {
                    label: "見積り",
                    value: (
                      <QuoteLink
                        quoteId={selectedVersion.quoteId}
                        filepath={selectedVersion.quoteFilepath}
                        date={selectedVersion.quoteDate}
                        status={selectedVersion.quoteStatus}
                      />
                    ),
                  },
                  {
                    label: "作成",
                    value: formatDate(selectedVersion.createdAt),
                  },
                ]}
              />
              <BaseItemsTable items={selectedVersion.items} />
              <h4 className="section-title">その他項目</h4>
              <BaseOtherItemsTable others={selectedVersion.otherItems} />
              <DetailList
                variant="totals"
                items={totalRows(
                  calcTotals(
                    selectedVersion.items,
                    selectedVersion.otherItems,
                    selectedVersion.taxRate,
                  ),
                  selectedVersion.taxRate,
                )}
              />
              {selectedPrev && (
                <VersionDiff prev={selectedPrev} next={selectedVersion} />
              )}
            </div>
          )}
        </div>
      )}

      {/* 入力候補（マスタ） */}
      <datalist id="survey-item-list">
        {(masters.ITEM ?? []).map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
      <datalist id="survey-unit-list">
        {(masters.UNIT ?? []).map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
      <datalist id="base-other-list">
        {(masters.OTHER ?? []).map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
    </div>
  );
}
