import { presentedAmount, totalsFromSubtotal, today } from "./statementUtils";

export const EW_STATUS_DRAFT = "下書き";
export const EW_STATUS_PENDING = "保留";
export const EW_STATUS_ORDERED = "受注済み";

// 案件の受注の経路（緊急・追加作業の例外の案件。Backend の Project.ORDER_ROUTE_POLICY と同じ）
export const ORDER_ROUTE_POLICY = "事前承認";

// 状態の文字の色（受注済み＝緑、保留＝青、下書き＝オレンジ）のクラス
export const extraWorkStatusClass = (status) =>
  status === EW_STATUS_ORDERED
    ? "text-success"
    : status === EW_STATUS_PENDING
      ? "text-info"
      : "text-warning";

// 区分ごとの文字の色（毎次明細の臨時行と同じ）
export const WORK_TYPE_CLASS = {
  緊急: "text-danger",
  追加: "text-info",
};

// 行の当社請求額（数量 × 当社単価）
export const extraItemAmount = (r) =>
  Number(r.quantity || 0) * Number(r.unitPrice || 0);

// 作業の合計：当社請求額・提示額（税別。行ごとに四捨五入して合計）・消費税・合計（税込）
// 加算割合がない（承認なし）ときは、提示額以降は null
export const calcExtraWorkTotals = (items, markupRate, taxRate) => {
  const ourSubtotal = items.reduce((sum, r) => sum + extraItemAmount(r), 0);
  if (markupRate == null) {
    return { ourSubtotal, presentedSubtotal: null, tax: null, total: null };
  }
  const presentedSubtotal = items.reduce(
    (sum, r) => sum + presentedAmount(extraItemAmount(r), markupRate),
    0,
  );
  const { tax, total } = totalsFromSubtotal(presentedSubtotal, taxRate);
  return { ourSubtotal, presentedSubtotal, tax, total };
};

// 作業の新しい行（画面上のみ・未保存）
let seq = 0;
export const newExtraWorkItem = () => ({
  _key: `ew-${Date.now()}-${seq++}`,
  itemName: "",
  quantity: 1,
  unit: "式",
  unitPrice: "",
});

// ---------- 入力フォーム（新規受注・編集で共通） ----------

// 保存用の形にそろえる（未保存の判定にも使う）
export const toWorkPayload = (f) => ({
  workType: f.workType,
  workDate: f.workDate || null,
  location: String(f.location ?? "").trim() || null,
  content: String(f.content ?? "").trim(),
  requester: String(f.requester ?? "").trim(),
  taxRate: f.taxRate === "" || f.taxRate == null ? null : Number(f.taxRate),
  items: f.items.map((i) => ({
    itemName: String(i.itemName ?? "").trim(),
    quantity: Number(i.quantity || 0),
    unit: String(i.unit ?? "").trim(),
    unitPrice:
      i.unitPrice === "" || i.unitPrice == null ? null : Number(i.unitPrice),
  })),
});

// 作業 → 入力フォームの形
export const formOfWork = (w) => ({
  workType: w.workType,
  workDate: w.workDate,
  location: w.location ?? "",
  content: w.content ?? "",
  requester: w.requester ?? "",
  taxRate: Number(w.taxRate),
  items: (w.items ?? []).map((i) => ({ ...i })),
});

// 新規受注の初期値
export const emptyWorkForm = (taxRate) => ({
  workType: "",
  workDate: today(),
  location: "",
  content: "",
  requester: "",
  taxRate: Number(taxRate ?? 10),
  items: [newExtraWorkItem()],
});

// 案件名の初期値：【区分】MM/dd 場所（なければ依頼主）。30文字まで（サーバーと同じ作り方）
export const PROJECT_NAME_MAX = 30;
export const autoProjectName = (f) => {
  const date = f.workDate
    ? `${f.workDate.slice(5, 7)}/${f.workDate.slice(8, 10)}`
    : "";
  const where =
    String(f.location ?? "").trim() || String(f.requester ?? "").trim();
  return `【${f.workType || "区分"}】${date} ${where}`
    .trim()
    .slice(0, PROJECT_NAME_MAX);
};
