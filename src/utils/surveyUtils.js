let tmpSeq = 0;

// 新しい行（画面上のみ・未保存）
export const newRow = (overrides = {}) => ({
  _key: `new-${Date.now()}-${tmpSeq++}`,
  surveyItemId: null,
  building: "",
  floorLabel: "",
  itemName: "",
  quantity: 0,
  unit: "",
  excludedQuantity: 0,
  excludedReason: "",
  orderStatus: "未",
  ...overrides,
});

// 階ラベルを生成（地下は深い順 → 地上 → 屋上）
export const buildFloorLabels = ({ above, below, hasRoof }) => {
  const floors = [];
  for (let i = Number(below) || 0; i >= 1; i--) floors.push(`B${i}F`);
  for (let i = 1; i <= (Number(above) || 0); i++) floors.push(`${i}F`);
  if (hasRoof) floors.push("RF");
  return floors;
};

// 段階入力の内容を「棟 × 階 × 項目」に展開
export const expandRows = (buildings, templates) => {
  const rows = [];
  buildings.forEach((b) => {
    buildFloorLabels(b).forEach((floorLabel) => {
      templates.forEach((t) => {
        rows.push(
          newRow({
            building: b.name.trim(),
            floorLabel,
            itemName: t.itemName.trim(),
            quantity: Number(t.quantity) || 0,
            unit: t.unit.trim(),
          }),
        );
      });
    });
  });
  return rows;
};

// 棟→階の順に並べ直す（最初に出てきた順を維持）
export const groupItems = (items) => {
  const buildingOrder = new Map();
  const floorOrder = new Map();
  const floorKey = (r) => `${r.building}\u0000${r.floorLabel}`;

  items.forEach((r) => {
    if (!buildingOrder.has(r.building)) buildingOrder.set(r.building, buildingOrder.size);
    if (!floorOrder.has(floorKey(r))) floorOrder.set(floorKey(r), floorOrder.size);
  });

  return items
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        buildingOrder.get(a.row.building) - buildingOrder.get(b.row.building) ||
        floorOrder.get(floorKey(a.row)) - floorOrder.get(floorKey(b.row)) ||
        a.index - b.index,
    )
    .map(({ row }) => row);
};

// 棟・階セルの rowSpan を計算（items は棟→階の順に並んでいる前提）
export const withRowSpans = (items) =>
  items.map((row, index) => {
    const prev = items[index - 1];
    const firstOfBuilding = !prev || prev.building !== row.building;
    const firstOfFloor = firstOfBuilding || prev.floorLabel !== row.floorLabel;

    let buildingSpan = 0;
    let floorSpan = 0;
    if (firstOfBuilding) {
      let j = index;
      while (j < items.length && items[j].building === row.building) j++;
      buildingSpan = j - index;
    }
    if (firstOfFloor) {
      let j = index;
      while (
        j < items.length &&
        items[j].building === row.building &&
        items[j].floorLabel === row.floorLabel
      )
        j++;
      floorSpan = j - index;
    }
    return { row, index, buildingSpan, floorSpan };
  });

// 対象数
export const targetQuantity = (row) =>
  Number(row.quantity || 0) - Number(row.excludedQuantity || 0);


// 差分を見る列
const DIFF_FIELDS = [
  { key: "building", label: "棟" },
  { key: "floorLabel", label: "階" },
  { key: "itemName", label: "項目" },
  { key: "quantity", label: "数量", number: true },
  { key: "unit", label: "単位" },
  { key: "excludedQuantity", label: "対象外数", number: true },
  { key: "excludedReason", label: "理由" },
];

const normalizeField = (row, field) =>
  field.number ? Number(row[field.key] || 0) : String(row[field.key] ?? "").trim();

// 保存済みの行（before）と編集中の行（after）の差分
export const diffSurveyItems = (before, after) => {
  const afterIds = new Set(after.map((r) => r.surveyItemId).filter((v) => v != null));
  const beforeById = new Map(before.map((r) => [r.surveyItemId, r]));

  const added = after.filter((r) => r.surveyItemId == null);
  const removed = before.filter((r) => !afterIds.has(r.surveyItemId));
  const changed = after
    .filter((r) => r.surveyItemId != null && beforeById.has(r.surveyItemId))
    .map((r) => {
      const old = beforeById.get(r.surveyItemId);
      const fields = DIFF_FIELDS.filter((f) => normalizeField(old, f) !== normalizeField(r, f)).map(
        (f) => ({ label: f.label, before: normalizeField(old, f), after: normalizeField(r, f) }),
      );
      return { row: r, fields };
    })
    .filter((c) => c.fields.length > 0);

  return { added, changed, removed, count: added.length + changed.length + removed.length };
};

// 棟 → 階 → 行 にまとめる（カード表示用。index は items の中の位置）
export const groupByBuildingFloor = (items) => {
  const buildings = [];
  items.forEach((row, index) => {
    let b = buildings.find((x) => x.building === row.building);
    if (!b) {
      b = { building: row.building, floors: [] };
      buildings.push(b);
    }
    let f = b.floors.find((x) => x.floorLabel === row.floorLabel);
    if (!f) {
      f = { floorLabel: row.floorLabel, rows: [] };
      b.floors.push(f);
    }
    f.rows.push({ row, index });
  });
  return buildings;
};
