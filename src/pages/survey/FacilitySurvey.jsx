import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAtomValue } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import AlertMessage from "../../components/AlertMessage";
import Button from "../../atoms/Button";
import PageHeader from "../../components/PageHeader";
import Loading from "../../components/Loading";
import DetailList from "../../components/DetailList";
import SurveySetupWizard from "../../components/survey/SurveySetupWizard";
import SurveyTable from "../../components/survey/SurveyTable";
import SurveyChangeSummary from "../../components/survey/SurveyChangeSummary";
import { surveyApi } from "../../api/surveyApi";
import { masterApi } from "../../api/masterApi";
import { useUndoRedo } from "../../hooks/useUndoRedo";
import { diffSurveyItems } from "../../utils/surveyUtils";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { useMessage } from "../../hooks/useMessage";

export default function FacilitySurvey() {
  const { id } = useParams();
  const navigate = useNavigate();
  const loginUser = useAtomValue(loginUserAtom);
  const isAdmin = loginUser?.roleFlag === 1;
  const { showError, clearMessage } = useMessage();

  const [project, setProject] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [savedItems, setSavedItems] = useState([]); // 読み込んだ時点の内容（差分の基準）
  const itemsHistory = useUndoRedo([]);
  const items = itemsHistory.value;
  const [masters, setMasters] = useState({});
  const [showWizard, setShowWizard] = useState(false);
  const [confirming, setConfirming] = useState(false); // 保存前の確認中
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const summaryRef = useRef(null); // 保存内容の確認（表示したらここまでスクロール）

  const fetchSurvey = () => {
    setLoading(true);
    surveyApi
      .get(id, isAdmin)
      .then((data) => {
        const loaded = data.survey?.items ?? [];
        setProject(data.project);
        setSurvey(data.survey);
        setSavedItems(loaded);
        itemsHistory.reset(loaded);
        setShowWizard(isAdmin && loaded.length === 0); // 未作成なら段階入力から開始
        setConfirming(false);
      })
      .catch((error) => {
        console.error("現状確認表取得エラー:", error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          navigate(`/projects/${id}`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSurvey();
    if (isAdmin) {
      masterApi
        .getAll()
        .then(setMasters)
        .catch((error) => console.error("常用項目取得エラー:", error));
    }
  }, [id, isAdmin]);

  // ［保存］で確認欄を出したら、そこまでスクロールする
  useEffect(() => {
    if (confirming) {
      summaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [confirming]);

  const handleItemsChange = (next, mergeKey) =>
    itemsHistory.set(next, mergeKey);

  const handleExpand = (rows) => {
    itemsHistory.set([...items, ...rows]);
    setShowWizard(false);
  };

  const toPayload = () =>
    items.map((row) => ({
      surveyItemId: row.surveyItemId ?? null,
      building: row.building.trim(),
      floorLabel: row.floorLabel.trim(),
      itemName: row.itemName.trim(),
      quantity: Number(row.quantity),
      unit: row.unit.trim(),
      excludedQuantity: Number(row.excludedQuantity || 0),
      excludedReason: row.excludedReason?.trim() || null,
    }));

  const handleSave = () => {
    setSaving(true);
    surveyApi
      .save(id, toPayload())
      .then(() => {
        clearMessage();
        setSuccessMessage("現状確認表を保存しました。");
        fetchSurvey();
      })
      .catch((error) => {
        setSuccessMessage("");
        showError(error.response?.data?.errorMessage || "保存に失敗しました。");
        setConfirming(false); // 編集に戻して直せるようにする
      })
      .finally(() => setSaving(false));
  };

  // 未保存の変更（読み込んだ時点との差分）
  const changes = diffSurveyItems(savedItems, items);
  const dirty = changes.count > 0;
  useUnsavedChangesGuard(dirty);

  if (loading || !project) {
    return <Loading />;
  }

  const itemMasters = masters.ITEM ?? [];
  const unitMasters = masters.UNIT ?? [];
  const existingBuildings = [...new Set(items.map((r) => r.building))];
  const pendingCount = items.filter((r) => r.orderStatus !== "済").length;

  const summaryItems = [
    { label: "案件名", value: project.projectName },
    { label: "顧客名", value: project.clientName },
    {
      label: "最終更新",
      value: survey?.updatedAt?.replace("T", " ") ?? "未作成",
    },
    {
      label: "発注状況",
      value: (
        <span className={pendingCount > 0 ? "text-danger" : ""}>
          未 {pendingCount}件 ／ 全 {items.length}件
        </span>
      ),
    },
  ];

  return (
    <div className={`content-wrapper ${isAdmin ? "" : "theme-contractee"}`}>
      <PageHeader title="現状確認表" />

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

      {showWizard && (
        <SurveySetupWizard
          existingBuildings={existingBuildings}
          itemMasters={itemMasters}
          onExpand={handleExpand}
          onCancel={() => setShowWizard(false)}
        />
      )}

      <div className="card survey-card">
        <h3>設備一覧</h3>

        {isAdmin && dirty && (
          <div className="text-danger survey-unsaved">
            ※未保存の変更があります（追加 {changes.added.length}／変更{" "}
            {changes.changed.length}／削除 {changes.removed.length}）
          </div>
        )}

        {isAdmin && !confirming && (
          <div className="survey-toolbar">
            <Button onClick={() => setShowWizard(true)} disabled={showWizard}>
              棟を追加（段階入力）
            </Button>
            <Button
              onClick={itemsHistory.undo}
              disabled={!itemsHistory.canUndo}
            >
              ↶ 戻る
            </Button>
            <Button
              onClick={itemsHistory.redo}
              disabled={!itemsHistory.canRedo}
            >
              ↷ 進む
            </Button>
            <Button
              variant="primary"
              onClick={() => setConfirming(true)}
              disabled={!dirty}
            >
              保存
            </Button>
          </div>
        )}

        <SurveyTable
          items={items}
          editable={isAdmin && !confirming}
          itemMasters={itemMasters}
          onChange={handleItemsChange}
        />

        {confirming && (
          <div ref={summaryRef}>
            <SurveyChangeSummary
              changes={changes}
              saving={saving}
              onConfirm={handleSave}
              onCancel={() => setConfirming(false)}
            />
          </div>
        )}
      </div>

      {/* 項目名・単位の入力候補（常用項目） */}
      <datalist id="survey-item-list">
        {itemMasters.map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
      <datalist id="survey-unit-list">
        {unitMasters.map((m) => (
          <option key={m.masterId} value={m.name} />
        ))}
      </datalist>
    </div>
  );
}
