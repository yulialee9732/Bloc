import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  count: number;
  size?: 'sm' | 'md';
}

export default function StreakBadge({ count, size = 'md' }: Props) {
  if (count === 0) return null;
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, isSmall && styles.badgeSm]}>
      <Text style={[styles.flame, isSmall && styles.flameSm]}>🔥</Text>
      <Text style={[styles.text, isSmall && styles.textSm]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,140,0,0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 2,
  },
  badgeSm: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  flame: { fontSize: 14 },
  flameSm: { fontSize: 11 },
  text: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: '700',
  },
  textSm: { fontSize: 10 },
});
