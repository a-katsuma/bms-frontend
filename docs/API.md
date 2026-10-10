@@ -1,169 +0,0 @@
# API 一覧

- ベース URL：`/api`（公開環境は `https://bms-system.net/api`）
- 認証：セッション（ログイン後の Cookie）。パスワードは BCrypt で変換して保存
- ログインと立場の確認は、API の入口（`AuthInterceptor`）で共通に行い、下の表の「対象」以外からの呼び出しは 401／403 を返す
- 管理者用は `/api/...`、発注元用は `/api/contractee/...`
- 作成は POST、更新は PUT、削除は DELETE、確定・受注などの操作は POST
- 成功は `{ message }`、エラーは `{ errorMessage }`

**対象**：不要＝ログインなし／ログイン＝全員／管理者／発注元＝発注元（代表・一般）／代表＝発注元（代表）のみ

## 1. ログイン・ユーザー

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| POST | /api/users/login | ログイン | 不要 |
| POST | /api/users/logout | ログアウト | ログイン |
| GET | /api/users/current | ログイン中のユーザー情報 | ログイン |
| POST | /api/users/forgot-password | パスワード再設定メールの送信（ログイン画面から） | 不要 |
| POST | /api/users/reset-password/confirm | メールのリンクからパスワードを再設定 | 不要 |
| PUT | /api/users/me/password | 自分のパスワード変更 | ログイン |
| PUT | /api/users/me/email | 自分のメールアドレス変更 | ログイン |
| PUT | /api/users/me/name | 自分の名前の変更 | ログイン |
| GET | /api/users/me/company/business-policy | 自社の事前承認の設定を取得 | 発注元 |
| POST | /api/users/me/company/business-policy | 事前承認の設定（設定のたびに履歴を残す） | 代表 |
| GET | /api/users/me/company/users | 自社のユーザー一覧 | 代表 |
| POST | /api/users/me/company/users | 自社の一般ユーザーを追加（招待メール） | 代表 |
| PUT | /api/users/me/company/users/{userId}/email | 自社の一般ユーザーのメールアドレス変更 | 代表 |
| POST | /api/users/me/company/users/{userId}/reset-password | 自社の一般ユーザーのパスワード再発行 | 代表 |
| PUT | /api/users/{userId}/status | ユーザーの有効・無効の切り替え | 管理者・代表 |
| PUT | /api/users/{userId}/email | ユーザーのメールアドレス変更 | 管理者 |
| POST | /api/users/{userId}/reset-password | ユーザーのパスワード再発行 | 管理者 |
| PUT | /api/users/companys/{companyId}/master/transfer | 発注元の代表ユーザーの交代 | 管理者 |
| GET | /api/demo | デモモードかどうか | 不要 |
| POST | /api/demo/login | デモ用ログイン（デモモードのときだけ） | 不要 |

## 2. ダッシュボード

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/home | 見積待ち・判定待ちの案件 | 管理者 |
| GET | /api/home/base-alerts | 現況確認表とベース明細に差がある案件 | 管理者 |

## 3. 顧客・顧客資料

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/clients | 顧客一覧（カナの行で絞り込み・ページ分け） | 管理者 |
| POST | /api/clients | 顧客の登録 | 管理者 |
| GET | /api/clients/{id} | 顧客の詳細と関連する案件 | 管理者 |
| GET | /api/clients/edit/{id} | 編集用の顧客データ | 管理者 |
| PUT | /api/clients/{id} | 顧客の更新 | 管理者 |
| DELETE | /api/clients/{id} | 顧客の削除 | 管理者 |
| GET | /api/clients/{id}/documents | 顧客の資料一覧 | 管理者 |
| POST | /api/clients/{id}/documents | 資料のアップロード | 管理者 |
| DELETE | /api/clients/{id}/documents/{docId} | 資料の削除 | 管理者 |

## 4. 発注元

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/companys | 発注元一覧 | 管理者 |
| GET | /api/companys/add | 登録画面用のデータ | 管理者 |
| POST | /api/companys | 発注元と代表ユーザーの登録 | 管理者 |
| GET | /api/companys/{id} | 発注元の詳細（ユーザー・案件） | 管理者 |
| GET | /api/companys/edit/{id} | 編集用の発注元データ | 管理者 |
| PUT | /api/companys/{id} | 発注元の更新 | 管理者 |
| DELETE | /api/companys/{id} | 発注元の削除 | 管理者 |

## 5. 案件

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/projects | 案件一覧 | 管理者 |
| GET | /api/projects/form-data | 登録画面用の顧客・発注元の選択肢 | 管理者 |
| POST | /api/projects/add | 案件の登録 | 管理者 |
| GET | /api/projects/{id} | 案件の詳細（見積り・履歴・請求状況） | 管理者 |
| GET | /api/projects/edit/{id} | 編集用の案件データ | 管理者 |
| PUT | /api/projects/{id} | 案件の更新 | 管理者 |
| DELETE | /api/projects/{id} | 案件の削除（論理削除） | 管理者 |
| GET | /api/projects/deleted | 削除済みの案件一覧 | 管理者 |
| POST | /api/projects/{id}/restore | 案件の復元 | 管理者 |

## 6. 見積り

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/projects/{projectId}/quotes | 見積り一覧（判定履歴付き） | 管理者 |
| GET | /api/projects/{projectId}/quotes/{id} | 見積り1件（判定期限の変更用） | 管理者 |
| POST | /api/projects/{projectId}/quotes/add | 見積りの登録・再見積り（PDF） | 管理者 |
| PUT | /api/projects/{projectId}/quotes/{id} | 判定期限の変更 | 管理者 |
| DELETE | /api/projects/{projectId}/quotes/{id} | 見積りの削除（論理削除。判定履歴は残る） | 管理者 |
| POST | /api/projects/{projectId}/quotes/{id}/restore | 見積りの復元 | 管理者 |
| DELETE | /api/projects/{projectId}/quotes/{id}/permanent | 見積りの完全な削除（判定履歴・PDF も削除） | 管理者 |

