import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientScoreBar } from '@/components/GradientScoreBar';
import { PaywallCompareTable } from '@/components/PaywallCompareTable';
import { NEUTRAL_COLORS } from '@/constants/colors';

/**
 * 8.6 アップグレード（ペイウォール）画面。
 * ストア決済基盤は12.6で未確定のオープンクエスチョンのため、
 * 本MVPでは購入ボタンを「準備中」スタブとしている（実際の課金処理は行わない）。
 */
export default function PaywallScreen() {
  const [showComingSoon, setShowComingSoon] = useState(false);

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

        <View style={styles.priceBlock}>
          <Text style={styles.price}>月額 500円（税込・目安）</Text>
          <Text style={styles.priceNote}>いつでも解約できます</Text>
        </View>

        <Pressable style={styles.ctaButton} onPress={() => setShowComingSoon(true)}>
          <Text style={styles.ctaButtonText}>プレミアムに加入する</Text>
        </Pressable>
        {showComingSoon && (
          <Text style={styles.comingSoonText}>
            ストア決済は準備中です。もうしばらくお待ちください。
          </Text>
        )}

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
  ctaButton: {
    backgroundColor: NEUTRAL_COLORS.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  comingSoonText: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, textAlign: 'center' },
  footnote: { fontSize: 11, color: NEUTRAL_COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
});
