import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { COLOR_THEMES } from '../constants/themes';
import { ColorTheme } from '../../../shared/types';

interface Props {
  selectedThemeId: string;
  onSelect: (theme: ColorTheme) => void;
}

export default function ColorThemePicker({ selectedThemeId, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Color Theme</Text>
      <FlatList
        horizontal
        data={COLOR_THEMES}
        keyExtractor={(t) => t.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.themeCard, item.id === selectedThemeId && styles.themeCardActive]}
            onPress={() => onSelect(item)}
          >
            <View style={styles.swatchRow}>
              {item.colors.map((c, i) => (
                <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
              ))}
            </View>
            <Text style={[styles.themeName, item.id === selectedThemeId && styles.themeNameActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontSize: 15, fontWeight: '600', color: '#E6EDF3', marginBottom: 10, marginLeft: 16 },
  list: { paddingHorizontal: 12 },
  themeCard: {
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#161B22',
    borderWidth: 1.5,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  themeCardActive: { borderColor: '#2E9BB5' },
  swatchRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  themeName: { fontSize: 12, color: '#7D8590' },
  themeNameActive: { color: '#2E9BB5', fontWeight: '600' },
});
