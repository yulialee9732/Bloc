import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Session, MonthStats, AIAnalysis } from '../../../shared/types';
import { monthId, getWeekDates, todayString } from '../../../shared/utils';

export function useStats() {
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const today = todayString();
  const weekDates = getWeekDates();
  const currentMonth = monthId();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    const sessionsQ = query(
      collection(db, 'users', userId, 'sessions'),
      where('date', '>=', weekStart),
      where('date', '<=', weekEnd),
      orderBy('date', 'asc')
    );

    const sessionUnsub = onSnapshot(sessionsQ, (snap) => {
      setWeekSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session)));
      setLoading(false);
    });

    const monthUnsub = onSnapshot(
      doc(db, 'users', userId, 'stats', currentMonth),
      (snap) => {
        if (snap.exists()) setMonthStats(snap.data() as MonthStats);
      }
    );

    const analysisUnsub = onSnapshot(
      doc(db, 'users', userId, 'aiAnalysis', 'latest'),
      (snap) => {
        if (snap.exists()) setAiAnalysis(snap.data() as AIAnalysis);
      }
    );

    return () => {
      sessionUnsub();
      monthUnsub();
      analysisUnsub();
    };
  }, []);

  function getWeeklyBarData(blockColors: Record<string, string>) {
    return weekDates.map((date) => {
      const daySessions = weekSessions.filter((s) => s.date === date);
      const total = daySessions.reduce((sum, s) => sum + s.elapsed, 0);
      return { date, total, sessions: daySessions };
    });
  }

  function getWeeklyStats() {
    const total = weekSessions.reduce((sum, s) => sum + s.elapsed, 0);
    const byDay = weekDates.map((date) => ({
      date,
      total: weekSessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.elapsed, 0),
    }));
    const bestDay = byDay.reduce((best, d) => (d.total > best.total ? d : best), byDay[0]);
    const byBlock: Record<string, number> = {};
    weekSessions.forEach((s) => {
      byBlock[s.blockId] = (byBlock[s.blockId] ?? 0) + s.elapsed;
    });
    const topBlockId = Object.entries(byBlock).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
    return { total, bestDay, topBlockId, byBlock };
  }

  return { weekSessions, monthStats, aiAnalysis, loading, getWeeklyBarData, getWeeklyStats, weekDates };
}
