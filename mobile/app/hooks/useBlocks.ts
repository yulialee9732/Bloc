import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Block } from '../../../shared/types';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', userId, 'blocks'),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Block));
      setBlocks(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid]);

  async function addBlock(block: Omit<Block, 'id' | 'createdAt'>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await addDoc(collection(db, 'users', userId, 'blocks'), {
      ...block,
      createdAt: serverTimestamp(),
    });
  }

  async function updateBlock(id: string, updates: Partial<Block>) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await updateDoc(doc(db, 'users', userId, 'blocks', id), updates);
  }

  async function deleteBlock(id: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await deleteDoc(doc(db, 'users', userId, 'blocks', id));
  }

  async function reorderBlocks(reordered: Block[]) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await Promise.all(
      reordered.map((b, i) =>
        updateDoc(doc(db, 'users', userId, 'blocks', b.id), { order: i })
      )
    );
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock, reorderBlocks };
}
