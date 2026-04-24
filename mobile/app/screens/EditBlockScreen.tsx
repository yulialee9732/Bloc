import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBlocks } from '../hooks/useBlocks';
import { Block } from '../../../shared/types';
import { COLOR_THEMES, DEFAULT_THEME } from '../constants/themes';
import IconPicker from '../components/IconPicker';

export default function EditBlockScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { blocks, addBlock, updateBlock, deleteBlock } = useBlocks();
  const blockId = route.params?.blockId as string | null;
  const existing = blocks.find((b) => b.id === blockId) ?? null;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? 'star.fill');
  const [color, setColor] = useState(existing?.color ?? DEFAULT_THEME.colors[0]);
  const [durationHours, setDurationHours] = useState(
    existing ? String(Math.floor(existing.duration / 3600)) : '2'
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existing ? String(Math.floor((existing.duration % 3600) / 60)) : '0'
  );
  const [goalHours, setGoalHours] = useState(
    existing ? String(Math.floor(existing.dailyGoal / 3600)) : '1'
  );
  const [goalMinutes, setGoalMinutes] = useState(
    existing ? String(Math.floor((existing.dailyGoal % 3600) / 60)) : '0'
  );
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const isNew = !blockId;
  const activeTheme = DEFAULT_THEME;

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    const duration = parseInt(durationHours || '0') * 3600 + parseInt(durationMinutes || '0') * 60;
    const dailyGoal = parseInt(goalHours || '0') * 3600 + parseInt(goalMinutes || '0') * 60;

    try {
      if (isNew) {
        await addBlock({
          name: name.trim(),
          icon,
          color,
          duration,
          dailyGoal,
          order: blocks.length,
        });
      } else {
        await updateBlock(blockId!, { name: name.trim(), icon, color, duration, dailyGoal });
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert('Delete Block', `Delete "${name}"? This will not delete your session history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteBlock(blockId!);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isNew ? 'New Block' : 'Edit Block'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, saving && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Block name"
            placeholderTextColor="#7D8590"
            maxLength={30}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowIconPicker(true)}
          >
            <Text style={styles.iconPreview}>{icon}</Text>
            <Text style={styles.iconChangeText}>Change →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {activeTheme.colors.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, c === color && styles.colorSwatchActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={durationHours}
              onChangeText={setDurationHours}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeUnit}>h</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeUnit}>m</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Daily Goal</Text>
          <Text style={styles.sublabel}>Minimum time to mark habit as hit</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={goalHours}
              onChangeText={setGoalHours}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeUnit}>h</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={goalMinutes}
              onChangeText={setGoalMinutes}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.timeUnit}>m</Text>
          </View>
        </View>

        {!isNew && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Block</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <IconPicker
        visible={showIconPicker}
        selected={icon}
        onSelect={setIcon}
        onClose={() => setShowIconPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  cancel: { fontSize: 17, color: '#7D8590' },
  title: { fontSize: 17, fontWeight: '700', color: '#E6EDF3' },
  save: { fontSize: 17, color: '#2E9BB5', fontWeight: '600' },
  scroll: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  label: { fontSize: 13, color: '#7D8590', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sublabel: { fontSize: 12, color: '#7D8590', marginBottom: 8 },
  input: {
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 13,
    color: '#E6EDF3',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: '#21262D',
    gap: 12,
  },
  iconPreview: { fontSize: 24 },
  iconChangeText: { color: '#7D8590', fontSize: 14 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchActive: { borderWidth: 3, borderColor: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { width: 60, textAlign: 'center' },
  timeUnit: { color: '#7D8590', fontSize: 16 },
  deleteBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(194,48,48,0.1)',
    borderWidth: 1,
    borderColor: '#C23030',
    alignItems: 'center',
  },
  deleteText: { color: '#C23030', fontSize: 16, fontWeight: '600' },
});
