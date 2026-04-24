import { useState, useEffect, useRef, useCallback } from 'react';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { TimerState } from '../../../shared/types';

export function useTimer(blockId: string) {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<TimerState['status']>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || !blockId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId, 'timerState', blockId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as TimerState;
        setStatus(data.status);
        if (data.status === 'running' && data.startedAt) {
          const startMs = (data.startedAt as Timestamp).toMillis();
          baseElapsedRef.current = data.elapsed;
          startedAtRef.current = startMs;
          const tick = () => {
            const now = Date.now();
            setElapsed(baseElapsedRef.current + Math.floor((now - startedAtRef.current!) / 1000));
          };
          tick();
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(tick, 1000);
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setElapsed(data.elapsed);
          baseElapsedRef.current = data.elapsed;
          startedAtRef.current = null;
        }
      }
    );

    return () => {
      unsubscribe();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [blockId]);

  const writeState = useCallback(
    async (newStatus: TimerState['status'], newElapsed: number) => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      await setDoc(doc(db, 'users', userId, 'timerState', blockId), {
        status: newStatus,
        elapsed: newElapsed,
        startedAt: newStatus === 'running' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
    },
    [blockId]
  );

  const start = useCallback(() => writeState('running', elapsed), [elapsed, writeState]);
  const pause = useCallback(() => writeState('paused', elapsed), [elapsed, writeState]);
  const reset = useCallback(() => writeState('idle', 0), [writeState]);

  return { elapsed, status, start, pause, reset };
}

export function useActiveBlock() {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId, 'meta', 'activeBlock'),
      (snap) => {
        if (snap.exists()) {
          setActiveBlockId(snap.data().blockId ?? null);
        }
      }
    );
    return unsubscribe;
  }, []);

  async function setActiveBlock(blockId: string | null) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await setDoc(doc(db, 'users', userId, 'meta', 'activeBlock'), {
      blockId,
      updatedAt: serverTimestamp(),
    });
  }

  return { activeBlockId, setActiveBlock };
}
