import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { generateWeeklyPlan, replanDay } from '../services/planner';
import { useBlocks } from '../hooks/useBlocks';
import { WeekPlan, PlanBlock } from '../../../shared/types';
import { weekId, getWeekDates, todayString } from '../../../shared/utils';
import WeekCalendarView from './WeekCalendarView';
import DayCalendarView from './DayCalendarView';

export default function PlannerScreen() {
  const { blocks } = useBlocks();
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const weekDates = getWeekDates();
  const currentWeekId = weekId();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const unsub = onSnapshot(
      doc(db, 'users', userId, 'plans', currentWeekId),
      (snap) => { if (snap.exists()) setWeekPlan(snap.data() as WeekPlan); }
    );
    return unsub;
  }, [currentWeekId]);

  async function handleGenerate() {
    if (!rawInput.trim()) return;
    setGenerating(true);
    try {
      const plan = await generateWeeklyPlan(rawInput, blocks, weekDates[0]);
      setWeekPlan(plan);
      setRawInput('');
    } catch (e) {
      console.error('Plan generation failed', e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDailyAdd(date: string, addition: string) {
    if (!weekPlan) return;
    setGenerating(true);
    try {
      const updatedDay = await replanDay(date, addition, weekPlan, blocks);
      setWeekPlan((prev) =>
        prev ? { ...prev, days: { ...prev.days, [date]: updatedDay } } : prev
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Planner</Text>
      </View>

      {!weekPlan ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputTitle}>이번 주 계획을 입력하세요</Text>
          <Text style={styles.inputSubtitle}>
            할 일, 약속, 기상/취침 시간, 고정 일정을 자유롭게 입력하면 AI가 주간 계획을 만들어 드립니다.
          </Text>
          <TextInput
            style={styles.textArea}
            value={rawInput}
            onChangeText={setRawInput}
            placeholder={'이번 주 할일:\n- React 챕터 3, 4 끝내기 (각 2시간)\n- 수요일 치과 2시\n기상 6:00, 취침 23:00'}
            placeholderTextColor="#7D8590"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.generateBtn, generating && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={generating || !rawInput.trim()}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateBtnText}>생성 ✨</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {selectedDate ? (
            <DayCalendarView
              date={selectedDate}
              plan={weekPlan.days[selectedDate]}
              blocks={blocks}
              generating={generating}
              onBack={() => setSelectedDate(null)}
              onAddItem={(addition) => handleDailyAdd(selectedDate, addition)}
            />
          ) : (
            <WeekCalendarView
              weekPlan={weekPlan}
              blocks={blocks}
              weekDates={weekDates}
              today={todayString()}
              onDayPress={setSelectedDate}
              onReset={() => setWeekPlan(null)}
            />
          )}
        </View>
      )}

      {generating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E9BB5" />
          <Text style={styles.loadingText}>AI가 계획을 수정 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#E6EDF3' },
  inputContainer: { flex: 1, padding: 20, gap: 16 },
  inputTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3' },
  inputSubtitle: { fontSize: 14, color: '#7D8590', lineHeight: 20 },
  textArea: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 14,
    padding: 16,
    color: '#E6EDF3',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#21262D',
    lineHeight: 22,
  },
  generateBtn: {
    backgroundColor: '#2E9BB5',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  generateBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,17,23,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { color: '#E6EDF3', fontSize: 16 },
});
