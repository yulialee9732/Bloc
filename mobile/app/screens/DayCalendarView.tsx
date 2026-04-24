import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PlanDay, PlanBlock, Block } from '../../../shared/types';

interface Props {
  date: string;
  plan: PlanDay | undefined;
  blocks: Block[];
  generating: boolean;
  onBack: () => void;
  onAddItem: (addition: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  focus: '#2E9BB5',
  meal: '#6B7280',
  travel: '#D97706',
  event: '#EF4444',
  rest: '#374151',
};

export default function DayCalendarView({ date, plan, blocks, generating, onBack, onAddItem }: Props) {
  const [addition, setAddition] = useState('');
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  function blockColor(pb: PlanBlock): string {
    if (pb.category === 'focus' && pb.blockId) return blockMap[pb.blockId]?.color ?? '#2E9BB5';
    return pb.color || CATEGORY_COLORS[pb.category] || '#5D6D7E';
  }

  function handleAdd() {
    if (!addition.trim() || generating) return;
    onAddItem(addition.trim());
    setAddition('');
  }

  const planBlocks = plan?.blocks ?? [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Week</Text>
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{date}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={addition}
          onChangeText={setAddition}
          placeholder="+ 오늘 추가 (예: 미팅 3시 30분)"
          placeholderTextColor="#7D8590"
          returnKeyType="send"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addBtn, (!addition.trim() || generating) && { opacity: 0.4 }]}
          onPress={handleAdd}
          disabled={!addition.trim() || generating}
        >
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {planBlocks.length === 0 ? (
          <Text style={styles.empty}>일정이 없습니다</Text>
        ) : (
          planBlocks.map((pb) => {
            const color = blockColor(pb);
            return (
              <View key={pb.id} style={[styles.block, { borderLeftColor: color }]}>
                <View style={styles.blockLeft}>
                  <Text style={styles.timeRange}>{pb.startTime}</Text>
                  <Text style={styles.timeRange}>{pb.endTime}</Text>
                </View>
                <View style={[styles.blockBody, { backgroundColor: color + '22' }]}>
                  <View style={styles.blockHeader}>
                    <Text style={[styles.blockName, { color }]}>{pb.name}</Text>
                    {pb.isFixed && <Text style={styles.fixedBadge}>고정</Text>}
                  </View>
                  {pb.note ? (
                    <Text style={styles.blockNote}>{pb.note}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  back: { color: '#2E9BB5', fontSize: 15, fontWeight: '600' },
  dateLabel: { fontSize: 16, fontWeight: '700', color: '#E6EDF3' },
  addBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  addInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#E6EDF3',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  addBtn: {
    backgroundColor: '#2E9BB5',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1, padding: 16 },
  empty: { color: '#7D8590', textAlign: 'center', marginTop: 40, fontSize: 15 },
  block: {
    flexDirection: 'row',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  blockLeft: {
    width: 44,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#161B22',
  },
  timeRange: { fontSize: 10, color: '#7D8590', textAlign: 'center' },
  blockBody: { flex: 1, padding: 10 },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockName: { fontSize: 15, fontWeight: '700', flex: 1 },
  fixedBadge: {
    backgroundColor: '#EF4444',
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockNote: { fontSize: 12, color: '#7D8590', marginTop: 4, lineHeight: 17 },
});
