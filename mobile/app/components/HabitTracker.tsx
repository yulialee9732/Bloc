import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Block, HabitEntry, Streak } from '../../../shared/types';
import { getDayLabel, hexToRgba } from '../../../shared/utils';
import StreakBadge from './StreakBadge';

interface Props {
  blocks: Block[];
  habits: HabitEntry | null;
  streaks: Record<string, Streak>;
  weekDates: string[];
  today: string;
  onToggle: (blockId: string, checked: boolean) => void;
}

export default function HabitTracker({ blocks, habits, streaks, weekDates, today, onToggle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Habits</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.labelCell} />
            {weekDates.map((date) => (
              <View key={date} style={[styles.dayCell, date === today && styles.todayCell]}>
                <Text style={[styles.dayLabel, date === today && styles.todayLabel]}>
                  {getDayLabel(date)}
                </Text>
                <Text style={[styles.dateNum, date === today && styles.todayLabel]}>
                  {parseInt(date.split('-')[2], 10)}
                </Text>
              </View>
            ))}
            <View style={styles.streakCell}>
              <Text style={styles.streakHeader}>Streak</Text>
            </View>
          </View>

          {blocks.map((block) => (
            <View key={block.id} style={styles.blockRow}>
              <View style={styles.labelCell}>
                <View style={[styles.colorDot, { backgroundColor: block.color }]} />
                <Text style={styles.blockName} numberOfLines={1}>{block.name}</Text>
              </View>
              {weekDates.map((date) => {
                const checked = habits?.entries[block.id] && date === today
                  ? habits.entries[block.id]
                  : habits?.goalHit[block.id] && date === today
                  ? habits.goalHit[block.id]
                  : false;
                const isToday = date === today;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.checkCell,
                      checked && { backgroundColor: hexToRgba(block.color, 0.25) },
                    ]}
                    onPress={() => isToday && onToggle(block.id, !checked)}
                    disabled={!isToday}
                  >
                    {checked && (
                      <View style={[styles.checkDot, { backgroundColor: block.color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={styles.streakCell}>
                <StreakBadge count={streaks[block.id]?.current ?? 0} size="sm" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  blockRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  labelCell: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  blockName: { fontSize: 12, color: '#7D8590', flex: 1 },
  dayCell: {
    width: 36,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  todayCell: {},
  dayLabel: { fontSize: 10, color: '#7D8590', fontWeight: '600' },
  todayLabel: { color: '#2E9BB5' },
  dateNum: { fontSize: 10, color: '#7D8590' },
  checkCell: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#21262D',
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: { width: 14, height: 14, borderRadius: 7 },
  streakCell: { width: 60, alignItems: 'center' },
  streakHeader: { fontSize: 10, color: '#7D8590', fontWeight: '600' },
});
