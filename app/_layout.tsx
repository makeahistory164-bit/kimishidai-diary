import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDbReady } from '@/hooks/useDbReady';
import { NEUTRAL_COLORS } from '@/constants/colors';
import {
  configureNotificationHandler,
  syncReminderOnLaunch,
} from '@/services/notifications/reminderService';
import { configurePurchases, syncPremiumStatus } from '@/services/purchases';

// 通知の表示方法はアプリ起動時に一度だけ設定する（コンポーネント外＝再レンダーの影響を受けない）
configureNotificationHandler();
// 課金SDKも同様。各画面の初回描画で isPaywallEnabled() を正しく返すため、
// useEffect（子の描画後に走る）ではなくここで構成する。
configurePurchases();

/** モーダル画面の閉じるボタン。モーダルには戻るボタンが出ないため自前で用意する。 */
function HeaderCloseButton() {
  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="閉じる"
      // 見た目は文字だけだが、HIGの最小タップ寸法を満たす
      style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 17, color: NEUTRAL_COLORS.textPrimary }}>閉じる</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  const dbReady = useDbReady();

  // OS再起動などで通知予約が消えている可能性があるため、
  // 起動のたびにDBの設定内容へ揃え直す。DB初期化の完了を待つ必要がある。
  useEffect(() => {
    if (dbReady) {
      syncReminderOnLaunch();
      // 課金状態のキャッシュ（premium_status）をDBへ書くため、DB初期化後に行う
      syncPremiumStatus();
    }
  }, [dbReady]);

  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/*
        headerBackTitle を指定しないと、戻るボタンに遷移元のルート名がそのまま出る。
        日別詳細・利用規約・プライバシーポリシーはいずれも (tabs) から push するため、
        指定なしでは画面に「(tabs)」という内部名が露出してしまう。
      */}
      <Stack screenOptions={{ headerShown: false, headerBackTitle: '戻る' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="day/[date]" options={{ headerShown: true, title: '日別詳細' }} />
        <Stack.Screen name="report/[month]" options={{ headerShown: true, title: '月次レポート' }} />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'プラス',
            // モーダルは戻るボタンが出ないため、明示的な閉じる手段が必要
            headerLeft: () => <HeaderCloseButton />,
          }}
        />
        <Stack.Screen name="legal/terms" options={{ headerShown: true, title: '利用規約' }} />
        <Stack.Screen
          name="legal/privacy"
          options={{ headerShown: true, title: 'プライバシーポリシー' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEUTRAL_COLORS.background,
  },
});
