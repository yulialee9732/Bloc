import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBlocks } from '../hooks/useBlocks';
import { useTimer, useActiveBlock } from '../hooks/useTimer';
import { useHabits } from '../hooks/useHabits';
import BlockTimer from '../components/BlockTimer';
import HabitTracker from '../components/HabitTracker';
import { Block, Session } from '../../../shared/types';
import { todayString, getWeekDates } from '../../../shared/utils';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';

function BlockTimerRow({
  block,
  isActive,
  onPress,
  onLongPress,
  streaks,
}: {
  block: Block;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  streaks: any;
}) {
  const { elapsed, status, start, pause } = useTimer(block.id);
  const isRunning = status === 'running';
  return (
    <BlockTimer
      block={block}
      elapsed={elapsed}
      isRunning={isRunning}
      streak={streaks[block.id]}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { blocks, loading } = useBlocks();
  const { activeBlockId, setActiveBlock } = useActiveBlock();
  const today = todayString();
  const weekDates = getWeekDates();
  const { habits, streaks, toggleHabit, markGoalHit } = useHabits(blocks.map((b) => b.id));
  const [showReflectionFor, setShowReflectionFor] = useState<{ blockId: string; elapsed: number } | null>(null);

  const handleBlockPress = useCallback(
    async (block: Block) => {
      if (activeBlockId === block.id) {
        await setActiveBlock(null);
      } else {
        if (activeBlockId) await setActiveBlock(null);
        await setActiveBlock(block.id);
      }
    },
    [activeBlockId, setActiveBlock]
  );

  const handleLongPress = useCallback(
    (block: Block) => {
      navigation.navigate('EditBlock', { blockId: block.id });
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.appName}>Bloc</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {blocks.map((block) => (
          <BlockTimerRow
            key={block.id}
            block={block}
            isActive={activeBlockId === block.id}
            onPress={() => handleBlockPress(block)}
            onLongPress={() => handleLongPress(block)}
            streaks={streaks}
          />
        ))}

        <HabitTracker
          blocks={blocks}
          habits={habits}
          streaks={streaks}
          weekDates={weekDates}
          today={today}
          onToggle={toggleHabit}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EditBlock', { blockId: null })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' },
  loadingText: { color: '#7D8590', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  appName: { fontSize: 24, fontWeight: '800', color: '#E6EDF3' },
  settingsIcon: { fontSize: 22 },
  scroll: { flex: 1, paddingTop: 8 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E9BB5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
