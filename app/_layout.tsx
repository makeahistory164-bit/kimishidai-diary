import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useDbReady } from '@/hooks/useDbReady';
import { NEUTRAL_COLORS } from '@/constants/colors';
import {
  configureNotificationHandler,
  syncReminderOnLaunch,
} from '@/services/notifications/reminderService';

// 通知の表示方法はアプリ起動時に一度だけ設定する（コンポーネント外＝再レンダーの影響を受けない）
configureNotificationHandler();

export default function RootLayout() {
  const dbReady = useDbReady();

  // OS再起動などで通知予約が消えている可能性があるため、
  // 起動のたびにDBの設定内容へ揃え直す。DB初期化の完了を待つ必要がある。
  useEffect(() => {
    if (dbReady) {
      syncReminderOnLaunch();
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="day/[date]" options={{ headerShown: true, title: '日別詳細' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: true, title: 'プレミアム' }} />
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
