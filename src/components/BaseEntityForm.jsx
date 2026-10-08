import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { normalize } from "../utils/formatUtils";
import { usePostalCode } from "../hooks/usePostalCode";
import { usePhone } from "../hooks/usePhone";
import { useKanaNormalization } from "../hooks/useKanaNormalization";
import FieldError from "./FieldError";
import FormAlert from "./FormAlert";
import FormInput from "./FormInput";
import { VALIDATION_MESSAGES } from "../utils/validationMessages";
import Button from "../atoms/Button";
import PageHeader from "./PageHeader";
import { axiosInstance } from "../api/axiosInstance";
import { useMessage } from "./../hooks/useMessage";

export default function BaseEntityForm({
  title,
  apiEndpoint,
  idKey,
  labels,
  isEdit = false,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useMessage();
  BaseEntityForm;

  // 基本5項目のフィールド名取得
  const nameField = Object.keys(labels)[0];
  const kanaField = Object.keys(labels)[1];
  const postalField = Object.keys(labels)[2];
  const addressField = Object.keys(labels)[3];
  const phoneField = Object.keys(labels)[4];

  // マスターユーザー項目の判定（labelsにマスター項目が存在するか）
  const hasMasterFields = "masterName" in labels;

  const entityName = title
    .replace(/情報?編集$/, "")
    .replace(/登録$/, "")
    .trim();

  const [inputValues, setInputValues] = useState({
    [nameField]: "",
    [kanaField]: "",
    [addressField]: "",
    ...(hasMasterFields && {
      masterName: "",
      masterEmail: "",
    }),
  });

  const { handleKanaBlurOrComposition } = useKanaNormalization(
    setInputValues,
    kanaField,
  );

  const {
    postalCode,
    setPostalCode,
    handlePostalChange,
    formatAndFetchPostalCode,
  } = usePostalCode("", (fetchedAddress) => {
    setInputValues((prev) => ({
      ...prev,
      [addressField]: fetchedAddress,
    }));
  });

  const { phone, setPhone, handlePhoneChange, formatPhoneOnBlur } =
    usePhone("");
  const [errors, setErrors] = useState({});
  const [hasError, setHasError] = useState(false);

  // 編集時の既存データ取得
  useEffect(() => {
    if (isEdit && id) {
      const fetchUrl = apiEndpoint.replace(/\/?$/, `/edit/${id}`);
      axiosInstance
        .get(fetchUrl)
        .then((res) => {
          const fetchedData = res.data;
          setInputValues({
            [nameField]: fetchedData[nameField] || "",
            [kanaField]: fetchedData[kanaField] || "",
            [addressField]: fetchedData[addressField] || "",
          });

          if (fetchedData[postalField]) {
            setPostalCode(normalize(fetchedData[postalField]));
          }
          if (fetchedData[phoneField]) {
            setPhone(normalize(fetchedData[phoneField]));
          }
        })
        .catch((error) => {
          console.error("データ取得エラー:", error);
          showError("情報の取得に失敗しました。");
        });
    }
  }, [
    isEdit,
    id,
    apiEndpoint,
    nameField,
    kanaField,
    addressField,
    postalField,
    phoneField,
    setPostalCode,
    setPhone,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // 基本バリデーション
    if (!inputValues[nameField]?.trim()) {
      newErrors[nameField] = VALIDATION_MESSAGES.required(labels[nameField]);
    }
    if (!inputValues[kanaField]?.trim()) {
      newErrors[kanaField] = VALIDATION_MESSAGES.required(labels[kanaField]);
    }
    if (!postalCode.trim()) {
      newErrors[postalField] = VALIDATION_MESSAGES.required(
        labels[postalField],
      );
    } else if (postalCode.length !== 7) {
      newErrors[postalField] = VALIDATION_MESSAGES.postalCodeFormat(
        labels[postalField],
      );
    }
    if (!inputValues[addressField]?.trim()) {
      newErrors[addressField] = VALIDATION_MESSAGES.required(
        labels[addressField],
      );
    }
    if (!phone.trim()) {
      newErrors[phoneField] = VALIDATION_MESSAGES.required(labels[phoneField]);
    } else if (phone.length < 10 || phone.length > 11) {
      newErrors[phoneField] = VALIDATION_MESSAGES.phoneFormat(
        labels[phoneField],
      );
    }

    // 新規登録時のマスターユーザー項目のバリデーション
    if (!isEdit && hasMasterFields) {
      if (!inputValues.masterName?.trim()) {
        newErrors.masterName = VALIDATION_MESSAGES.required(labels.masterName);
      }

      // メールアドレスのチェック
      const emailValue = inputValues.masterEmail?.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 簡易メール形式チェック正規表現

      if (!emailValue) {
        newErrors.masterEmail = VALIDATION_MESSAGES.required(
          labels.masterEmail,
        );
      } else if (!emailRegex.test(emailValue)) {
        // ★メールアドレス形式エラーメッセージを設定
        newErrors.masterEmail = VALIDATION_MESSAGES.emailFormat(
          labels.masterEmail,
        );
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setHasError(true);
      return;
    }

    setHasError(false);
    setErrors({});

    const submitData = {
      ...(isEdit ? { [idKey]: id } : {}),
      ...inputValues,
      [postalField]: postalCode,
      [phoneField]: phone,
    };

    // 新規登録は POST /clients、編集は PUT /clients/{id}（業者も同じ）
    const request = isEdit
      ? axiosInstance.put(apiEndpoint.replace(/\/?$/, `/${id}`), submitData)
      : axiosInstance.post(apiEndpoint, submitData);

    request
      .then((res) => {
        const targetId = isEdit ? id : res.data?.[idKey];
        const basePath = apiEndpoint.includes("clients")
          ? "/clients"
          : "/companys";

        const successMessage = isEdit
          ? `${entityName}情報を更新しました。`
          : hasMasterFields
            ? `${entityName}情報および代表ユーザーアカウントを登録しました。`
            : `${entityName}情報を登録しました。`;

        if (targetId) {
          navigate(`${basePath}/${targetId}`, {
            state: { message: successMessage },
          });
        } else {
          console.error(
            "登録レスポンスからIDを取得できませんでした:",
            res.data,
          );
          navigate(basePath, {
            state: { message: successMessage },
          });
        }
      })
      .catch((error) => {
        console.error("送信エラー:", error);
        showError("処理に失敗しました。入力内容を確認してください。");
      });
  }; // ★ここで handleSubmit を正しく閉じる

  const cancelBasePath = apiEndpoint.includes("clients")
    ? "/clients"
    : "/companys";
  const cancelPath = isEdit ? `${cancelBasePath}/${id}` : cancelBasePath;

  // ★コンポーネントとしての描画処理をここで行う
  return (
    <div className="content-wrapper">
      <PageHeader title={title} />
      <div className="card">
        <form onSubmit={handleSubmit} className={isEdit ? "edit-form" : ""}>
          <FormAlert hasError={hasError} />
          <div className="form-vertical-layout">
            <FormInput
              label={labels[nameField]}
              name={nameField}
              value={inputValues[nameField]}
              onChange={handleChange}
              error={errors[nameField]}
              required
              placeholder={`${labels[nameField]}を入力`}
            />

            <div className="form-group-block">
              <label>
                {labels[kanaField]} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name={kanaField}
                value={inputValues[kanaField]}
                onChange={handleChange}
                onCompositionEnd={handleKanaBlurOrComposition}
                onBlur={handleKanaBlurOrComposition}
                placeholder="フリガナを入力"
                className={errors[kanaField] ? "field-error" : ""}
              />
              <FieldError message={errors[kanaField]} />
            </div>

            <div className="form-group-block">
              <label>
                {labels[postalField]} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name={postalField}
                value={postalCode}
                onChange={handlePostalChange}
                onCompositionEnd={formatAndFetchPostalCode}
                onBlur={formatAndFetchPostalCode}
                className={errors[postalField] ? "field-error" : ""}
                placeholder="郵便番号を入力(ハイフンなし)"
                autoComplete="off"
              />
              <FieldError message={errors[postalField]} />
            </div>

            <FormInput
              label={labels[addressField]}
              name={addressField}
              value={inputValues[addressField]}
              onChange={handleChange}
              error={errors[addressField]}
              required
              placeholder="住所を入力"
            />

            <div className="form-group-block">
              <label>
                {labels[phoneField]} <span className="required">(必須)</span>
              </label>
              <input
                type="text"
                name={phoneField}
                value={phone}
                onChange={handlePhoneChange}
                onCompositionEnd={formatPhoneOnBlur}
                onBlur={formatPhoneOnBlur}
                placeholder="電話番号を入力(ハイフンなし)"
                className={errors[phoneField] ? "field-error" : ""}
              />
              <FieldError message={errors[phoneField]} />
            </div>

            {!isEdit && hasMasterFields && (
              <>
                <hr className="form-divider" />
                <h3 className="form-subtitle">代表ユーザー登録</h3>

                <FormInput
                  label={labels.masterName}
                  name="masterName"
                  value={inputValues.masterName}
                  onChange={handleChange}
                  error={errors.masterName}
                  required
                  placeholder="例: 山田太郎"
                />

                <FormInput
                  label={labels.masterEmail}
                  name="masterEmail"
                  value={inputValues.masterEmail}
                  onChange={handleChange}
                  error={errors.masterEmail}
                  required
                  placeholder="例: master@example.com"
                />
              </>
            )}

            <div className={isEdit ? "action-buttons-form" : "action-buttons"}>
              <Button type="submit" variant="primary">
                {isEdit ? "更新する" : "登録する"}
              </Button>
              <Button to={cancelPath} variant="cancel">
                戻る
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
