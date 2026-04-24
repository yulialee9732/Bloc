import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Block } from '../../../../shared/types';
import { formatSecondsShort } from '../../../../shared/utils';

interface Props {
  blockTotals: Record<string, number>;
  blocks: Block[];
}

export default function BlockBreakdown({ blockTotals, blocks }: Props) {
  const total = Object.values(blockTotals).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sorted = blocks
    .filter((b) => blockTotals[b.id] > 0)
    .sort((a, b) => (blockTotals[b.id] ?? 0) - (blockTotals[a.id] ?? 0));

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {sorted.map((block) => {
          const pct = (blockTotals[block.id] / total) * 100;
          return (
            <View
              key={block.id}
              style={[styles.segment, { width: `${pct}%`, backgroundColor: block.color }]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {sorted.map((block) => (
          <View key={block.id} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: block.color }]} />
            <Text style={styles.legendName}>{block.name}</Text>
            <Text style={styles.legendTime}>{formatSecondsShort(blockTotals[block.id])}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  bar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#21262D',
  },
  segment: { height: '100%' },
  legend: { marginTop: 10, gap: 6 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, color: '#E6EDF3' },
  legendTime: { fontSize: 13, color: '#7D8590', fontVariant: ['tabular-nums'] },
});
