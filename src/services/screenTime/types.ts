/**
 * 10.6: スクリーンタイムの活用における取得手段を抽象化するインターフェース。
 *
 * 【重要な設計判断・既知の制約】
 * 要件定義書10.6・付録Bは、OSのネイティブAPI（Android: UsageStatsManager /
 * iOS: DeviceActivity+Family Controls）からの自動取得を本来想定しているが、
 * 以下の理由でMVPでは両OSとも「自己申告入力」で統一する:
 *   - iOS: 第三者アプリが合計スクリーンタイムを直接数値として取得することは
 *     Family Controls entitlement（Apple審査が必要）とDeviceActivityReport
 *     Extensionの実装が前提になり、本セッションの環境・時間では実装/検証できない
 *   - Android: UsageStatsManagerは技術的に可能だが、ネイティブモジュール実装が
 *     必要であり、かつこの開発環境にはAndroid SDK/JDKが無くビルド検証ができない
 *   - 付録Bで「代替手段（自己申告版から始める）も選択肢として残す」と
 *     明記されており、要件書が認めるフォールバックの範囲内
 *
 * 将来ネイティブ実装に差し替える際は、この ScreenTimeProvider を実装する
 * 別クラス（例: AndroidUsageStatsProvider, IosDeviceActivityProvider）を
 * 用意し、src/services/screenTime/index.ts の生成箇所を差し替えるだけで済む
 * ように設計している。
 */
export interface ScreenTimeProvider {
  /** この実装が実際のOS計測値を返せるか（自己申告実装は常にfalse） */
  readonly isNativeMeasurement: boolean;

  /** ユーザーが当日のスクリーンタイムを分単位で入力/取得する */
  getTodayMinutes(): Promise<number | null>;
}
