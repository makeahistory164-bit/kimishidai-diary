import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { MonthlyScoreChart } from '@/components/MonthlyScoreChart';
import { NEUTRAL_COLORS, getAxisScoreColor } from '@/constants/colors';
import { TYPE, SPACING, RADIUS, SCREEN_PADDING } from '@/constants/theme';
import { usePremiumStatus } from '@/hooks/usePremium';
import { isPaywallEnabled } from '@/services/purchases';
import {
  buildMonthlyReport,
  type CategoryReport,
  type HalfComparison,
  type MonthlyReport,
} from '@/services/report/monthlyReport';

/** 「保てていた」と書ける水準。これ未満のテーマをそう呼ぶと事実と違うため */
const GOOD_SCORE = 60;

const HALF_COMPARISON_TEXT: Record<HalfComparison, string> = {
  later_higher: '月の後半は、前半より自分軸を保てた日が多めでした。',
  earlier_higher: '月の前半のほうが、自分軸を保てた日が多めでした。',
  steady: '月を通して、大きな波はありませんでした。',
};

const CHANGE_TEXT: Record<NonNullable<CategoryReport['change']>, string> = {
  up: '先月より上向き',
  down: '先月より下向き',
  same: '先月と同じくらい',
};

/** "2026-10" → [2026, 10]。不正な値なら null */
function parseMonthParam(value: string | undefined): [number, number] | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? [year, month] : null;
}

/** 月次レポート（プレミアム機能）。カレンダー画面から表示中の月を渡して開く。 */
export default function MonthlyReportScreen() {
  const { month: monthParam } = useLocalSearchParams<{ month: string }>();
  const parsed = parseMonthParam(monthParam);
  const premium = usePremiumStatus();
  const [report, setReport] = useState<MonthlyReport | null>(null);

  // 購入手段がない環境では制限しない（services/purchases の isPaywallEnabled 参照）
  const locked = isPaywallEnabled() && premium === false;
  const year = parsed?.[0];
  const month = parsed?.[1];

  useEffect(() => {
    if (year === undefined || month === undefined || locked) return;
    let active = true;
    buildMonthlyReport(year, month).then((r) => {
      if (active) setReport(r);
    });
    return () => {
      active = false;
    };
  }, [year, month, locked]);

  if (!parsed) {
    return (
      <Centered>
        <Text style={styles.body}>レポートを表示できませんでした。</Text>
      </Centered>
    );
  }

  // カレンダーの導線はペイウォールへ送るが、URLから直接開かれた場合に備えてここでも塞ぐ
  if (locked) {
    return (
      <Centered>
        <Text style={styles.body}>月次レポートは「プラス」の機能です。</Text>
        <Button label="プラスについて見る" onPress={() => router.replace('/paywall')} />
      </Centered>
    );
  }

  if (premium === null || !report) {
    return (
      <Centered>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </Centered>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {report.year}年{report.month}月のふりかえり
        </Text>

        {report.recordedDays === 0 ? (
          <Card>
            <Text style={styles.body}>
              この月はまだ記録がありません。質問に答えた日が増えると、ここに傾向が表れます。
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>記録した日</Text>
              <Text style={styles.summaryValue}>{report.recordedDays}日</Text>
            </Card>

            <View>
              <SectionHeader title="毎日の軸の推移" />
              <Card>
                <MonthlyScoreChart points={report.dailyScores} />
                <Text style={styles.body}>
                  {report.halfComparison
                    ? HALF_COMPARISON_TEXT[report.halfComparison]
                    : '記録が増えると、月の前半と後半の違いが見えてきます。'}
                </Text>
              </Card>
            </View>

            <CategorySection report={report} />
            <DoneForSection report={report} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategorySection({ report }: { report: MonthlyReport }) {
  const top = report.categories[0];
  return (
    <View>
      <SectionHeader title="テーマ別の傾向" />
      <Card>
        {report.categories.length === 0 ? (
          <Text style={styles.body}>
            同じテーマの質問に2回以上答えると、ここにテーマごとの傾向が表れます。
          </Text>
        ) : (
          <>
            {top && top.score >= GOOD_SCORE && (
              <Text style={styles.body}>
                「{top.category}」では、自分軸を保てていた日が多めでした。
              </Text>
            )}
            {report.categories.map((c) => (
              <View key={c.category} style={styles.categoryRow}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{c.category}</Text>
                  <Text style={styles.rowMeta}>
                    {c.change ? `${CHANGE_TEXT[c.change]}・` : ''}
                    {c.answerCount}回
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(2, c.score)}%`, backgroundColor: getAxisScoreColor(c.score) },
                    ]}
                  />
                </View>
              </View>
            ))}
          </>
        )}
        {report.sparseCategories.length > 0 && (
          <Text style={styles.note}>
            回答が1回だけのテーマ（{report.sparseCategories.join('、')}）は表示していません。
          </Text>
        )}
      </Card>
    </View>
  );
}

function DoneForSection({ report }: { report: MonthlyReport }) {
  const { total, items } = report.doneFor;
  return (
    <View>
      <SectionHeader title="やり終えたことは、誰のためだったか" />
      <Card>
        {total === 0 ? (
          <Text style={styles.body}>この月は、完了した「今日やること」がありませんでした。</Text>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.value} style={styles.categoryRow}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>
                    {item.emoji} {item.label}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {item.count}件（{Math.round(item.ratio * 100)}%）
                  </Text>
                </View>
                <View style={styles.track}>
                  {/* 良し悪しを示唆しないよう、スコア色ではなく中立色で塗る */}
                  <View
                    style={[
                      styles.fill,
                      { width: `${item.ratio * 100}%`, backgroundColor: NEUTRAL_COLORS.accent },
                    ]}
                  />
                </View>
              </View>
            ))}
            <Text style={styles.note}>
              どの割合が良い・悪いということはありません。誰かのために動くことも、あなたの選択です。
            </Text>
          </>
        )}
      </Card>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  centered: { alignItems: 'center', justifyContent: 'center', gap: SPACING.lg, padding: SCREEN_PADDING },
  content: { padding: SCREEN_PADDING, gap: SPACING.xl },
  title: { ...TYPE.title2, color: NEUTRAL_COLORS.textPrimary },
  body: { ...TYPE.subhead, color: NEUTRAL_COLORS.textPrimary },
  note: { ...TYPE.footnote, color: NEUTRAL_COLORS.textSecondary },
  summaryCard: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  summaryLabel: { ...TYPE.subhead, color: NEUTRAL_COLORS.textSecondary },
  summaryValue: { ...TYPE.title2, color: NEUTRAL_COLORS.textPrimary },
  categoryRow: { gap: SPACING.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowLabel: { ...TYPE.subhead, fontWeight: '600', color: NEUTRAL_COLORS.textPrimary },
  rowMeta: { ...TYPE.caption, color: NEUTRAL_COLORS.textSecondary },
  track: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: NEUTRAL_COLORS.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: RADIUS.pill },
});
