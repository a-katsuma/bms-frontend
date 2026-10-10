import DetailList from "../DetailList";
import ExtraWorkItemsTable from "./ExtraWorkItemsTable";
import { yen } from "../../utils/baseUtils";
import { WORK_TYPES } from "../../utils/statementUtils";
import { calcExtraWorkTotals } from "../../utils/extraWorkUtils";

/**
 * 緊急・追加作業の入力欄（新規受注・編集で共通）
 *   区分・実施日・依頼主・場所・依頼内容 → 作業の行 → 合計欄
 * @param form 入力中の値（formOfWork／emptyWorkForm の形）
 * @param onChange (key, value) => void
 * @param rate 実施日の時点の加算割合（承認なし・業者が未選択は null）
 * @param masters 常用項目（作業内容・単位の入力候補。作業内容には常用項目の「項目」＝機器の名前を出す）
 * @param locked true なら入力できない（請求済み）。fieldset disabled で中の入力欄・ボタンをまとめて止める
 */
export default function ExtraWorkFields({
  form,
  onChange,
  rate,
  masters = {},
  locked = false,
}) {
  const totals = calcExtraWorkTotals(form.items, rate, form.taxRate);

  // 合計欄（当社→業者・加算割合・業者→顧客。税率の入力は業者→顧客の下に置く）
  const totalItems = [
    { label: "当社→発注元（税別）", value: yen(totals.ourSubtotal) },
    {
      label: "加算割合",
      value:
        rate == null ? (
          <span className="text-danger">承認なし</span>
        ) : (
          `${Number(rate)}%`
        ),
    },
    {
      label: "発注元→顧客（税別）",
      value: totals.presentedSubtotal == null ? "-" : yen(totals.presentedSubtotal),
    },
    {
      label: "税率（%）",
      value: (
        <input
          type="number"
          min={0}
          max={99.99}
          step={0.01}
          value={form.taxRate}
          className="input-qty"
          onChange={(e) => onChange("taxRate", e.target.value)}
        />
      ),
    },
    { label: "消費税", value: totals.tax == null ? "-" : yen(totals.tax) },
    {
      label: "発注元→顧客（税込）",
      value: <strong>{totals.total == null ? "-" : yen(totals.total)}</strong>,
    },
  ];

  return (
    <fieldset disabled={locked} className="form-lock">
            <div className="form-group mb-15">
        <label>区分</label>
        <select
          value={form.workType}
          onChange={(e) => onChange("workType", e.target.value)}
        >
          <option value="">選択してください</option>
          {WORK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group mb-15">
        <label>実施日</label>
        <input
          type="date"
          value={form.workDate ?? ""}
          onChange={(e) => onChange("workDate", e.target.value)}
        />
      </div>
      <div className="form-group mb-15">
        <label>依頼主</label>
        <input
          type="text"
          value={form.requester}
          maxLength={50}
          placeholder="例：管理人の○○さん"
          onChange={(e) => onChange("requester", e.target.value)}
        />
      </div>
      <div className="form-group mb-15">
        <label>場所（任意）</label>
        <input
          type="text"
          value={form.location}
          maxLength={100}
          placeholder="例：本館2F 201号室"
          onChange={(e) => onChange("location", e.target.value)}
        />
      </div>
      <div className="form-group mb-15">
        <label>依頼内容</label>
        <input
          type="text"
          value={form.content}
          maxLength={255}
          placeholder="例：天カセ1台から漏水"
          onChange={(e) => onChange("content", e.target.value)}
        />
      </div>


      <h4 className="section-title">作業の行</h4>
      <ExtraWorkItemsTable
        items={form.items}
        markupRate={rate}
        onChange={(next) => onChange("items", next)}
      />

      <DetailList variant="totals" items={totalItems} />

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
    </fieldset>
  );
}
