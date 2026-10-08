// 集計・照合用のキー（棟＋項目＋単位）
export const keyOf = (r) => `${r.building}\u0000${r.itemName}\u0000${r.unit}`;

// 対象数
export const targetOf = (r) =>
  Number(r.baseQuantity || 0) - Number(r.excludedQuantity || 0);

export const yen = (n) => `${Math.round(Number(n) || 0).toLocaleString()}円`;

export const formatDateTime = (s) =>
  s ? s.replace("T", " ").slice(0, 16) : "-";

export const formatDate = (s) => (s ? s.slice(0, 10) : "-");


export const quoteLabel = (q) =>
  `ID ${q.quoteId}（${q.quoteDate}・${q.quoteStatus}）`;

// 金額の合計（実費は含めない）
export const calcTotals = (items, others, taxRate) => {
  const itemTotal = items.reduce(
    (sum, i) => sum + targetOf(i) * Number(i.unitPrice || 0),
    0,
  );
  const otherTotal = others
    .filter((o) => !o.isVariable)
    .reduce(
      (sum, o) =>
        sum + Number(o.defaultQuantity || 0) * Number(o.defaultUnitPrice || 0),
      0,
    );
  const subtotal = itemTotal + otherTotal;
  const tax = Math.floor((subtotal * Number(taxRate || 0)) / 100);
  return { subtotal, tax, total: subtotal + tax };
};

// 行と現況確認表の差（差がなければ null）
export const diffOf = (row, surveyMap) => {
  const s = surveyMap.get(keyOf(row));
  if (!s) return { type: "NOT_IN_SURVEY" };
  if (
    Number(s.baseQuantity) !== Number(row.baseQuantity || 0) ||
    Number(s.excludedQuantity) !== Number(row.excludedQuantity || 0)
  ) {
    return { type: "CHANGED", survey: s };
  }
  return null;
};

// 現況確認表にあってベース明細にない行（otherItems：ほかの使用中のベースの行。そこにある行は除く）
export const missingRows = (items, preview = [], otherItems = []) => {
  const keys = new Set([...items, ...otherItems].map(keyOf));
  return preview.filter((p) => !keys.has(keyOf(p)));
};

// 差分の件数
export const countDiffs = (items, preview = [], otherItems = []) => {
  const surveyMap = new Map(preview.map((p) => [keyOf(p), p]));
  return (
    items.filter((r) => diffOf(r, surveyMap)).length +
    missingRows(items, preview, otherItems).length
  );
};


// 改版をおすすめする変更か（数量・対象外数の変更、行の追加・削除）
export const isStructuralChange = (original = [], edited = []) => {
  if (original.length !== edited.length) return true;
  const map = new Map(original.map((r) => [keyOf(r), r]));
  return edited.some((r) => {
    const o = map.get(keyOf(r));
    return (
      !o ||
      Number(o.baseQuantity) !== Number(r.baseQuantity || 0) ||
      Number(o.excludedQuantity || 0) !== Number(r.excludedQuantity || 0)
    );
  });
};

// --- 版どうしの差分 ---
const ITEM_DIFF_FIELDS = [
  { label: "数量", value: (r) => String(Number(r.baseQuantity || 0)) },
  { label: "対象外数", value: (r) => String(Number(r.excludedQuantity || 0)) },
  { label: "理由", value: (r) => String(r.excludedReason ?? "").trim() },
  { label: "単価", value: (r) => yen(r.unitPrice) },
  { label: "金額", value: (r) => yen(targetOf(r) * Number(r.unitPrice || 0)) },
];

const OTHER_DIFF_FIELDS = [
  { label: "毎回変動", value: (o) => (o.isVariable ? "あり" : "なし") },
  {
    label: "単価",
    value: (o) => (o.isVariable ? "実費" : yen(o.defaultUnitPrice)),
  },
  { label: "数量", value: (o) => String(Number(o.defaultQuantity || 0)) },
];

const otherKeyOf = (o) => String(o.feeName ?? "").trim();

const diffRows = (prevRows, nextRows, keyFn, fields) => {
  const prevMap = new Map(prevRows.map((r) => [keyFn(r), r]));
  const nextKeys = new Set(nextRows.map(keyFn));

  const added = nextRows.filter((r) => !prevMap.has(keyFn(r)));
  const removed = prevRows.filter((r) => !nextKeys.has(keyFn(r)));
  const changed = nextRows
    .filter((r) => prevMap.has(keyFn(r)))
    .map((r) => {
      const p = prevMap.get(keyFn(r));
      const diffFields = fields
        .filter((f) => f.value(p) !== f.value(r))
        .map((f) => ({
          label: f.label,
          before: f.value(p),
          after: f.value(r),
        }));
      return { row: r, fields: diffFields };
    })
    .filter((c) => c.fields.length > 0);

  return {
    added,
    changed,
    removed,
    count: added.length + changed.length + removed.length,
  };
};

// 前の版（prev）→ 後の版（next）の差分
export const diffVersions = (prev, next) => {
  const items = diffRows(prev.items, next.items, keyOf, ITEM_DIFF_FIELDS);
  const others = diffRows(
    prev.otherItems,
    next.otherItems,
    otherKeyOf,
    OTHER_DIFF_FIELDS,
  );
  const taxChanged = Number(prev.taxRate) !== Number(next.taxRate);
  const quoteChanged = (prev.quoteId ?? null) !== (next.quoteId ?? null);
  const prevTotal = calcTotals(prev.items, prev.otherItems, prev.taxRate).total;
  const nextTotal = calcTotals(next.items, next.otherItems, next.taxRate).total;

  return {
    items,
    others,
    taxChanged,
    quoteChanged,
    prevTotal,
    nextTotal,
    count:
      items.count +
      others.count +
      (taxChanged ? 1 : 0) +
      (quoteChanged ? 1 : 0),
  };
};

// --- 棟ごとの表示（PC の表・タブレット/スマホのカード） ---

// 新しい行（棟を指定する）
export const newBaseItem = (building) => ({
  building,
  itemName: "",
  unit: "",
  baseQuantity: 0,
  excludedQuantity: 0,
  excludedReason: "",
  unitPrice: "",
});

// 棟ごとにまとめる（最初に出てきた順）。entries は { row, ... } の配列
export const groupByBuilding = (entries) => {
  const groups = [];
  entries.forEach((entry) => {
    let g = groups.find((x) => x.building === entry.row.building);
    if (!g) {
      g = { building: entry.row.building, entries: [] };
      groups.push(g);
    }
    g.entries.push(entry);
  });
  return groups;
};