## 7. 現況確認表

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/projects/{projectId}/survey | 現況確認表の取得 | 管理者 |
| PUT | /api/projects/{projectId}/survey | 現況確認表の保存（作成・更新） | 管理者 |

## 8. ベース明細

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/projects/{projectId}/base | ベース明細の取得（baseId 省略時は使用中の先頭） | 管理者 |
| POST | /api/projects/{projectId}/base | 新しいベースの作成（第1版） | 管理者 |
| PUT | /api/projects/{projectId}/base/{baseId} | 訂正（今の版を上書き） | 管理者 |
| POST | /api/projects/{projectId}/base/{baseId}/versions | 改版（新しい版を作る） | 管理者 |
| PUT | /api/projects/{projectId}/base/{baseId}/name | ベース名の変更 | 管理者 |
| POST | /api/projects/{projectId}/base/{baseId}/stop | 使用停止 | 管理者 |
| POST | /api/projects/{projectId}/base/{baseId}/resume | 使用再開 | 管理者 |
| DELETE | /api/projects/{projectId}/base/{baseId} | 削除（使用停止中で、毎次明細がないベースのみ） | 管理者 |

## 9. 毎次明細

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/projects/{projectId}/statements | 毎次明細の一覧と、作成に使えるベース | 管理者 |
| GET | /api/projects/{projectId}/statements/{statementId} | 毎次明細1件 | 管理者 |
| POST | /api/projects/{projectId}/statements/add | 作成（ベース明細をコピー） | 管理者 |
| PUT | /api/projects/{projectId}/statements/{statementId} | 下書き保存 | 管理者 |
| POST | /api/projects/{projectId}/statements/{statementId}/confirm | 確定 | 管理者 |
| POST | /api/projects/{projectId}/statements/{statementId}/unconfirm | 確定の解除 | 管理者 |
| DELETE | /api/projects/{projectId}/statements/{statementId} | 削除（下書きのみ） | 管理者 |

## 10. 緊急・追加作業

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/extra-works | 一覧（未請求・未取り込みのみ、顧客・発注元で絞り込み） | 管理者 |
| GET | /api/extra-works/new | 新規受注の選択肢（顧客・発注元・事前承認の履歴・税率） | 管理者 |
| POST | /api/extra-works/add | 新規受注（例外の案件と作業を一緒に作成） | 管理者 |
| GET | /api/extra-works/import-candidates | 毎次明細に取り込める作業 | 管理者 |
| GET | /api/projects/{projectId}/extra-works | 案件の作業 | 管理者 |
| GET | /api/projects/{projectId}/extra-works/{extraWorkId} | 作業1件（編集・プレビュー） | 管理者 |
| PUT | /api/projects/{projectId}/extra-works/{extraWorkId} | 作業の保存 | 管理者 |
| POST | /api/projects/{projectId}/extra-works/{extraWorkId}/order | 受注 | 管理者 |
| POST | /api/projects/{projectId}/extra-works/{extraWorkId}/hold | 保留 | 管理者 |
| POST | /api/projects/{projectId}/extra-works/{extraWorkId}/revert | 下書きに戻す | 管理者 |
| POST | /api/projects/{projectId}/extra-works/{extraWorkId}/billed | 請求済みにする | 管理者 |
| POST | /api/projects/{projectId}/extra-works/{extraWorkId}/unbilled | 請求済みの取り消し | 管理者 |
| DELETE | /api/projects/{projectId}/extra-works/{extraWorkId} | 作業の削除（例外の案件なら案件も削除） | 管理者 |

## 11. 常用項目（入力候補）

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/masters | 一覧（設備名・単位・その他項目） | 管理者 |
| POST | /api/masters/add | 登録 | 管理者 |
| PUT | /api/masters/{id} | 更新 | 管理者 |
| DELETE | /api/masters/{id} | 削除 | 管理者 |
| POST | /api/masters/move/{id} | 並び替え（上へ・下へ） | 管理者 |

## 12. 発注元向け（/api/contractee）

| メソッド | URL | 内容 | 対象 |
|---|---|---|---|
| GET | /api/contractee/home | 判定待ち・見積待ちの案件 | 発注元 |
| GET | /api/contractee/clients | 顧客一覧（自社の案件の顧客） | 発注元 |
| GET | /api/contractee/clients/{id} | 顧客の詳細 | 発注元 |
| GET | /api/contractee/clients/{id}/documents | 顧客の資料一覧 | 発注元 |
| GET | /api/contractee/projects | 案件一覧（自社の案件） | 発注元 |
| GET | /api/contractee/projects/{id} | 案件の詳細 | 発注元 |
| POST | /api/contractee/projects/{projectId}/quotes/judge/{id} | 見積りの判定（発注・失注・差戻し） | 発注元 |
| GET | /api/contractee/projects/{projectId}/survey | 現況確認表の閲覧 | 発注元 |
| GET | /api/contractee/projects/{projectId}/base | ベース明細の閲覧（使用中のみ） | 発注元 |
| GET | /api/contractee/projects/{projectId}/statements | 毎次明細の一覧（確定のみ） | 発注元 |
| GET | /api/contractee/projects/{projectId}/statements/{statementId} | 毎次明細1件（確定のみ） | 発注元 |
