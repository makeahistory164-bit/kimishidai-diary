import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { TYPE, SPACING, MIN_TAP } from '@/constants/theme';
import { usePremiumStatus } from '@/hooks/usePremium';
import { isPaywallEnabled } from '@/services/purchases';
import {
  dismissReportBanner,
  getReportBannerTarget,
  toMonthKey,
  type ReportBannerTarget,
} from '@/services/report/reportBanner';

/**
 * 月初に1回だけ出す「先月のふりかえりレポートができました」の案内。
 * 表示条件は services/report/reportBanner.ts を参照。
 *
 * 未購入の人には「プラスで見られる」とはっきり書く。レポートを見せるふりをして
 * 購入画面に飛ばすと、だまされた印象になるため。
 */
export function MonthlyReportBanner() {
  const premium = usePremiumStatus();
  const [target, setTarget] = useState<ReportBannerTarget | null>(null);

  useEffect(() => {
    let active = true;
    getReportBannerTarget()
      .then((t) => {
        if (active) setTarget(t);
      })
      .catch(() => {
        // 案内が出ないだけなので、失敗しても画面には何も出さない
      });
    return () => {
      active = false;
    };
  }, []);

  // 購入状態の判定前に出すと、文言が切り替わってちらつくため待つ
  if (!target || premium === null) return null;

  const locked = isPaywallEnabled() && !premium;

  const dismiss = () => {
    setTarget(null);
    dismissReportBanner(target.year, target.month).catch(() => {});
  };

  const open = () => {
    dismiss();
    if (locked) {
      router.push('/paywall');
    } else {
      router.push({
        pathname: '/report/[month]',
        params: { month: toMonthKey(target.year, target.month) },
      });
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>{target.month}月のふりかえりレポートができました</Text>
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          accessibilityHint="今月はこの案内を表示しません"
          hitSlop={8}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>
        {target.recordedDays}日分の記録から、テーマ別の傾向や「誰のため」の内訳をまとめました。
        {locked && '月次レポートは「プラス」（買い切り）で見られます。'}
      </Text>
      <Button
        label={locked ? 'プラスについて見る' : 'レポートを見る'}
        variant="secondary"
        onPress={open}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  title: { ...TYPE.headline, color: NEUTRAL_COLORS.textPrimary, flex: 1 },
  // 見た目は小さな×だが、HIGの最小タップ寸法を満たす
  closeButton: {
    minWidth: MIN_TAP,
    minHeight: MIN_TAP,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: -SPACING.sm,
    marginRight: -SPACING.sm,
  },
  closeText: { ...TYPE.title3, color: NEUTRAL_COLORS.textSecondary },
  body: { ...TYPE.subhead, color: NEUTRAL_COLORS.textSecondary },
});
