export const VALIDATION_MESSAGES = {
  required: (label) => `※${label}は必須項目です。`,
  postalCodeFormat: (label) => `※${label}はハイフンなし(例:1234567)の形式で入力してください。`,
  phoneFormat: (label) => `※${label}はハイフンなし(例:09012345678)の形式で入力してください。`,
  emailFormat: (label) => `※${label}を正しい形式で入力してください。(例: example@domain.com)`,
};