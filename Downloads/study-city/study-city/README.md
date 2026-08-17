# 勉強記録×街づくりアプリ（MVP）

企画書 7章「MVPスコープ（確定版）」に基づく実装です。
Next.js（App Router）+ Supabase（PostgreSQL / Auth）構成の Web アプリです。

## 含まれる機能（MVP範囲）

- メール／パスワードでのユーザー登録・ログイン
- 科目スロット登録（A〜F、ラベル自由入力、位置ごとに建材テーマ固定）
- 時間記録（ワンタップ：+5 / +15 / +30 / +60分、または任意分数）
- 資材の自動計算（共通資材＋専用資材の二層構造、1日の記録上限による資材効率の逓減）
- 建物の段階表現（土台→骨組み→外装→完成、棟数に応じた必要時間の変化）
- 街の俯瞰図表示（アイソメトリック / SVG）

フォロー機能・エリア解放・季節イベント・ランドマーク3D演出・ネイティブアプリ化は
企画書7.3の通り、今回のMVPには含めていません（`follows`テーブルのみ将来用に用意）。

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com でプロジェクトを新規作成
2. ダッシュボードの **SQL Editor** を開き、`supabase/schema.sql` の中身を貼り付けて実行
   - テーブル（profiles, slots, study_records, material_common, material_dedicated,
     buildings, building_decorations, follows）と RLS ポリシー、
     新規ユーザー作成時のトリガーが一括で作成されます
3. **Project Settings → API** から `Project URL` と `anon public key` を確認

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、Supabaseの値を入力してください。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 依存関係のインストールと起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開き、新規登録 → 記録ページでスロットを追加 → 記録、
の順で動作を確認できます。

### 4. デプロイ（Vercel）

- Vercelにリポジトリを接続し、上記の環境変数（`NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を Project Settings → Environment Variables に設定
- Supabase側の **Authentication → URL Configuration** に、デプロイ後のURLを
  Redirect URLとして追加

## ディレクトリ構成（要点）

```
app/
  page.tsx              トップ（未ログイン向けランディング）
  login/page.tsx         ログイン・新規登録
  record/page.tsx        記録ページ（サーバーコンポーネント）
  city/page.tsx           街の俯瞰図ページ
  actions/
    record.ts            記録〜資材計算〜建物進捗更新（中核ロジック / Server Action）
    slots.ts              スロット作成・削除

components/
  SlotRecordCard.tsx      スロットごとのワンタップ記録UI
  AddSlotForm.tsx          スロット追加フォーム
  IsometricCity.tsx         アイソメトリックな街のSVG描画
  MaterialsPanel.tsx        資材の内訳パネル
  TodayProgress.tsx          本日の記録量と逓減ラインの表示

lib/
  recipes.ts               建材テーマ・建設に必要な資材量・逓減ルールなどの設定データ
                            （企画書5.3の方針通り、ロジックから分離した「設定」として管理）
  color.ts                  装飾内訳の色ブレンド処理
  supabase/                 Supabaseクライアント（ブラウザ／サーバー／ミドルウェア）

supabase/schema.sql        DBスキーマ・RLSポリシー・トリガー一式
```

## 資材計算ロジックの要点（`lib/recipes.ts`）

- 記録した分数がそのまま資材量になる（1分＝1資材、共通資材と専用資材の両方に加算）
- 1日の合計記録が `DAILY_FULL_RATE_MINUTES`（初期値240分＝4時間）を超えた分は、
  `OVER_LIMIT_EFFICIENCY`（初期値40%）の効率に逓減し、タイマー放置などの不正な自己申告を抑止
- 建物は「棟数」に応じて必要な共通資材量が変わり（序盤/中盤/終盤で `BUILDING_TIERS` を切り替え）、
  投入済み共通資材の割合で `土台(0)→骨組み(1)→外装(2)→完成(3)` の4段階に自動遷移
- 建物ごとの装飾内訳（`building_decorations`）は、その建物の建設期間中にどのスロットの
  専用資材がどれだけ使われたかを記録し、俯瞰図での色ブレンド表示に使用

これらの数値は `lib/recipes.ts` にすべて集約しているため、コードの他の部分を
触らずにバランス調整ができます（α版での調整を想定した企画書6章の方針に対応）。

## 既知の制約・次のステップ

- タイマー機能（開始/終了で自動計測）は未実装。現状は手動での分数記録のみ
- 建物の完成通知・段階遷移の演出（エフェクト等）はUI上のフィードバックテキストのみで、
  企画書3.4にあるような専用のアニメーション演出は未実装
- フォロー機能・エリア解放・季節イベント・リビルド／増築・ランドマーク3D演出は
  MVP後のフェーズとして未着手（`follows`テーブルのみ先行して用意）
