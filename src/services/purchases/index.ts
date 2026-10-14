import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import { PREMIUM_UI_ENABLED } from '@/constants/releaseFlags';
import { updatePremiumStatus } from '@/db/repositories/userPreferenceRepo';

/**
 * ストア決済（RevenueCat）の窓口。画面からは react-native-purchases を直接呼ばず、ここを通す。
 *
 * ── 販売形態 ────────────────────────────────────────────
 * 画面上の名称は「プラス」（買い切りなので、サブスクを連想させる「プレミアム」は避けた）。
 * コード内の premium という識別子は画面に出ないため、そのまま使っている。
 * 買い切り（App Store の非消耗型 IAP）を1つだけ売る。RevenueCat ダッシュボード側で
 *   - Entitlement `premium` を作り、買い切り商品をひも付ける
 *   - Current Offering に Lifetime パッケージとして入れる
 * 価格はコードに持たない。ストアの表示価格（priceString）をそのまま出す。
 *
 * 【買い切りにAIを含めない ★変更前に読むこと】
 * 買い切りは一度きりの収入なので、利用のたびに費用が出るAI機能を `premium` に
 * 含めると、使われるほど赤字になる（PROJECT_STATE.md 2章のコスト試算参照）。
 * AIを課金対象にするときは、別の Entitlement（サブスク）を切ること。
 *
 * ── 課金状態の正 ────────────────────────────────────────
 * 正は RevenueCat の CustomerInfo。端末DBの premium_status はオフライン起動時に
 * 判定を待たせないためのキャッシュで、CustomerInfo を受け取るたびに上書きする
 * （返金されたら free に戻る）。
 */

/** RevenueCat ダッシュボードで作る Entitlement の識別子 */
export const PREMIUM_ENTITLEMENT_ID = 'premium';

// RevenueCat の公開SDKキー（appl_ で始まる）。アプリに同梱する前提の鍵なので
// EXPO_PUBLIC_ で問題ない（Anthropic のAPIキーとは性質が違う）。
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;

let configured = false;

type PremiumListener = (isPremium: boolean) => void;
const listeners = new Set<PremiumListener>();

/**
 * アプリ起動時に一度だけ呼ぶ。現状は iOS のみ販売するため、Android / Web と
 * キー未設定のビルドでは構成しない（＝購入手段がない扱い）。
 */
export function configurePurchases(): void {
  if (configured) return;
  if (Platform.OS !== 'ios' || !IOS_API_KEY) return;
  // configure はキーが不正なとき（Expo Go で本番キーを使った場合を含む）に同期で例外を投げる。
  // 起動時のモジュール評価中に呼ぶため、素通しするとアプリ全体が起動しなくなる。
  // 課金が使えなくても日記は使えるべきなので、失敗時は「購入手段なし」として続行する。
  try {
    Purchases.configure({ apiKey: IOS_API_KEY });
  } catch (e) {
    console.warn('[purchases] RevenueCat の初期化に失敗したため、課金導線を無効にします', e);
    return;
  }
  Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
  configured = true;
}

/**
 * 無料範囲の制限とペイウォール導線を出してよいか。
 *
 * 購入手段がない環境（キー未設定のビルド・Android・Web）で制限だけを掛けると、
 * 押しても買えないペイウォールに行き着く。Guideline 2.1 のリジェクト要因になるうえ、
 * ユーザーは自分の記録を見られなくなるだけなので、その場合は制限ごと外す。
 */
export function isPaywallEnabled(): boolean {
  return PREMIUM_UI_ENABLED && configured;
}

export function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
}

/** 課金状態の変化を購読する。戻り値で購読を解除する。 */
export function subscribePremium(listener: PremiumListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function applyCustomerInfo(info: CustomerInfo): Promise<void> {
  const premium = hasPremium(info);
  listeners.forEach((listener) => listener(premium));
  try {
    await updatePremiumStatus(premium ? 'premium_active' : 'free', null);
  } catch {
    // 起動直後はDB初期化前に呼ばれうる。syncPremiumStatus がDB準備後に書き直す。
  }
}

/** DB初期化後に呼び、最新の課金状態を端末DBへ反映する。オフライン時はキャッシュのまま。 */
export async function syncPremiumStatus(): Promise<void> {
  if (!configured) return;
  try {
    await applyCustomerInfo(await Purchases.getCustomerInfo());
  } catch {
    // 通信できない場合は前回のキャッシュで動かす
  }
}

/** 販売中の買い切りパッケージ。Offering 未設定などで取得できなければ null。 */
export async function getLifetimePackage(): Promise<PurchasesPackage | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  return current?.lifetime ?? current?.availablePackages[0] ?? null;
}

export type PurchaseOutcome = 'purchased' | 'cancelled';

/**
 * 購入する。ユーザーが購入シートを閉じた場合は例外ではなく 'cancelled' を返す。
 * それ以外の失敗（通信・ストア側のエラー）は例外として呼び出し元へ投げる。
 */
export async function purchasePremium(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    await applyCustomerInfo(customerInfo);
    if (!hasPremium(customerInfo)) {
      // 決済は通ったのに権利が付かない＝ダッシュボードで商品と Entitlement が未ひも付け
      throw new Error(`Entitlement "${PREMIUM_ENTITLEMENT_ID}" is not attached to the product`);
    }
    return 'purchased';
  } catch (e) {
    if ((e as PurchasesError).code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return 'cancelled';
    }
    throw e;
  }
}

/** 購入を復元する。復元後にプレミアムが有効なら true。 */
export async function restorePremium(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  await applyCustomerInfo(info);
  return hasPremium(info);
}
