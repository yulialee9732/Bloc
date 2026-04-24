import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { SF_SYMBOLS } from '../constants/defaultBlocks';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export default function IconPicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? SF_SYMBOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : SF_SYMBOLS;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Icon</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.done}>Done</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Search icons..."
          placeholderTextColor="#7D8590"
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filtered}
          numColumns={6}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, item === selected && styles.itemSelected]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={styles.iconText}>{item.split('.')[0].slice(0, 2)}</Text>
              <Text style={styles.iconName} numberOfLines={1}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.grid}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#E6EDF3' },
  done: { fontSize: 16, color: '#2E9BB5', fontWeight: '600' },
  search: {
    margin: 16,
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 12,
    color: '#E6EDF3',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  grid: { padding: 8 },
  item: {
    flex: 1,
    margin: 4,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#161B22',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  itemSelected: { borderColor: '#2E9BB5', backgroundColor: 'rgba(46,155,181,0.1)' },
  iconText: { fontSize: 20, marginBottom: 4 },
  iconName: { fontSize: 8, color: '#7D8590', textAlign: 'center' },
});
