export const STATUS_DRAFT = "下書き";
export const STATUS_CONFIRMED = "確定";

// 今回の対象数（数量 − 対象外数 − 調整数）
export const statementTargetOf = (r) =>
  Number(r.baseQuantity || 0) -
  Number(r.excludedQuantity || 0) +
  Number(r.adjustmentQuantity || 0);

export const itemAmount = (r) =>
  statementTargetOf(r) * Number(r.unitPrice || 0);

export const otherAmount = (o) =>
  Number(o.quantity || 0) * Number(o.unitPrice || 0);

// 税抜小計から消費税・合計を出す（ベースと同じく税は切り捨て）
export const totalsFromSubtotal = (subtotal, taxRate) => {
  const tax = Math.floor((Number(subtotal || 0) * Number(taxRate || 0)) / 100);
  return {
    subtotal: Number(subtotal || 0),
    tax,
    total: Number(subtotal || 0) + tax,
  };
};

// 明細の合計（実費も含める）
export const calcStatementTotals = (items, others, taxRate) =>
  totalsFromSubtotal(
    items.reduce((sum, r) => sum + itemAmount(r), 0) +
      others.reduce((sum, o) => sum + otherAmount(o), 0),
    taxRate,
  );

// 2026-10 → 2026年10月
export const formatMonth = (m) =>
  m ? `${m.slice(0, 4)}年${Number(m.slice(5, 7))}月` : "-";

// 今月（YYYY-MM）
export const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// 状態の文字の色（確定＝緑、下書き＝オレンジ）のクラス
export const statusClass = (status) =>
  status === STATUS_CONFIRMED ? "text-success" : "text-warning";

export const WORK_TYPES = ["緊急", "追加"];

// 今日（YYYY-MM-DD）
export const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// 提示額（税別）＝ 当社請求額 ×（1＋加算割合）。承認なしは null
export const presentedAmount = (amount, markupRate) =>
  markupRate == null
    ? null
    : Math.round(amount * (1 + Number(markupRate) / 100));

// 実施日（YYYY-MM-DD）の時点で有効だった事前承認（その日までに開始した最新の設定）
export const policyOn = (policies = [], workDate) => {
  if (!workDate) return null;
  return policies
    .filter((p) => String(p.effectiveFrom).slice(0, 10) <= workDate)
    .reduce(
      (latest, p) =>
        !latest ||
        p.effectiveFrom > latest.effectiveFrom ||
        (p.effectiveFrom === latest.effectiveFrom &&
          p.policyId > latest.policyId)
          ? p
          : latest,
      null,
    );
};

// 実施日の時点の加算割合（承認なし・未設定は null）
export const markupRateOn = (policies, workDate) => {
  const p = policyOn(policies, workDate);
  return p?.isAgreed === 1 ? p.markupRate : null;
};

// 緊急・追加作業の行の加算割合（承認なしは null）
//   受注済みから取り込んだ行（extraWorkId あり）：作業に記録した値
//   手入力の行：編集中は実施日の時点の事前承認、閲覧は保存した値
export const temporaryRateOf = (row, editable, policies) =>
  row.extraWorkId != null || !editable
    ? (row.markupRate ?? null)
    : markupRateOn(policies, row.workDate);

// 緊急・追加作業の新しい行（画面上のみ・未保存）
let tmpSeq = 0;
export const newTemporaryRow = () => ({
  _key: `tmp-${Date.now()}-${tmpSeq++}`,
  workType: "",
  workDate: today(),
  building: "",
  itemName: "",
  temporaryReason: "",
  baseQuantity: 1,
  unit: "式",
  unitPrice: "",
});

// 受注済みの緊急・追加作業 → 臨時行（作業の行ごとに1行。画面上のみ・未保存）
//   場所 → 棟の列（building）、依頼内容 → 依頼内容（temporaryReason）。加算割合は作業に記録した値
export const rowsFromExtraWork = (work) =>
  (work.items ?? []).map((i) => ({
    _key: `tmp-${Date.now()}-${tmpSeq++}`,
    extraWorkId: work.extraWorkId,
    workType: work.workType,
    workDate: work.workDate,
    building: work.location ?? "",
    itemName: i.itemName,
    temporaryReason: work.content,
    baseQuantity: i.quantity,
    unit: i.unit,
    unitPrice: i.unitPrice,
    markupRate: work.markupRate,
  }));
