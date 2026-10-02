// 半角の印字可能文字のみ許可（スペース・全角文字は除外）
const HALF_WIDTH_REGEX = /^[\x21-\x7E]+$/;

export function validatePassword(password) {
  if (!password) {
    return "パスワードを入力してください。";
  }
  if (password.length < 8) {
    return "8文字以上で入力してください。";
  }
  if (!HALF_WIDTH_REGEX.test(password)) {
    return "半角の英数字・記号のみ使用できます（スペース・全角文字は使用できません）。";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "英字と数字を両方含めてください。";
  }
  return null; // 問題なし
}