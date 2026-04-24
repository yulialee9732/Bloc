import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Block, TimerState, HabitEntry, Streak } from '../../../../shared/types';
import {
  formatSeconds,
  hexToRgba,
  ringProgress,
  getWeekDates,
  todayString,
  getDayLabel,
} from '../../../../shared/utils';
import { burstAtPosition, fullscreenFanfare } from '../../services/confetti';
import { playSingleRingSound, playAllRingsFanfare } from '../../services/sound';

interface Props {
  userId: string;
}

const RING_SIZE = 200;
const STROKE = 12;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MacHomeScreen({ userId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [habits, setHabits] = useState<HabitEntry | null>(null);
  const [streaks, setStreaks] = useState<Record<string, Streak>>({});
  const [completedRings, setCompletedRings] = useState<Set<string>>(new Set());
  const ringRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const today = todayString();
  const weekDates = getWeekDates();

  useEffect(() => {
    const blocksQ = query(collection(db, 'users', userId, 'blocks'), orderBy('order'));
    return onSnapshot(blocksQ, (snap) => {
      setBlocks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Block)));
    });
  }, [userId]);

  useEffect(() => {
    if (blocks.length === 0) return;
    const unsubs = blocks.map((block) =>
      onSnapshot(doc(db, 'users', userId, 'timerState', block.id), (snap) => {
        if (snap.exists()) {
          setTimerStates((prev) => ({ ...prev, [block.id]: snap.data() as TimerState }));
        }
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [userId, blocks.length]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', userId, 'habits', today), (snap) => {
      setHabits(snap.exists() ? (snap.data() as HabitEntry) : { date: today, entries: {}, goalHit: {} });
    });
    return unsub;
  }, [userId, today]);

  useEffect(() => {
    if (blocks.length === 0) return;
    const unsubs = blocks.map((block) =>
      onSnapshot(doc(db, 'users', userId, 'streaks', block.id), (snap) => {
        if (snap.exists()) setStreaks((prev) => ({ ...prev, [block.id]: snap.data() as Streak }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [userId, blocks.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newElapsed: Record<string, number> = {};
      for (const [blockId, state] of Object.entries(timerStates)) {
        if (state.status === 'running' && state.startedAt) {
          const startMs = (state.startedAt as Timestamp).toMillis();
          newElapsed[blockId] = state.elapsed + Math.floor((Date.now() - startMs) / 1000);
        } else {
          newElapsed[blockId] = state.elapsed;
        }
      }

      setElapsed((prev) => {
        for (const block of blocks) {
          const prev_ = prev[block.id] ?? 0;
          const next = newElapsed[block.id] ?? 0;
          const prevProg = prev_ >= block.dailyGoal;
          const nextProg = next >= block.dailyGoal;
          if (!prevProg && nextProg && !completedRings.has(block.id)) {
            setCompletedRings((s) => new Set([...s, block.id]));
            playSingleRingSound();
            const el = ringRefs.current[block.id];
            if (el) {
              const rect = el.getBoundingClientRect();
              burstAtPosition(rect.left + rect.width / 2, rect.top + rect.height / 2, [block.color], window.innerWidth, window.innerHeight);
            }
            const allDone = blocks.every((b) => (newElapsed[b.id] ?? 0) >= b.dailyGoal);
            if (allDone) {
              setTimeout(() => {
                fullscreenFanfare(blocks.map((b) => b.color));
                playAllRingsFanfare();
              }, 500);
            }
          }
        }
        return newElapsed;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStates, blocks, completedRings]);

  async function toggleBlock(blockId: string) {
    const state = timerStates[blockId];
    const current = elapsed[blockId] ?? 0;
    const isRunning = state?.status === 'running';

    if (!isRunning) {
      for (const [bId, bState] of Object.entries(timerStates)) {
        if (bId !== blockId && bState.status === 'running') {
          await setDoc(doc(db, 'users', userId, 'timerState', bId), {
            status: 'paused', elapsed: elapsed[bId] ?? bState.elapsed,
            startedAt: null, updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await setDoc(doc(db, 'users', userId, 'timerState', blockId), {
      status: isRunning ? 'paused' : 'running',
      elapsed: current,
      startedAt: isRunning ? null : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return (
    <div style={styles.root}>
      <div style={styles.circlesRow}>
        {blocks.map((block) => {
          const elapsedSec = elapsed[block.id] ?? 0;
          const progress = ringProgress(elapsedSec, block.dailyGoal);
          const offset = CIRCUMFERENCE * (1 - progress);
          const isRunning = timerStates[block.id]?.status === 'running';
          const streak = streaks[block.id];

          return (
            <div
              key={block.id}
              ref={(el) => { ringRefs.current[block.id] = el; }}
              style={styles.blockCard}
              onClick={() => toggleBlock(block.id)}
              title={block.name}
            >
              <svg width={RING_SIZE} height={RING_SIZE} style={{ cursor: 'pointer' }}>
                <circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                  stroke={hexToRgba(block.color, 0.2)} strokeWidth={STROKE} fill="none"
                />
                <circle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
                  stroke={block.color} strokeWidth={STROKE} fill="none"
                  strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <text x={RING_SIZE / 2} y={RING_SIZE / 2 - 18} textAnchor="middle" style={{ fontSize: 28 }}>
                  {block.icon.slice(0, 2)}
                </text>
                <text
                  x={RING_SIZE / 2} y={RING_SIZE / 2 + 10}
                  textAnchor="middle"
                  fill="#E6EDF3"
                  fontSize={13}
                  fontWeight={700}
                  fontFamily="-apple-system"
                >
                  {block.name}
                </text>
                <text
                  x={RING_SIZE / 2} y={RING_SIZE / 2 + 30}
                  textAnchor="middle"
                  fill={isRunning ? block.color : '#7D8590'}
                  fontSize={14}
                  fontFamily="-apple-system, monospace"
                  fontWeight={600}
                >
                  {formatSeconds(elapsedSec)}
                </text>
                <circle
                  cx={RING_SIZE / 2} cy={RING_SIZE - 20} r={14}
                  fill={isRunning ? block.color : '#21262D'}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={RING_SIZE / 2} y={RING_SIZE - 14}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={12}
                >
                  {isRunning ? '⏸' : '▶'}
                </text>
              </svg>
              {streak && streak.current > 0 && (
                <div style={{ ...styles.streakBadge, borderColor: block.color }}>
                  🔥 {streak.current}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.habitSection}>
        <div style={styles.habitHeader}>
          <span style={styles.habitTitle}>Weekly Habits</span>
          <span style={styles.statsLink} onClick={() => {}}>Stats & analysis →</span>
        </div>
        <HabitTable
          blocks={blocks}
          habits={habits}
          streaks={streaks}
          weekDates={weekDates}
          today={today}
          userId={userId}
        />
      </div>
    </div>
  );
}

function HabitTable({
  blocks, habits, streaks, weekDates, today, userId,
}: {
  blocks: Block[];
  habits: HabitEntry | null;
  streaks: Record<string, Streak>;
  weekDates: string[];
  today: string;
  userId: string;
}) {
  async function toggle(blockId: string, date: string, checked: boolean) {
    if (date !== today) return;
    const ref = doc(db, 'users', userId, 'habits', today);
    const current = habits ?? { date: today, entries: {}, goalHit: {} };
    await setDoc(ref, {
      ...current,
      entries: { ...current.entries, [blockId]: checked },
    });
  }

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th} />
          {weekDates.map((d) => (
            <th key={d} style={{ ...styles.th, color: d === today ? '#2E9BB5' : '#7D8590' }}>
              <div>{getDayLabel(d)}</div>
              <div style={{ fontSize: 11 }}>{parseInt(d.split('-')[2], 10)}</div>
            </th>
          ))}
          <th style={styles.th}>Streak</th>
        </tr>
      </thead>
      <tbody>
        {blocks.map((block) => (
          <tr key={block.id}>
            <td style={styles.td}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: block.color }} />
                <span style={{ fontSize: 13, color: '#C9D1D9' }}>{block.name}</span>
              </div>
            </td>
            {weekDates.map((d) => {
              const checked = d === today ? habits?.entries[block.id] ?? false : habits?.goalHit[block.id] ?? false;
              return (
                <td key={d} style={styles.td}>
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={(e) => toggle(block.id, d, e.target.checked)}
                    disabled={d !== today}
                    style={{
                      width: 18, height: 18, cursor: d === today ? 'pointer' : 'default',
                      accentColor: block.color,
                    }}
                  />
                </td>
              );
            })}
            <td style={styles.td}>
              {(streaks[block.id]?.current ?? 0) > 0 && (
                <span style={{ color: '#FF8C00', fontSize: 13, fontWeight: 700 }}>
                  🔥 {streaks[block.id].current}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    overflow: 'auto',
    padding: 32,
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  circlesRow: {
    display: 'flex',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  blockCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    position: 'relative',
  },
  streakBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#FF8C00',
    background: 'rgba(255,140,0,0.1)',
    border: '1px solid',
    borderRadius: 10,
    padding: '2px 8px',
  },
  habitSection: {
    background: '#161B22',
    borderRadius: 16,
    border: '1px solid #21262D',
    padding: 20,
  },
  habitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitTitle: { fontSize: 15, fontWeight: 700, color: '#E6EDF3' },
  statsLink: {
    fontSize: 13,
    color: '#2E9BB5',
    cursor: 'pointer',
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '6px 12px',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#7D8590',
    borderBottom: '1px solid #21262D',
  },
  td: {
    padding: '8px 12px',
    textAlign: 'center',
    borderBottom: '1px solid #21262D',
  },
};
