import { useEffect, useState } from 'react';
import { getUserPreference } from '@/db/repositories/userPreferenceRepo';
import { subscribePremium } from '@/services/purchases';

/**
 * プレミアム（買い切り）購入済みかどうか。判定前は null。
 *
 * タブ画面はペイウォール（モーダル）を閉じてもアンマウントされないため、
 * マウント時に1回読むだけでは購入直後の画面に反映されない。購読で追従する。
 *
 * 判定前と未購入を区別したい画面（プレミアム機能そのものの画面）はこちらを使う。
 * 区別しないと、購入済みの人にも一瞬「購入してください」が表示される。
 */
export function usePremiumStatus(): boolean | null {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // ストアからの通知が先に届いたら、それより古い端末DBのキャッシュで上書きしない
    let receivedFromStore = false;

    const unsubscribe = subscribePremium((premium) => {
      receivedFromStore = true;
      if (active) setIsPremium(premium);
    });

    getUserPreference().then((pref) => {
      if (active && !receivedFromStore) setIsPremium(pref.premiumStatus !== 'free');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return isPremium;
}

/** 判定前を「未購入」として扱ってよい箇所向け */
export function usePremium(): boolean {
  return usePremiumStatus() === true;
}
