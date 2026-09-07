import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { NEUTRAL_COLORS } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: NEUTRAL_COLORS.accent,
        tabBarInactiveTintColor: NEUTRAL_COLORS.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '今日の質問',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📝</Text>,
        }}
      />
      <Tabs.Screen
        name="todo/index"
        options={{
          title: '今日やること',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>✅</Text>,
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="settings/index"
        options={{
          title: '設定',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  );
}
