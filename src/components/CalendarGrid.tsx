import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NEUTRAL_COLORS } from '@/constants/colors';
import { DayCell } from './DayCell';
import { toDateKey } from '@/lib/id';
import type { DailyEntry } from '@/types/models';

interface Props {
  year: number;
  month: number; // 1-12
  entries: DailyEntry[];
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** 8.2: 月間グリッド */
export function CalendarGrid({ year, month, entries, onSelectDate }: Props) {
  const entryByDate = useMemo(() => {
    const map = new Map<string, DailyEntry>();
    for (const e of entries) map.set(e.date, e);
    return map;
  }, [entries]);

  const todayKey = toDateKey(new Date());

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstOfMonth.getDay(); // 0=日
    const items: Array<{ day: number; dateKey: string } | null> = [];
    for (let i = 0; i < leadingBlanks; i++) items.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      items.push({ day, dateKey });
    }
    return items;
  }, [year, month]);

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, idx) =>
          cell ? (
            <DayCell
              key={cell.dateKey}
              day={cell.day}
              axisScore={entryByDate.get(cell.dateKey)?.axisScore ?? null}
              isToday={cell.dateKey === todayKey}
              onPress={() => onSelectDate(cell.dateKey)}
            />
          ) : (
            <View key={`blank-${idx}`} style={styles.blank} />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: NEUTRAL_COLORS.textSecondary,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  blank: { width: '14.28%', aspectRatio: 1 },
});
