import { useState } from "react";
import Button from "../../atoms/Button";
import { buildFloorLabels, expandRows } from "../../utils/surveyUtils";
import { useDialog } from "../../hooks/useDialog";

const emptyBuilding = () => ({ name: "", above: 1, below: 0, hasRoof: false });
const emptyTemplate = () => ({ itemName: "", quantity: 1, unit: "" });

// 列の幅（%）。1件ごとに「見出し＋入力欄」の小さな表にして、スマホでも横に並べる
// 手順1：棟名｜地上階数｜地下階数｜屋上(RF)｜操作
// 手順2：項目名｜数量（1階あたり）｜単位｜操作
const COLS_BUILDING = [32, 18, 18, 13, 19];
const COLS_TEMPLATE = [38, 22, 21, 19];

function ColGroup({ cols }) {
  return (
    <colgroup>
      {cols.map((w, i) => (
        <col key={i} style={{ width: `${w}%` }} />
      ))}
    </colgroup>
  );
}

export default function SurveySetupWizard({
  existingBuildings = [],
  itemMasters = [],
  onExpand,
  onCancel,
}) {
  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState([emptyBuilding()]);
  const [templates, setTemplates] = useState([emptyTemplate()]);
  const [error, setError] = useState("");
  const { confirm } = useDialog();

  // --- 手順1：棟と階数 ---
  const updateBuilding = (index, key, value) => {
    setBuildings((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    );
  };

  const validateBuildings = () => {
    const names = buildings.map((b) => b.name.trim());
    if (names.some((n) => !n)) return "棟名を入力してください。";
    if (new Set(names).size !== names.length) return "棟名が重複しています。";

    const dup = names.find((n) => existingBuildings.includes(n));
    if (dup)
      return `「${dup}」は既に登録されています。階の追加は表の「階追加」から行ってください。`;

    for (const b of buildings) {
      if (Number(b.above) < 0 || Number(b.below) < 0)
        return "階数は0以上で入力してください。";
      if (buildFloorLabels(b).length === 0)
        return `「${b.name}」の階がありません。`;
    }
    return "";
  };

  // --- 手順2：項目・数量・単位 ---
  const updateTemplate = (index, key, value) => {
    setTemplates((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, [key]: value };
        // 常用項目の項目を選んだら、単位が空なら既定の単位を入れる
        if (key === "itemName" && !t.unit) {
          const master = itemMasters.find((m) => m.name === value);
          if (master?.defaultUnit) next.unit = master.defaultUnit;
        }
        return next;
      }),
    );
  };

  const validateTemplates = () => {
    if (templates.length === 0) return "項目を1件以上入力してください。";
    if (templates.some((t) => !t.itemName.trim() || !t.unit.trim()))
      return "項目名と単位を入力してください。";
    if (templates.some((t) => t.quantity === "" || Number(t.quantity) < 0))
      return "数量は0以上で入力してください。";
    return "";
  };

  // --- 画面遷移 ---
  const goNext = () => {
    const message = validateBuildings();
    setError(message);
    if (!message) setStep(2);
  };

  const handleExpand = async () => {
    const message = validateTemplates();
    setError(message);
    if (message) return;

    const rows = expandRows(buildings, templates);
    const ok = await confirm(`${rows.length}行を展開します。よろしいですか？`, {
      title: "表への展開",
      okLabel: "展開する",
    });
    if (!ok) return;
    onExpand(rows);
  };

  return (
    <div className="card survey-wizard">
      <h3>棟を追加　手順 {step}/2</h3>

      {error && <div className="alert alert-danger mb-15">{error}</div>}

      {step === 1 && (
        <>
          <div className="survey-wizard-lead">
            棟名と、棟ごとの階数を入力してください。
          </div>

          <div className="survey-wizard-box">
            {buildings.map((b, index) => (
              <div key={index} className="survey-wizard-entry">
                <table className="survey-wizard-table">
                  <ColGroup cols={COLS_BUILDING} />
                  <thead>
                    <tr>
                      <th>棟名</th>
                      <th>地上階数</th>
                      <th>地下階数</th>
                      <th>屋上(RF)</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          value={b.name}
                          maxLength={50}
                          placeholder="例：1号棟"
                          onChange={(e) =>
                            updateBuilding(index, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={b.above}
                          onChange={(e) =>
                            updateBuilding(index, "above", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={b.below}
                          onChange={(e) =>
                            updateBuilding(index, "below", e.target.value)
                          }
                        />
                      </td>
                      <td className="center">
                        <input
                          type="checkbox"
                          checked={b.hasRoof}
                          onChange={(e) =>
                            updateBuilding(index, "hasRoof", e.target.checked)
                          }
                        />
                      </td>
                      <td className="center">
                        <Button
                          variant="danger"
                          className="btn-sm"
                          disabled={buildings.length === 1}
                          onClick={() =>
                            setBuildings((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* 作成される階 */}
                <div className="survey-wizard-floors">
                  {buildFloorLabels(b).join("、") || "-"}
                </div>
              </div>
            ))}
          </div>

          <div className="survey-wizard-buttons">
            <Button
              onClick={() => setBuildings((prev) => [...prev, emptyBuilding()])}
            >
              棟を追加
            </Button>
            <Button variant="primary" onClick={goNext}>
              次へ（項目の追加）
            </Button>
            <Button variant="cancel" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="survey-wizard-lead">
            入力した項目を、手順1の全棟・全階に展開します。階ごとに違う部分は、展開後の表で追加・削除・編集できます。
          </div>

          <div className="survey-wizard-box">
            {templates.map((t, index) => (
              <div key={index} className="survey-wizard-entry">
                <table className="survey-wizard-table">
                  <ColGroup cols={COLS_TEMPLATE} />
                  <thead>
                    <tr>
                      <th>項目名</th>
                      <th>数量（1階あたり）</th>
                      <th>単位</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          value={t.itemName}
                          maxLength={100}
                          list="survey-item-list"
                          placeholder="例：空調機"
                          onChange={(e) =>
                            updateTemplate(index, "itemName", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={t.quantity}
                          onChange={(e) =>
                            updateTemplate(index, "quantity", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={t.unit}
                          maxLength={20}
                          list="survey-unit-list"
                          placeholder="例：台"
                          onChange={(e) =>
                            updateTemplate(index, "unit", e.target.value)
                          }
                        />
                      </td>
                      <td className="center">
                        <Button
                          variant="danger"
                          className="btn-sm"
                          disabled={templates.length === 1}
                          onClick={() =>
                            setTemplates((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          削除
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <div className="survey-wizard-buttons">
            <Button
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              戻る
            </Button>
            <Button
              onClick={() => setTemplates((prev) => [...prev, emptyTemplate()])}
            >
              項目を追加
            </Button>
            <Button variant="primary" onClick={handleExpand}>
              展開する
            </Button>
            <Button variant="cancel" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
