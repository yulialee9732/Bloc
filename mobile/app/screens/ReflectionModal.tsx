import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Block, Streak } from '../../../shared/types';
import { formatSecondsShort } from '../../../shared/utils';
import StreakBadge from '../components/StreakBadge';

interface Props {
  visible: boolean;
  block: Block | null;
  elapsed: number;
  sessionId: string | null;
  streak: Streak | null;
  onClose: () => void;
}

const STREAK_MILESTONES = [3, 7, 14, 30];

export default function ReflectionModal({ visible, block, elapsed, sessionId, streak, onClose }: Props) {
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  const isMilestone = streak && STREAK_MILESTONES.includes(streak.current);

  async function handleSave() {
    if (!sessionId || !auth.currentUser) { onClose(); return; }
    setSaving(true);
    try {
      await updateDoc(
        doc(db, 'users', auth.currentUser.uid, 'sessions', sessionId),
        { reflection: reflection.trim() }
      );
    } finally {
      setSaving(false);
      setReflection('');
      onClose();
    }
  }

  function handleDismiss() {
    setReflection('');
    onClose();
  }

  if (!block) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={[styles.colorBar, { backgroundColor: block.color }]} />

          <Text style={styles.blockName}>{block.name} complete</Text>
          <Text style={styles.time}>{formatSecondsShort(elapsed)}</Text>

          {streak && (
            <View style={styles.streakRow}>
              <StreakBadge count={streak.current} />
              {isMilestone && (
                <Text style={styles.milestone}>
                  🎉 {streak.current}-day milestone!
                </Text>
              )}
            </View>
          )}

          <Text style={styles.prompt}>How did this session go?</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional reflection..."
            placeholderTextColor="#7D8590"
            value={reflection}
            onChangeText={setReflection}
            multiline
            numberOfLines={3}
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleDismiss}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: block.color }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#30363D',
    alignSelf: 'center',
    marginBottom: 8,
  },
  colorBar: { height: 4, borderRadius: 2 },
  blockName: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  time: { fontSize: 32, fontWeight: '800', color: '#E6EDF3', fontVariant: ['tabular-nums'] },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  milestone: { fontSize: 14, color: '#FF8C00', fontWeight: '600' },
  prompt: { fontSize: 16, color: '#C9D1D9', fontWeight: '500', marginTop: 4 },
  input: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 14,
    color: '#E6EDF3',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#30363D',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  skipBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#21262D',
    alignItems: 'center',
  },
  skipText: { color: '#7D8590', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
