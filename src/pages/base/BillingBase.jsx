import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
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
import BaseSwitcher from "../../components/base/BaseSwitcher";
import NewBaseSetup from "../../components/base/NewBaseSetup";
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
import { fileUrl } from "../../config";


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

// 最新の「発注」の見積り（新しいベースの初期値）
const orderedQuoteIdOf = (quotes) =>
  (quotes ?? []).find((q) => q.quoteStatus === "発注")?.quoteId ?? "";

// 版に紐づく見積りのリンク
function QuoteLink({ quoteId, filepath, date, status }) {
  if (!quoteId) return "指定なし";
  return (
    <a
      href={fileUrl(filepath)}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const baseIdParam = searchParams.get("baseId"); // 未指定なら使用中の先頭のベース
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { confirm, prompt } = useDialog();
  const { showError, clearMessage } = useMessage();

  const [data, setData] = useState(null);
  const [masters, setMasters] = useState({});
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false); // 新しいベースを作成中
  const [setupOpen, setSetupOpen] = useState(false); // 作成の準備（ベース名・初期値）を表示中
  const [newBaseName, setNewBaseName] = useState("");
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
      .get(id, isAdmin, baseIdParam)
      .then((res) => {
        setData(res);
        setSelectedVersionId("");
        setEditing(false);
        setNewBaseName("");
        if (res.base?.currentVersion) {
          loadForm(formOf(res.base.currentVersion));
          setCreating(false);
          setSetupOpen(false);
        } else {
          // ベースがない：管理者は新しいベースの準備から
          setCreating(isAdmin);
          setSetupOpen(isAdmin);
        }
      })
      .catch((error) => {
        console.error("ベース明細取得エラー:", error);
        const status = error.response?.status;
        if (status === 404 && baseIdParam) {
          setSearchParams({}, { replace: true }); // 指定のベースがない：先頭のベースを表示
        } else if (status === 403 || status === 404) {
          navigate(`/projects/${id}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBase();
  }, [id, isAdmin, baseIdParam]);

  useEffect(() => {
    if (isAdmin) {
      masterApi
        .getAll()
        .then(setMasters)
        .catch((error) => console.error("常用項目取得エラー:", error));
    }
  }, [isAdmin]);

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

  const {
    project,
    bases = [],
    base,
    preview = [],
    otherBaseItems = [],
    quotes = [],
    blockReason,
  } = data;
  const current = creating ? null : (base?.currentVersion ?? null);
  const stopped = !creating && Boolean(base?.stopped);

  // 使用中のベースの現在の版の行（表示中のベースを含む）
  const activeItems = [
    ...otherBaseItems,
    ...(base && !base.stopped && base.currentVersion ? base.currentVersion.items : []),
  ];
  // 「どのベースにもない行」の判定に使う、ほかのベースの行
  const otherItems = creating ? activeItems : otherBaseItems;

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

  // --- 画面の切り替え ---
  // 編集中の内容を捨ててよいか（変更がなければそのまま進む）
  const confirmDiscard = async () => {
    if (!dirty) return true;
    return confirm("編集中の内容を破棄しますか？", {
      title: "編集の取り消し",
      okLabel: "破棄する",
      danger: true,
    });
  };

  // 作成をやめて、表示中のベースに戻る
  const backToBase = () => {
    setCreating(false);
    setSetupOpen(false);
    setEditing(false);
    setNewBaseName("");
    if (base?.currentVersion) {
      loadForm(formOf(base.currentVersion));
    }
  };

  const selectBase = async (baseId) => {
    if (!(await confirmDiscard())) return;
    clearMessage();
    if (baseId === base?.baseId) {
      backToBase();
      return;
    }
    setSearchParams({ baseId: String(baseId) });
  };

  const startNewBase = async () => {
    if (!(await confirmDiscard())) return;
    clearMessage();
    setCreating(true);
    setSetupOpen(true);
    setEditing(false);
    setNewBaseName("");
  };

  const cancelSetup = () => {
    if (!base) {
      navigate(`/projects/${id}`);
      return;
    }
    backToBase();
  };

  // 準備の画面から明細の入力へ
  const handleSetupStart = ({ baseName, source, rows, copyBaseId }) => {
    clearMessage();
    const orderedQuoteId = orderedQuoteIdOf(quotes);
    const begin = (form) => {
      setNewBaseName(baseName);
      loadForm(form);
      setSetupOpen(false);
      setEditing(true);
    };

    if (source === "SURVEY") {
      // 単価は、ほかのベースに同じ行があればその単価
      const priceOf = new Map(activeItems.map((i) => [keyOf(i), i.unitPrice]));
      begin({
        items: rows.map((r) => ({ ...r, unitPrice: priceOf.get(keyOf(r)) ?? "" })),
        others: [],
        taxRate: 10,
        quoteId: orderedQuoteId,
      });
      return;
    }

    baseApi
      .get(id, true, copyBaseId)
      .then((res) => {
        const version = res.base?.currentVersion;
        if (!version) {
          showError("コピー元のベースが見つかりません。");
          return;
        }
        begin({ ...formOf(version), quoteId: orderedQuoteId });
      })
      .catch((error) => {
        console.error("コピー元のベース取得エラー:", error);
        showError("コピー元のベースの取得に失敗しました。");
      });
  };

   // --- 保存（作成：POST／訂正：PUT／改版：POST .../versions） ---
  const handleSave = async (mode) => {
    const confirmMessage = creating
      ? `ベース「${newBaseName}」を作成しますか？`
      : mode === "CORRECT"
        ? `第${current.versionNo}版を上書きして保存しますか？（入力ミスの訂正）`
        : `第${current.versionNo + 1}版として新しく保存しますか？`;
    const ok = await confirm(confirmMessage, {
      title: creating
        ? "ベース明細の作成"
        : mode === "CORRECT"
          ? "訂正として保存"
          : "新しい版として保存",
      okLabel: creating ? "作成" : "保存",
    });
    if (!ok) return;

    const payload = toPayload({ items, others, taxRate, quoteId });
    const request = creating
      ? baseApi.create(id, { baseName: newBaseName, ...payload })
      : mode === "CORRECT"
        ? baseApi.correct(id, base.baseId, payload)
        : baseApi.revise(id, base.baseId, payload);

    request
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        if (String(res.baseId) === baseIdParam) {
          fetchBase();
        } else {
          setSearchParams({ baseId: String(res.baseId) }); // 作成したベース（または指定なしで開いていたベース）を表示
        }
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "保存に失敗しました。");
      });
  };


  const handleCancel = async () => {
    if (!(await confirmDiscard())) return;
    clearMessage();
    if (creating) {
      // 作成中：初期値の選び直しに戻る
      setEditing(false);
      setSetupOpen(true);
      return;
    }
    loadForm(formOf(current));
    setEditing(false);
  };

  // --- ベースの管理（名前・使用停止・削除） ---
  const runBaseAction = (request, onDone = fetchBase) =>
    request
      .then((res) => {
        clearMessage();
        setSuccessMessage(res.message);
        onDone();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "処理に失敗しました。");
      });

  const renameBase = async () => {
    const name = (
      await prompt("新しいベース名を入力してください", base.baseName, {
        title: "ベース名の変更",
        okLabel: "変更",
        maxLength: 50,
      })
    )?.trim();
    if (!name || name === base.baseName) return;
    runBaseAction(baseApi.rename(id, base.baseId, name));
  };

  const stopBase = async () => {
    const ok = await confirm(
      `ベース「${base.baseName}」を使用停止にしますか？\n毎次明細の作成・現況確認表の発注状況・差分の対象から外れます。\n（あとで再開できます）`,
      { title: "ベースの使用停止", okLabel: "使用停止", danger: true },
    );
    if (!ok) return;
    runBaseAction(baseApi.stop(id, base.baseId));
  };

  const resumeBase = async () => {
    const ok = await confirm(`ベース「${base.baseName}」の使用を再開しますか？`, {
      title: "ベースの使用再開",
      okLabel: "再開",
    });
    if (!ok) return;
    runBaseAction(baseApi.resume(id, base.baseId));
  };

  const deleteBase = async () => {
    const ok = await confirm(
      `ベース「${base.baseName}」を削除しますか？\nすべての版と明細が削除され、元に戻せません。`,
      { title: "ベースの削除", okLabel: "削除", danger: true },
    );
    if (!ok) return;
    runBaseAction(baseApi.remove(id, base.baseId), () => {
      if (baseIdParam) {
        setSearchParams({}); // 先頭のベースを表示
      } else {
        fetchBase();
      }
    });
  };

  // --- 明細の編集 ---
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

  // 差分をすべて現況に合わせる（数量の反映＋どのベースにもない行の追加）
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
    const added = missingRows(items, preview, otherItems).map((s) => ({
      ...s,
      unitPrice: "",
    }));
    setItems([...updated, ...added]);
  };

  // --- 新しいベースの準備 ---
  if (setupOpen) {
    return (
      <div className="content-wrapper">
        <PageHeader title="ベース明細の作成" />
        <BaseSwitcher
          bases={bases}
          selectedId={base?.baseId}
          adding
          onSelect={selectBase}
          onAdd={startNewBase}
        />
        <NewBaseSetup
          bases={bases}
          preview={preview}
          activeItems={activeItems}
          blockReason={blockReason}
          initialName={newBaseName}
          onStart={handleSetupStart}
          onCancel={cancelSetup}
        />
      </div>
    );
  }

  // --- 表示用の値 ---
  const shownItems = editing ? items : current.items;
  const shownOthers = editing ? others : current.otherItems;
  const shownTaxRate = editing ? taxRate : current.taxRate;
  const totals = calcTotals(shownItems, shownOthers, shownTaxRate);
  const showSurvey = isAdmin && !stopped; // 使用停止中のベースは現況と比べない

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
    showSurvey && current ? countDiffs(current.items, preview, otherItems) : 0;
  const editDiffCount = editing ? countDiffs(items, preview, otherItems) : 0;
  const recommendRevise =
    editing &&
    current &&
    (isStructuralChange(current.items, items) ||
      Number(taxRate) !== Number(current.taxRate));

  // 過去の版（現在の版を除く）
  const pastVersions = creating
    ? []
    : (base?.versions ?? []).filter((v) => v.versionId !== current?.versionId);
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
      label: "ベース名",
      value: creating ? (
        `${newBaseName}（新規作成）`
      ) : (
        <>
          {base.baseName}
          {stopped && <span className="text-muted">（使用停止中）</span>}
        </>
      ),
    },
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
  if (showSurvey && current) {
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
      <PageHeader title={current ? "ベース明細" : "ベース明細の作成"} />

      <AlertMessage
        message={successMessage}
        type="success"
        duration={5000}
        onClose={() => setSuccessMessage("")}
      />

      <BaseSwitcher
        bases={bases}
        selectedId={base?.baseId}
        adding={creating}
        onSelect={selectBase}
        onAdd={isAdmin ? startNewBase : null}
      />

      <div className="card">
        <h3>概要</h3>
        <DetailList items={summaryItems} />

        {/* ベースの管理（閲覧中のみ） */}
        {isAdmin && base && !creating && !editing && (
          <>
            <div className="base-toolbar mt-10">
              <Button className="btn-sm" onClick={renameBase}>
                ベース名を変更
              </Button>
              {stopped ? (
                <>
                  <Button className="btn-sm" onClick={resumeBase}>
                    使用を再開
                  </Button>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={deleteBase}
                    disabled={base.statementCount > 0}
                  >
                    削除
                  </Button>
                </>
              ) : (
                <Button variant="danger" className="btn-sm" onClick={stopBase}>
                  使用停止
                </Button>
              )}
            </div>
            {stopped && base.statementCount > 0 && (
              <div className="note-sm">
                ※毎次明細（{base.statementCount}件）があるため削除できません。
              </div>
            )}
          </>
        )}

        <div className="survey-back">
          <Button to={`/projects/${id}`} variant="cancel">
            案件詳細へ戻る
          </Button>
        </div>
      </div>

      {/* --- 明細〜合計（1枚のカード） --- */}
      <div className="card base-card">
        <h3>
          {creating ? `新しいベース明細（${newBaseName}）` : "最新ベース明細"}
          {current && !editing ? `（第${current.versionNo}版）` : ""}
        </h3>

        {/* 見出しの下の操作（閲覧中：編集する／編集中：棟を追加） */}
        {isAdmin && current && !editing && !stopped && (
          <div className="base-toolbar">
            <Button variant="primary" onClick={() => setEditing(true)}>
              編集する
            </Button>
          </div>
        )}
        {isAdmin && stopped && (
          <div className="text-muted mb-10">
            ※使用停止中のベースです。編集するには使用を再開してください。
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
              ほかのベースにある行は「ベース明細未登録」に出しません。
            </div>
          </div>
        )}

        <BaseItemsTable
          items={shownItems}
          editable={editing}
          preview={showSurvey ? preview : null}
          otherItems={otherItems}
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
              <>
                <Button
                  variant="primary"
                  onClick={() => handleSave("REVISE")}
                  disabled={Boolean(blockReason) || items.length === 0}
                >
                  ベース明細を作成
                </Button>
                <Button variant="cancel" onClick={handleCancel}>
                  戻る（初期値の選び直し）
                </Button>
              </>
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
