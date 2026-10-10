import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import ExtraWorkFields from "../../components/extraWork/ExtraWorkFields";
import { extraWorkApi } from "../../api/extraWorkApi";
import { masterApi } from "../../api/masterApi";
import { markupRateOn } from "../../utils/statementUtils";
import {
  emptyWorkForm,
  toWorkPayload,
  autoProjectName,
  PROJECT_NAME_MAX,
} from "../../utils/extraWorkUtils";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useMessage } from "../../hooks/useMessage";

// ひらがな → カタカナ（顧客のカナは全角カタカナで登録されている）
const toKatakana = (s) =>
  s.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  );

const byKana = (key) => (a, b) =>
  String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "ja");

// 緊急・追加作業の新規受注：顧客 → 業者 → 作業内容 → 案件名 を1枚で入力し、例外の案件と作業を一緒に作る
export default function ExtraWorkNew() {
  const navigate = useNavigate();
  const { showError, clearMessage } = useMessage();

  const [options, setOptions] = useState(null); // { clients, companies, pairs }
  const [masters, setMasters] = useState({});
  const [clientFilter, setClientFilter] = useState("");
  const [clientId, setClientId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [form, setForm] = useState(null);
  const [startJson, setStartJson] = useState(""); // 最初の状態（未保存の判定の基準）
  const [projectName, setProjectName] = useState("");
  const [nameEdited, setNameEdited] = useState(false); // 案件名を手で直したか
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    extraWorkApi
      .getNewForm()
      .then((res) => {
        setOptions({
          clients: [...(res.clients ?? [])].sort(byKana("clientKana")),
          companies: [...(res.companies ?? [])].sort(byKana("companyKana")),
          pairs: res.pairs ?? [],
        });
        const f = emptyWorkForm(res.defaultTaxRate);
        setForm(f);
        setStartJson(JSON.stringify(toWorkPayload(f)));
      })
      .catch((error) => {
        console.error("新規受注の選択肢取得エラー:", error);
        if (error.response?.status === 403) {
          navigate("/");
        }
      });
    masterApi
      .getAll()
      .then(setMasters)
      .catch((error) => console.error("常用項目取得エラー:", error));
  }, []);

  const dirty =
    form != null &&
    (clientId !== "" ||
      companyId !== "" ||
      nameEdited ||
      JSON.stringify(toWorkPayload(form)) !== startJson);
  const { allowLeave } = useUnsavedChangesGuard(dirty);

  if (!options || !form) {
    return <Loading />;
  }

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // 顧客：名前・カナで絞り込み（選んでいる顧客は、絞り込みに合わなくても残す）
  const keyword = clientFilter.trim();
  const kanaKeyword = toKatakana(keyword);
  const clients = options.clients.filter(
    (c) =>
      !keyword ||
      String(c.clientId) === clientId ||
      c.clientName.includes(keyword) ||
      String(c.clientKana ?? "").includes(kanaKeyword),
  );

  // 業者：この顧客の案件がある業者を上に。実施日の時点で事前承認が「承認する」でなければ選べない
  const companies = options.companies
    .map((co) => ({
      ...co,
      related:
        clientId !== "" &&
        options.pairs.some(
          (p) =>
            String(p.clientId) === clientId && p.companyId === co.companyId,
        ),
      rateOnDate: markupRateOn(co.policies, form.workDate),
    }))
    .sort((a, b) => Number(b.related) - Number(a.related));
  const company =
    companies.find((co) => String(co.companyId) === companyId) ?? null;
  const rate = company ? company.rateOnDate : null;

  const companyLabel = (co) =>
    `${co.companyName}${co.related ? "（この顧客の案件あり）" : ""}　` +
    (co.rateOnDate == null
      ? "事前承認なし"
      : `承認する ${Number(co.rateOnDate)}%`);

    // 案件名：手で直していなければ、実施日・依頼主・依頼内容から自動
  const name = nameEdited ? projectName : autoProjectName(form);

  const handleSave = () => {
    if (!clientId) {
      showError("顧客を選択してください。");
      return;
    }
    if (!companyId) {
      showError("発注元を選択してください。");
      return;
    }
    setProcessing(true);
    extraWorkApi
      .create({
        clientId: Number(clientId),
        companyId: Number(companyId),
        projectName: name.trim(),
        work: toWorkPayload(form),
      })
      .then((res) => {
        clearMessage();
        allowLeave(); // 登録後の移動は確認しない
        navigate(`/projects/${res.projectId}/extra-works/${res.extraWorkId}`, {
          state: { message: res.message },
        });
      })
      .catch((error) =>
        showError(error.response?.data?.errorMessage || "登録に失敗しました。"),
      )
      .finally(() => setProcessing(false));
  };

  return (
    <div className="content-wrapper">
      <PageHeader title="緊急・追加作業の新規受注" />

      <div className="card">
        <h3>① 顧客・発注元</h3>
        <div className="form-group mb-15">
          <label>顧客</label>
          <div className="picker-row">
            <input
              type="text"
              value={clientFilter}
              placeholder="名前・カナで絞り込み"
              onChange={(e) => setClientFilter(e.target.value)}
            />
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">選択してください（{clients.length}件）</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-row mt-5">
            <Button to="/clients/add" className="btn-sm">
              顧客を登録
            </Button>
            <span className="note">
              ※顧客が見つからないときは、先に［顧客を登録］してください。
            </span>
          </div>
        </div>

        <div className="form-group">
          <label>発注元</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">選択してください</option>
            {companies.map((co) => (
              <option
                key={co.companyId}
                value={co.companyId}
                disabled={co.rateOnDate == null}
              >
                {companyLabel(co)}
              </option>
            ))}
          </select>
          <div className="note mt-5">
            ※実施日（{form.workDate || "未入力"}
            ）の時点で、事前承認が「承認する」の発注元だけ選べます。この顧客の案件がある発注元を上に出しています。
          </div>
        </div>
      </div>

      <div className="card base-card">
        <h3>② 作業内容</h3>
        {company && rate == null && (
          <div className="alert alert-danger">
            実施日（{form.workDate || "未入力"}
            ）の時点で、{company.companyName}
            の事前承認が「承認する」になっていないため登録できません。実施日か発注元を確認してください。
          </div>
        )}
        <ExtraWorkFields
          form={form}
          onChange={set}
          rate={rate}
          masters={masters}
        />
      </div>

      <div className="card">
        <h3>③ 案件名</h3>
        <div className="form-group">
          <div className="flex-row">
            <input
              type="text"
              value={name}
              maxLength={PROJECT_NAME_MAX}
              onChange={(e) => {
                setNameEdited(true);
                setProjectName(e.target.value);
              }}
            />

            {nameEdited && (
              <Button
                className="btn-sm"
                onClick={() => {
                  setNameEdited(false);
                  setProjectName("");
                }}
              >
                自動に戻す
              </Button>
            )}
          </div>
          <div className="note mt-5">
            ※区分・実施日・場所（なければ依頼主）から自動で入ります（
            {PROJECT_NAME_MAX}
            文字まで）。直すこともできます。
          </div>
        </div>

        <div className="action-buttons-form">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={processing || !clientId || !companyId || rate == null}
          >
            登録する
          </Button>
          <Button to="/extra-works" variant="cancel">
            緊急・追加作業一覧へ戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
