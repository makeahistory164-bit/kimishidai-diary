import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useUserPreference } from '@/hooks/useUserPreference';
import { NEUTRAL_COLORS } from '@/constants/colors';

/**
 * オンボーディング完了状態に応じてルーティングするゲート画面。
 * 8.4: 初回起動時はオンボーディングへ、完了済みならホームへ。
 */
export default function IndexGate() {
  const { preference, loading } = useUserPreference();

  if (loading || !preference) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={NEUTRAL_COLORS.accent} />
      </View>
    );
  }

  return <Redirect href={preference.onboardingCompleted ? '/(tabs)' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEUTRAL_COLORS.background,
  },
});
