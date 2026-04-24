import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MonthStats, Block } from '../../../../shared/types';
import { formatSecondsShort } from '../../../../shared/utils';

interface Props {
  stats: MonthStats;
  blocks: Block[];
  onDayPress: (date: string) => void;
}

const BAR_MAX_HEIGHT = 120;
const BAR_WIDTH = 20;

export default function DailyBarChart({ stats, blocks, onDayPress }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const entries = Object.entries(stats.dailyTotals).sort(([a], [b]) => a.localeCompare(b));
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {entries.map(([date, total]) => {
            const height = (total / maxVal) * BAR_MAX_HEIGHT;
            const day = parseInt(date.split('-')[2], 10);
            return (
              <TouchableOpacity
                key={date}
                style={styles.barCol}
                onPress={() => { setSelectedDate(date); onDayPress(date); }}
              >
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(height, 3), backgroundColor: '#2E9BB5' },
                    date === selectedDate && styles.barSelected,
                  ]}
                />
                <Text style={styles.dayNum}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      {selectedDate && stats.dailyTotals[selectedDate] != null && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipDate}>{selectedDate}</Text>
          <Text style={styles.tooltipTotal}>
            Total: {formatSecondsShort(stats.dailyTotals[selectedDate])}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  chart: { flexDirection: 'row', alignItems: 'flex-end', paddingVertical: 8, gap: 3 },
  barCol: { alignItems: 'center', width: BAR_WIDTH },
  bar: { width: BAR_WIDTH, borderRadius: 3 },
  barSelected: { opacity: 0.7 },
  dayNum: { fontSize: 9, color: '#7D8590', marginTop: 3 },
  tooltip: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#161B22',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  tooltipDate: { fontSize: 13, color: '#E6EDF3', fontWeight: '600' },
  tooltipTotal: { fontSize: 12, color: '#7D8590', marginTop: 2 },
});
