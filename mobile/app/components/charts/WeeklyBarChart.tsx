import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getDayLabel, formatSecondsShort } from '../../../../shared/utils';
import { Block, Session } from '../../../../shared/types';

interface DayData {
  date: string;
  total: number;
  sessions: Session[];
}

interface Props {
  data: DayData[];
  blocks: Block[];
  today: string;
}

const CHART_HEIGHT = 160;
const WIDTH = Dimensions.get('window').width - 64;

export default function WeeklyBarChart({ data, blocks, today }: Props) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((day, i) => {
          const barHeight = (day.total / maxTotal) * CHART_HEIGHT;
          const isToday = day.date === today;
          const blockBreakdown: { blockId: string; elapsed: number }[] = [];
          for (const s of day.sessions) {
            const existing = blockBreakdown.find((b) => b.blockId === s.blockId);
            if (existing) existing.elapsed += s.elapsed;
            else blockBreakdown.push({ blockId: s.blockId, elapsed: s.elapsed });
          }
          return (
            <View key={day.date} style={styles.barColumn}>
              <Text style={styles.totalLabel}>
                {day.total > 0 ? formatSecondsShort(day.total) : ''}
              </Text>
              <View style={[styles.barTrack, { height: CHART_HEIGHT }]}>
                <View style={{ height: barHeight, width: '100%', overflow: 'hidden', borderRadius: 4 }}>
                  {blockBreakdown.map((seg, j) => {
                    const segHeight = (seg.elapsed / day.total) * barHeight;
                    return (
                      <View
                        key={seg.blockId}
                        style={{
                          height: segHeight,
                          backgroundColor: blockMap[seg.blockId]?.color ?? '#5D6D7E',
                        }}
                      />
                    );
                  })}
                </View>
              </View>
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>
                {getDayLabel(day.date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  totalLabel: { fontSize: 9, color: '#7D8590', height: 14, textAlign: 'center' },
  barTrack: { width: '70%', justifyContent: 'flex-end', backgroundColor: '#21262D', borderRadius: 4 },
  dayLabel: { fontSize: 11, color: '#7D8590', fontWeight: '500' },
  todayLabel: { color: '#2E9BB5', fontWeight: '700' },
});
