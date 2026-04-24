import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { HabitEntry, Streak } from '../../../shared/types';
import { todayString, isStreakAlive } from '../../../shared/utils';

export function useHabits(blockIds: string[]) {
  const [habits, setHabits] = useState<HabitEntry | null>(null);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});

  const today = todayString();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const habitUnsub = onSnapshot(
      doc(db, 'users', userId, 'habits', today),
      (snap) => {
        if (snap.exists()) {
          setHabits(snap.data() as HabitEntry);
        } else {
          setHabits({ date: today, entries: {}, goalHit: {} });
        }
      }
    );

    return habitUnsub;
  }, [today]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || blockIds.length === 0) return;

    const unsubs = blockIds.map((blockId) =>
      onSnapshot(doc(db, 'users', userId, 'streaks', blockId), (snap) => {
        if (snap.exists()) {
          setStreaks((prev) => ({ ...prev, [blockId]: snap.data() as Streak }));
        }
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [JSON.stringify(blockIds)]);

  async function toggleHabit(blockId: string, checked: boolean) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'habits', today);
    const current = habits ?? { date: today, entries: {}, goalHit: {} };
    await setDoc(ref, {
      ...current,
      entries: { ...current.entries, [blockId]: checked },
    });
  }

  async function markGoalHit(blockId: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const habitRef = doc(db, 'users', userId, 'habits', today);
    const current = habits ?? { date: today, entries: {}, goalHit: {} };
    await setDoc(habitRef, {
      ...current,
      entries: { ...current.entries, [blockId]: true },
      goalHit: { ...current.goalHit, [blockId]: true },
    });
    await updateStreak(userId, blockId);
  }

  async function updateStreak(userId: string, blockId: string) {
    const streakRef = doc(db, 'users', userId, 'streaks', blockId);
    const snap = await getDoc(streakRef);
    const existing = snap.exists() ? (snap.data() as Streak) : null;

    let current = 1;
    let longest = 1;

    if (existing) {
      const alive = isStreakAlive(existing.lastHitDate);
      if (existing.lastHitDate === today) return; // already counted today
      current = alive ? existing.current + 1 : 1;
      longest = Math.max(existing.longest, current);
    }

    await setDoc(streakRef, {
      blockId,
      current,
      longest,
      lastHitDate: today,
      updatedAt: serverTimestamp(),
    });
  }

  return { habits, streaks, toggleHabit, markGoalHit };
}
