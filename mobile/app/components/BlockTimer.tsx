import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Block, Streak } from '../../../shared/types';
import { formatSeconds, hexToRgba, ringProgress } from '../../../shared/utils';
import StreakBadge from './StreakBadge';

interface Props {
  block: Block;
  elapsed: number;
  isRunning: boolean;
  streak?: Streak;
  onPress: () => void;
  onLongPress: () => void;
}

const RING_SIZE = 120;
const STROKE_WIDTH = 8;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BlockTimer({ block, elapsed, isRunning, streak, onPress, onLongPress }: Props) {
  const progress = ringProgress(elapsed, block.dailyGoal);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const handlePress = useCallback(() => {
    Vibration.vibrate(10);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, isRunning && { borderColor: block.color, borderWidth: 1.5 }]}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={hexToRgba(block.color, 0.2)}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={block.color}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringInner}>
            <Text style={styles.icon}>{block.icon}</Text>
            <Text style={[styles.time, isRunning && { color: block.color }]}>
              {formatSeconds(elapsed)}
            </Text>
          </View>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{block.name}</Text>
          <Text style={styles.goal}>
            Goal: {formatSeconds(block.dailyGoal)}
          </Text>
          {streak && streak.current > 0 && (
            <StreakBadge count={streak.current} />
          )}
        </View>

        <View style={styles.playButton}>
          <Text style={[styles.playIcon, { color: block.color }]}>
            {isRunning ? '⏸' : '▶'}
          </Text>
        </View>
      </View>

      {progress > 0 && (
        <View style={[styles.progressBar, { backgroundColor: hexToRgba(block.color, 0.1) }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: block.color },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, marginBottom: 4 },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6EDF3',
    fontVariant: ['tabular-nums'],
  },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  goal: { fontSize: 13, color: '#7D8590' },
  playButton: { padding: 8 },
  playIcon: { fontSize: 20 },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
});
