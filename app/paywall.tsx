import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PurchasesPackage } from 'react-native-purchases';
import { GradientScoreBar } from '@/components/GradientScoreBar';
import { PaywallCompareTable } from '@/components/PaywallCompareTable';
import { Button, TextButton } from '@/components/ui/Button';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { usePremium } from '@/hooks/usePremium';
import { getLifetimePackage, purchasePremium, restorePremium } from '@/services/purchases';

type LoadState = 'loading' | 'ready' | 'unavailable';

/** RevenueCat 以外の理由で読み込めなかったときのコード */
const UNAVAILABLE_CODE = {
  /** 購入手段なし、または Current Offering に販売中のパッケージが無い */
  noPackage: 'NO-PACKAGE',
  unknown: 'UNKNOWN',
} as const;

/**
 * 8.6 アップグレード（ペイウォール）画面。買い切り（非消耗型IAP）を1つ売る。
 *
 * 価格は文言に書かず、ストアから取得した priceString を表示する。
 * App Store Connect で価格を変えてもアプリの更新が要らず、国ごとの価格にも追従する。
 * 「購入を復元」は Guideline 3.1.1 で非消耗型に必須。
 */
export default function PaywallScreen() {
  const isPremium = usePremium();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [busy, setBusy] = useState(false);
  // 読み込めなかった理由。問い合わせやストア設定の不備を切り分けるために画面にも小さく出す
  const [loadErrorCode, setLoadErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLifetimePackage()
      .then((found) => {
        if (!active) return;
        setPkg(found);
        setLoadState(found ? 'ready' : 'unavailable');
        // Offering は取れたが販売中のパッケージが無い＝RevenueCat側の設定漏れ
        if (!found) setLoadErrorCode(UNAVAILABLE_CODE.noPackage);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setLoadState('unavailable');
        // RevenueCat のエラーは code を持つ（例: "23" はストアから商品を取得できない設定エラー）
        const code = (e as { code?: unknown } | null)?.code;
        setLoadErrorCode(typeof code === 'string' ? `RC-${code}` : UNAVAILABLE_CODE.unknown);
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setBusy(true);
    try {
      if ((await purchasePremium(pkg)) === 'purchased') {
        Alert.alert('ありがとうございます', 'すべての期間の記録と、月次レポートを使えるようになりました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert(
        '購入を完了できませんでした',
        '通信状況を確認して、もう一度お試しください。料金が請求された場合は「購入を復元」で反映できます。'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return; // TextButton には disabled が無いため、購入処理中の二重実行をここで防ぐ
    setBusy(true);
    try {
      if (await restorePremium()) {
        Alert.alert('購入を復元しました', 'すべての期間の記録と、月次レポートを使えるようになりました。', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          '復元できる購入が見つかりませんでした',
          '購入時と同じ Apple アカウントでサインインしているか確認してください。'
        );
      }
    } catch {
      Alert.alert('復元できませんでした', '通信状況を確認して、もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>購入済みです</Text>
          <Text style={styles.body}>
            ご購入ありがとうございます。これまでの記録を期間の制限なくすべて見返せるほか、カレンダーから月次レポートを開けます。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.title}>もっと深く、自分と向き合う</Text>
        <Text style={styles.body}>
          無料プランだと、積み重ねの記録はここで途切れてしまいます。
        </Text>

        <View>
          <GradientScoreBar score={null} truncateAtPercent={55} showLabel={false} />
          <Text style={styles.truncatedCaption}>無料だとここまでしか見えません</Text>
        </View>

        <PaywallCompareTable />

        {loadState === 'loading' && (
          <ActivityIndicator color={NEUTRAL_COLORS.accent} style={{ marginVertical: 16 }} />
        )}

        {loadState === 'ready' && pkg && (
          <>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{pkg.product.priceString}</Text>
              <Text style={styles.priceNote}>買い切り・一度のお支払いで、ずっと使えます</Text>
            </View>
            <Button
              label={busy ? '処理中…' : '購入する'}
              onPress={handlePurchase}
              disabled={busy}
            />
          </>
        )}

        {loadState === 'unavailable' && (
          <Text style={styles.unavailableText}>
            購入情報を読み込めませんでした。通信状況を確認して、時間をおいて開き直してください。
            {loadErrorCode && `\n（エラーコード: ${loadErrorCode}）`}
          </Text>
        )}

        <View style={styles.restoreRow}>
          <TextButton label="購入を復元" onPress={handleRestore} />
        </View>

        <Text style={styles.footnote}>
          「毎日の質問 → 回答 → カレンダーで振り返る」というコア機能は、これからもずっと無料です。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  content: { padding: 24, gap: 18 },
  title: { fontSize: 22, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  body: { fontSize: 14, color: NEUTRAL_COLORS.textSecondary, lineHeight: 22 },
  truncatedCaption: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, marginTop: 6 },
  priceBlock: { alignItems: 'center', gap: 4, marginTop: 4 },
  price: { fontSize: 20, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  priceNote: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  unavailableText: {
    fontSize: 13,
    color: NEUTRAL_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  restoreRow: { alignItems: 'center' },
  footnote: { fontSize: 11, color: NEUTRAL_COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
});
