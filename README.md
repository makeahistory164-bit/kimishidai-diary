# キミシダイ日記

「今日一日を自分軸で生きられたか」を、AIが投げかける質問に答える形で毎日振り返るカレンダー型日記アプリ。

要件定義書: `キミシダイ日記_要件定義書.md`（v0.1）に基づくMVP実装。

## セットアップ

```bash
npm install
cp .env.example .env
# .env の EXPO_PUBLIC_ANTHROPIC_API_KEY に Claude API キーを設定
npx expo start
```

- `w` キーでWeb版、`i` キーでiOS Simulator（要Xcode）を起動できます。
- Androidはこの開発環境にAndroid SDK/JDKが無いため未検証です（後述）。

## 実装範囲（MVP）

- AIによる日替わり質問生成（Claude API、失敗時は固定質問セットへ自動フォールバック）
- 回答（4段階評価＋一言メモ）・軸スコア算出（0〜100、polarity反転込みの単純平均）
- カレンダー表示（月間ビュー、5段階の暖色→緑グラデーション配色）
- 端末内ローカル保存（expo-sqlite、アカウント登録なし）
- オンボーディング（4ステップ）、設定画面、ペイウォールUI

## 既知の制約・要件書からの意図的な差分

1. **スクリーンタイムは自己申告入力**
   要件書10.6・付録BはOS APIからの自動取得（Android: UsageStatsManager / iOS:
   DeviceActivity + Family Controls entitlement）を想定していますが、
   - iOSは第三者アプリがスクリーンタイムを直接取得できず、Family Controls entitlement
     （Apple審査）とDeviceActivityReport Extensionの実装が前提になる
   - Androidはネイティブモジュール実装が必要だが、本開発環境にAndroid SDK/JDKが
     インストールされておらずビルド検証ができない

   という制約から、**iOS/Androidとも自己申告入力（設定画面・オンボーディングで分単位を入力）**
   に統一しています。付録Bが認めているフォールバック方針の範囲内の判断です。
   将来ネイティブ計測に差し替える際は `src/services/screenTime/types.ts` の
   `ScreenTimeProvider` インターフェースを実装するプロバイダを追加し、
   `src/services/screenTime/index.ts` の生成箇所を差し替えるだけで済むよう設計しています。

2. **ストア決済は未実装**
   要件書12.6でストア決済基盤の選定自体が未確定のオープンクエスチョンのため、
   ペイウォール画面（比較表・価格表示）までを実装し、加入ボタンは「準備中」スタブです。

3. **Androidは未検証**
   本開発環境にAndroid SDK/JDK/エミュレータが無いため、コードは書いていますが
   実機・エミュレータでの動作確認ができていません。Android Studioセットアップ後、
   `npx expo run:android` 等での検証をお願いします。

4. **APIキーの直接同梱**
   `EXPO_PUBLIC_ANTHROPIC_API_KEY` はアプリバンドルに同梱されるため、端末側から
   抽出可能です。個人利用・小規模検証のMVPとして許容していますが、一般公開時は
   サーバープロキシ経由の呼び出しに置き換えてください。

## ディレクトリ構成

```
app/                 Expo Router（画面）
src/
  db/                expo-sqlite スキーマ・リポジトリ
  services/
    ai/              Claude API呼び出し・質問生成オーケストレーション
    localAnalysis/    ローカル集計・キーワード抽出・フィードバック集計
    screenTime/       スクリーンタイム取得の抽象化（自己申告実装）
    axisScore.ts      軸スコア算出ロジック（11章）
    dailyEntryService.ts  画面から呼ぶ統合サービス層
  components/        UIコンポーネント
  hooks/             画面ロジックを束ねるフック
  constants/         配色・固定質問セット・ストップワード
  types/             9.2 テーブル定義に対応するTS型
```
