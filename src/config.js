// 環境ごとに変わる値（Vite の環境変数。指定がなければ開発環境の値を使う）
//   開発（npm run dev）  ：http://localhost:8080 の Spring Boot に直接つなぐ
//   本番（npm run build）：.env.production の値。nginx が同じドメインで /api と /uploads を Spring Boot に転送する
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

export const FILE_BASE_URL =
  import.meta.env.VITE_FILE_BASE_URL ?? "http://localhost:8080";

// アップロードしたファイル（見積り・顧客資料の PDF など）の URL。filepath は "uploads/xxx.pdf" の形
export const fileUrl = (filepath) => `${FILE_BASE_URL}/${filepath}`;
