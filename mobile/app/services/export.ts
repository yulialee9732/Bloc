import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Session, Block } from '../../../shared/types';
import { buildCSV } from '../../../shared/utils';

export async function exportCSV(blocks: Block[], scope: 'month' | 'all' = 'month'): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  let sessionsQuery;
  if (scope === 'month') {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    sessionsQuery = query(
      collection(db, 'users', userId, 'sessions'),
      where('date', '>=', monthStart),
      orderBy('date', 'asc')
    );
  } else {
    sessionsQuery = query(
      collection(db, 'users', userId, 'sessions'),
      orderBy('date', 'asc')
    );
  }

  const snap = await getDocs(sessionsQuery);
  const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));

  const csv = buildCSV(sessions, blocks);
  const filename = scope === 'month'
    ? `bloc_export_${new Date().toISOString().slice(0, 7)}.csv`
    : `bloc_export_all_${new Date().toISOString().split('T')[0]}.csv`;

  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Bloc Data',
      UTI: 'public.comma-separated-values-text',
    });
  }
}
