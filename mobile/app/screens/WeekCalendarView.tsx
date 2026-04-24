import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { WeekPlan, PlanBlock, Block } from '../../../shared/types';
import { getDayLabel } from '../../../shared/utils';

interface Props {
  weekPlan: WeekPlan;
  blocks: Block[];
  weekDates: string[];
  today: string;
  onDayPress: (date: string) => void;
  onReset: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  focus: '',
  meal: '#6B7280',
  travel: '#D97706',
  event: '#EF4444',
  rest: '#374151',
};

export default function WeekCalendarView({ weekPlan, blocks, weekDates, today, onDayPress, onReset }: Props) {
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  function blockColor(pb: PlanBlock): string {
    if (pb.category === 'focus' && pb.blockId) {
      return blockMap[pb.blockId]?.color ?? '#2E9BB5';
    }
    return pb.color || CATEGORY_COLORS[pb.category] || '#5D6D7E';
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.weekLabel}>Week of {weekDates[0]}</Text>
        <TouchableOpacity onPress={onReset}>
          <Text style={styles.resetText}>Re-generate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {weekDates.map((date) => {
            const day = weekPlan.days[date];
            const isToday = date === today;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.dayCol, isToday && styles.todayCol]}
                onPress={() => onDayPress(date)}
              >
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayName, isToday && styles.todayText]}>
                    {getDayLabel(date)}
                  </Text>
                  <Text style={[styles.dayNum, isToday && styles.todayText]}>
                    {parseInt(date.split('-')[2], 10)}
                  </Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.blocksScroll}>
                  {(day?.blocks ?? []).map((pb) => (
                    <View key={pb.id} style={[styles.planBlock, { backgroundColor: blockColor(pb) + '33', borderLeftColor: blockColor(pb) }]}>
                      <Text style={styles.planBlockTime}>{pb.startTime}–{pb.endTime}</Text>
                      <Text style={styles.planBlockName} numberOfLines={1}>{pb.name}</Text>
                    </View>
                  ))}
                  {(!day || day.blocks.length === 0) && (
                    <Text style={styles.emptyDay}>—</Text>
                  )}
                </ScrollView>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  weekLabel: { fontSize: 14, color: '#7D8590' },
  resetText: { fontSize: 14, color: '#2E9BB5', fontWeight: '600' },
  grid: { flexDirection: 'row', padding: 8, gap: 4 },
  dayCol: {
    width: 110,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  todayCol: { borderColor: '#2E9BB5' },
  dayHeader: { alignItems: 'center', marginBottom: 8, gap: 2 },
  dayName: { fontSize: 11, color: '#7D8590', fontWeight: '700', textTransform: 'uppercase' },
  dayNum: { fontSize: 20, color: '#E6EDF3', fontWeight: '700' },
  todayText: { color: '#2E9BB5' },
  blocksScroll: { maxHeight: 480 },
  planBlock: {
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
  },
  planBlockTime: { fontSize: 9, color: '#7D8590', marginBottom: 2 },
  planBlockName: { fontSize: 11, color: '#E6EDF3', fontWeight: '600' },
  emptyDay: { color: '#7D8590', fontSize: 13, textAlign: 'center', marginTop: 20 },
});
