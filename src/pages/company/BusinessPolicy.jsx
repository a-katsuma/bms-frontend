import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useSetAtom } from "jotai";
import { loginUserAtom } from "../../atoms/loginUserAtom";
import { userApi } from "../../api/userApi";
import { useDialog } from "../../hooks/useDialog";
export default function BusinessPolicy() {
  const navigate = useNavigate();
  const setLoginUser = useSetAtom(loginUserAtom);
  const { confirm } = useDialog();

  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [agreementChoice, setAgreementChoice] = useState("");
  const [markupRate, setMarkupRate] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [isSet, setIsSet] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    userApi
      .getMyBusinessPolicy()
      .then((data) => {
        if (data) {
          setCurrentPolicy(data);
          setAgreementChoice(data.isAgreed === 1 ? "agree" : "disagree");
          setMarkupRate(data.markupRate ? String(data.markupRate) : "");
          setIsSet(true);
        }
      })
      .catch((err) => {
        console.error("ポリシー取得エラー:", err);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreementChoice) {
      setError("「承認する」または「承認しない」を選択してください。");
      return;
    }

    const isAgreed = agreementChoice === "agree";

    if (isAgreed) {
      const rateNum = Number(markupRate);
      if (!markupRate || isNaN(rateNum) || rateNum < 10 || rateNum > 30) {
        setError("加算割合は10%～30%の範囲で入力してください。");
        return;
      }
    }

    const needsAcknowledge = isSet && currentPolicy?.isAgreed === 1;
    if (needsAcknowledge && !acknowledge) {
      setError(
        "すでに受注済みの臨時作業には旧割合が適用されることへの同意が必要です。",
      );
      return;
    }
    if (!isAgreed) {
      const confirmed = await confirm(
        "事前承認が未承認の場合、現場でお客様から追加依頼があった場合に" +
          "承ることができません。『未承認』でよろしいですか？\n" +
          "※後から変更可能です。",
        { title: "事前承認の設定", okLabel: "未承認で登録" },
      );
      if (!confirmed) return;
    }
    userApi
      .setMyBusinessPolicy(
        isAgreed,
        isAgreed ? Number(markupRate) : null,
        acknowledge,
      )
      .then(() => {
        setLoginUser((prev) => ({
          ...prev,
          businessPolicyAgreed: isAgreed,
          businessPolicySet: true,
        }));
        navigate("/");
      })
      .catch((err) => {
        setError(err.response?.data?.errorMessage || "処理に失敗しました。");
      });
  };

  return (
    <div className="content-wrapper">
      <header>
        <h1>事前承認設定</h1>
      </header>

      {/* ★ 白枠カードの外（上部）に配置 */}
      {error && <div className="policy-warning-alert">{error}</div>}

      <div className="card">
        <h3>事前承認のご希望確認</h3>

        {/* 画像にあった説明文章 */}
        <p className="policy-card-desc">
          緊急・追加作業をお客様がご希望された場合、御社との見積りを省略し『提示額』でお客様から受注することを承認しますか？
        </p>
        <span className="policy-card-subtext">
          ※追加作業：見積書にない新規項目の追加
        </span>

        <div className="policy-calc-box">
          <div className="policy-calc-text">
            提示額 ＝ 当社→御社 請求額 ×（1 ＋
            御社設定の加算割合(%)）※税別
            <br />
            <span className="policy-calc-sub">
              （例：10,000円 × 20％ ＝ 12,000円※税別）
            </span>
          </div>
          <div className="policy-calc-image-wrapper">
            <img
              src="/image/追加作業承認.png"
              alt="現場での提示イメージ"
              className="policy-calc-image"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 承認選択 */}
          <div className="form-group mb-4">
            <label>承認選択</label>
            <div className="policy-radio-group">
              <label className="policy-radio-label">
                <input
                  type="radio"
                  name="agreementChoice"
                  value="agree"
                  checked={agreementChoice === "agree"}
                  onChange={(e) => setAgreementChoice(e.target.value)}
                  className="policy-radio-input"
                />
                承認する
              </label>
              <label className="policy-radio-label">
                <input
                  type="radio"
                  name="agreementChoice"
                  value="disagree"
                  checked={agreementChoice === "disagree"}
                  onChange={(e) => setAgreementChoice(e.target.value)}
                  className="policy-radio-input"
                />
                承認しない
              </label>
            </div>
            <p>※保存後も承認設定より変更可能です。</p>
          </div>

          {/* 承認時のマージン入力 */}
          {agreementChoice === "agree" && (
            <div className="form-group policy-margin-box">
              <label htmlFor="markupRateInput">加算割合(%)</label>
              <input
                id="markupRateInput"
                type="number"
                value={markupRate}
                onChange={(e) => setMarkupRate(e.target.value)}
                placeholder="例: 20"
                min="10"
                max="30"
                className="policy-margin-input"
              />
            </div>
          )}

          {/* 変更時の旧割合適用チェック */}
          {isSet && currentPolicy?.isAgreed === 1 && (
            <div className="form-group policy-acknowledge-box">
              <label className="policy-acknowledge-label">
                <input
                  type="checkbox"
                  checked={acknowledge}
                  onChange={(e) => setAcknowledge(e.target.checked)}
                  className="policy-acknowledge-checkbox"
                />
                受注済みの作業については、変更前の旧割合が適用されることに同意します
              </label>
            </div>
          )}

          {/* ボタンエリア */}
          <div className="action-buttons-form">
            <button type="submit" className="btn btn-primary">
              設定を保存する
            </button>
            <button
              type="button"
              className="btn btn-cancel policy-cancel-btn"
              onClick={() => navigate("/")}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
