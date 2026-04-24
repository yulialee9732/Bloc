import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebase';
import { signOut } from '../services/auth';
import { exportCSV } from '../services/export';
import { useBlocks } from '../hooks/useBlocks';
import ColorThemePicker from '../components/ColorThemePicker';
import { ColorTheme } from '../../../shared/types';
import { DEFAULT_THEME } from '../constants/themes';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { blocks } = useBlocks();
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME);
  const [sound, setSound] = useState<'soft-chime' | 'piano-note' | 'game-clear'>('soft-chime');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const user = auth.currentUser;

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await signOut(); },
      },
    ]);
  }

  async function handleExport(scope: 'month' | 'all') {
    try {
      await exportCSV(blocks, scope);
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{user?.email ?? 'Unknown'}</Text>
          </View>
          <TouchableOpacity style={styles.rowBtn} onPress={handleSignOut}>
            <Text style={styles.danger}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <ColorThemePicker
            selectedThemeId={selectedTheme.id}
            onSelect={(theme: ColorTheme) => setSelectedTheme(theme)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Timer completion alerts</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#21262D', true: '#2E9BB5' }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completion Sound</Text>
          {(['soft-chime', 'piano-note', 'game-clear'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.row, styles.soundRow]}
              onPress={() => setSound(s)}
            >
              <Text style={styles.rowLabel}>
                {s === 'soft-chime' ? '🔔 Soft Chime' : s === 'piano-note' ? '🎹 Piano Note' : '🎮 Game Clear'}
              </Text>
              {sound === s && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('month')}>
            <Text style={styles.exportText}>Export This Month (.csv)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, { marginTop: 8 }]} onPress={() => handleExport('all')}>
            <Text style={styles.exportText}>Export All Time (.csv)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.version}>Bloc v1.0.0</Text>
        </View>
      </ScrollView>
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
  back: { color: '#7D8590', fontSize: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#E6EDF3' },
  scroll: { flex: 1, padding: 16 },
  section: {
    marginBottom: 28,
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D8590',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  rowBtn: { padding: 14, borderTopWidth: 1, borderTopColor: '#21262D' },
  rowLabel: { fontSize: 15, color: '#E6EDF3' },
  rowValue: { fontSize: 14, color: '#7D8590', maxWidth: 180 },
  soundRow: { paddingVertical: 12 },
  check: { color: '#2E9BB5', fontSize: 18, fontWeight: '700' },
  danger: { color: '#EF4444', fontSize: 15 },
  exportBtn: {
    margin: 14,
    marginTop: 0,
    padding: 14,
    backgroundColor: '#21262D',
    borderRadius: 10,
    alignItems: 'center',
  },
  exportText: { color: '#E6EDF3', fontSize: 15 },
  version: { textAlign: 'center', color: '#7D8590', fontSize: 13, padding: 14 },
});
