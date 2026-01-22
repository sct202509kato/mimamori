## 🛠 mimamori（Backend / Cloud Functions）

「今日も無事？」アプリの バックエンド API を提供するリポジトリです。

認証・日付判定・データ保存をサーバー側で安全に処理します。

## 📦 役割

フロントエンド（Vercel）からのリクエストを受信

Firebase Authentication の ID トークンを検証

Firestore に日次チェックイン情報を保存

今日の状態（確認済み / 未確認）を返却

🔗 関連リポジトリ

フロントエンド：mimamori-web
（React / Vite / Vercel）

## 🧱 技術構成

Firebase

Authentication（メール / パスワード）

Cloud Functions（HTTP）

Firestore

TypeScript

Node.js

## 🌐 公開 API
POST /checkin

当日のチェックインを登録します。

認証：Firebase Auth（Bearer トークン）

二重登録防止（当日分が存在する場合は再作成しない）

レスポンス例

{
  "ok": true,
  "already": false,
  "dateKey": "2026-01-22"
}

GET /status

当日のチェックイン状態を取得します。

レスポンス例（未確認）

{
  "ok": true,
  "dateKey": "2026-01-22",
  "checked": false
}


レスポンス例（確認済み）

{
  "ok": true,
  "dateKey": "2026-01-22",
  "checked": true,
  "checkedAt": "2026-01-22T02:07:47.000Z"
}

## 🗂 データ構造（Firestore）
users/{uid}/checkins/{YYYY-MM-DD}


uid：Firebase Authentication のユーザーID

日付キーは サーバー側で生成（JST）

checkedAt：serverTimestamp

## 🔐 セキュリティ / 工夫点

Firebase Auth の ID トークンを Cloud Functions 側で検証

クライアントから日付を受け取らず、サーバーで JST を基準に生成

二重押下防止（既存ドキュメントがある場合は上書きしない）

CORS を フロントエンドのドメインのみに限定

## 🚀 デプロイ方法
firebase deploy --only functions

## 🧪 ローカル開発（任意）
firebase emulators:start --only functions

## 📌 補足

このリポジトリは バックエンド専用です。
UI・画面表示に関する実装は mimamori-web を参照してください。