import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientScoreBar } from '@/components/GradientScoreBar';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { INTEREST_THEME_OPTIONS } from '@/types/models';
import {
  updateInterestThemes,
  updateOnboardingCompleted,
} from '@/db/repositories/userPreferenceRepo';

const TOTAL_STEPS = 3;

/**
 * 8.4: オンボーディング画面（3ステップ、進捗ドット表示、1-2はスキップ可）。
 * 文言トーンは断定・説教調を避け、責めない・寄り添う語り口とする。
 *
 * 【要件書8.4からの意図的な変更】スクリーンタイム連携のステップを削除した。
 * AI質問生成を導入するまでスクリーンタイムは何にも使われず（記録して設定画面で
 * 見返せるだけ）、初回起動時に入力を求める価値がないため。機能自体は設定画面に
 * 残してあるので、AI導入時にこのステップを戻せる。
 *
 * 【関心テーマのステップを残している理由】
 * スクリーンタイムと同じく「AI未導入だから無意味」に見えるが、こちらは
 * フォールバック質問の選出にも効くようにしたため、初日から出題が変わる。
 * getFallbackQuestionSet の interestThemes 引数を参照。
 *
 * 【リマインダーをここで聞かない理由 ★変更前に読むこと】
 * リマインダーの設定はオンボーディングに置かず、「1日目を書き終えた直後」
 * （今日の質問画面の完了状態）で聞く。ReminderPrompt.tsx を参照。
 * iOSの通知許可は一度拒否されると canAskAgain=false になり二度と聞けないため、
 * 価値が伝わっていない起動直後に消費するのが最も損だという判断。
 */
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const finish = async () => {
    await updateInterestThemes(selectedThemes);
    await updateOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.dots} accessible={false} importantForAccessibility="no-hide-descendants">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {step === 0 && <StepConcept />}
        {step === 1 && <StepHowItWorks />}
        {step === 2 && (
          <StepInterestThemes selected={selectedThemes} onToggle={toggleTheme} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <>
            <Pressable style={styles.skipButton} onPress={() => setStep(TOTAL_STEPS - 1)}>
              <Text style={styles.skipText}>スキップ</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={goNext}>
              <Text style={styles.primaryButtonText}>次へ</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.startBlock}>
            <Text style={styles.legalText}>
              はじめることで、利用規約とプライバシーポリシーに同意したものとします。
            </Text>
            <View style={styles.legalLinks}>
              <Pressable hitSlop={8} onPress={() => router.push('/legal/terms')}>
                <Text style={styles.legalLinkText}>利用規約</Text>
              </Pressable>
              <Text style={styles.legalSeparator}>/</Text>
              <Pressable hitSlop={8} onPress={() => router.push('/legal/privacy')}>
                <Text style={styles.legalLinkText}>プライバシーポリシー</Text>
              </Pressable>
            </View>
            <Pressable style={styles.primaryButton} onPress={finish}>
              <Text style={styles.primaryButtonText}>はじめる</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function StepConcept() {
  return (
    <View style={styles.stepGap}>
      <Text style={styles.title}>キミシダイ日記</Text>
      <Text style={styles.subtitle}>取り戻せ、あなた色の人生</Text>
      <Text style={styles.body}>
        今日一日を「自分軸」で生きられたかを、日替わりの質問に答える形で毎日振り返るカレンダー型日記です。
      </Text>
      <View style={{ marginTop: 12 }}>
        <GradientScoreBar score={68} showLabel={false} />
        <Text style={styles.caption}>積み重ねが、色になる。</Text>
      </View>
    </View>
  );
}

function StepHowItWorks() {
  return (
    <View style={styles.stepGap}>
      <Text style={styles.title}>使い方・安心感について</Text>
      <Text style={styles.body}>
        毎日、日替わりの質問を5問お届けします。答えは4段階評価と、書きたければ一言メモだけ。1日3分ほどで終わります。
      </Text>
      <Text style={styles.body}>
        質問は100問以上の中から、最近お見せしていないものを選んでいます。同じ質問が続いて形だけの振り返りにならないようにするためです。
      </Text>
      <Text style={styles.body}>
        書いた内容は、すべてこの端末の中だけに保存されます。外部に送信することはありません。アカウント登録も不要です。
      </Text>
    </View>
  );
}

function StepInterestThemes({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (theme: string) => void;
}) {
  return (
    <View style={styles.stepGap}>
      <Text style={styles.title}>関心のあるテーマを選んでください</Text>
      <Text style={styles.body}>（あとから設定画面で変更できます。選ばなくても始められます）</Text>
      <View style={styles.themeGrid}>
        {INTEREST_THEME_OPTIONS.map((theme) => {
          const active = selected.includes(theme);
          return (
            <Pressable
              key={theme}
              style={[styles.themeChip, active && styles.themeChipActive]}
              onPress={() => onToggle(theme)}
            >
              <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                {theme}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_COLORS.background },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: NEUTRAL_COLORS.border },
  dotActive: { backgroundColor: NEUTRAL_COLORS.accent, width: 20 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  stepGap: { gap: 14 },
  title: { fontSize: 24, fontWeight: '700', color: NEUTRAL_COLORS.textPrimary },
  subtitle: { fontSize: 15, color: NEUTRAL_COLORS.textSecondary, marginTop: -6 },
  body: { fontSize: 15, lineHeight: 24, color: NEUTRAL_COLORS.textPrimary },
  caption: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary, marginTop: 6 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  startBlock: { width: '100%', alignItems: 'stretch', gap: 10 },
  legalText: { fontSize: 11, lineHeight: 16, color: NEUTRAL_COLORS.textSecondary },
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legalLinkText: { fontSize: 12, fontWeight: '600', color: NEUTRAL_COLORS.accent },
  legalSeparator: { fontSize: 12, color: NEUTRAL_COLORS.textSecondary },
  skipButton: { paddingVertical: 12, paddingHorizontal: 16 },
  skipText: { color: NEUTRAL_COLORS.textSecondary, fontSize: 14 },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: NEUTRAL_COLORS.accent,
    alignItems: 'center',
  },
  primaryButtonText: { color: NEUTRAL_COLORS.onAccent, fontWeight: '700', fontSize: 15 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  themeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: NEUTRAL_COLORS.border,
  },
  themeChipActive: { backgroundColor: NEUTRAL_COLORS.accent, borderColor: NEUTRAL_COLORS.accent },
  themeChipText: { color: NEUTRAL_COLORS.textPrimary, fontSize: 13 },
  themeChipTextActive: { color: NEUTRAL_COLORS.onAccent },
});
