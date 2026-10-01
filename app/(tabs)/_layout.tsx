import React from 'react';
import { Platform, Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { NEUTRAL_COLORS } from '@/constants/colors';

/**
 * タブアイコンはSF Symbolsを使う（HIG「Tab bars」）。
 *
 * HIGはタブアイコンにSF Symbolsを推奨し、プラットフォームとの一貫性のため
 * 塗りつぶし記号を優先するよう定めている。以前は絵文字を<Text>で描いていたが、
 * 絵文字はカラーグリフなのでcolorが効かず、選択中のタブがラベルの色でしか
 * 判別できなかった。SF Symbolsならtintがそのまま効く。
 *
 * SymbolViewはiOS専用。Androidではfallbackが描画されるので、
 * Android対応に着手するまでは従来の絵文字をそのまま受け皿にしている。
 */
type TabIcon = { symbol: SymbolViewProps['name']; emoji: string };

function TabBarIcon({ icon, color, size }: { icon: TabIcon; color: ColorValue; size: number }) {
  if (Platform.OS !== 'ios') {
    return <Text style={{ fontSize: size, color }}>{icon.emoji}</Text>;
  }
  return <SymbolView name={icon.symbol} size={size} tintColor={color} resizeMode="scaleAspectFit" />;
}

const ICONS = {
  questions: { symbol: 'text.bubble.fill', emoji: '📝' },
  todo: { symbol: 'checkmark.circle.fill', emoji: '✅' },
  calendar: { symbol: 'calendar', emoji: '📅' },
  settings: { symbol: 'gearshape.fill', emoji: '⚙️' },
} satisfies Record<string, TabIcon>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // 画面内に自前の見出しを描くのをやめ、ネイティブのナビゲーションバーに任せる。
        // ラージタイトル（headerLargeTitle）はネイティブスタック専用のオプションで
        // ボトムタブのヘッダーでは使えないため、通常タイトルにしている。
        // ラージタイトルにするならタブごとにStackを挟む構成変更が必要。
        headerShown: true,
        headerStyle: { backgroundColor: NEUTRAL_COLORS.background },
        headerShadowVisible: false,
        headerTintColor: NEUTRAL_COLORS.textPrimary,
        tabBarActiveTintColor: NEUTRAL_COLORS.accent,
        tabBarInactiveTintColor: NEUTRAL_COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          // HIGはタブラベルを「できるだけ単語1つ」にするよう定めている
          title: '質問',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={ICONS.questions} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="todo/index"
        options={{
          title: 'やること',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={ICONS.todo} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={ICONS.calendar} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={ICONS.settings} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
