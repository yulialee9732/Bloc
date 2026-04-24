import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { WeekPlan, Block, PlanDay, PlanBlock } from '../../../../shared/types';
import { weekId, getWeekDates, todayString, getDayLabel } from '../../../../shared/utils';
import { generateWeeklyPlan, replanDay } from '../../services/planner';

interface Props {
  userId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  focus: '#2E9BB5', meal: '#6B7280', travel: '#D97706', event: '#EF4444', rest: '#374151',
};

export default function MacPlannerScreen({ userId }: Props) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayString());
  const [dailyAdd, setDailyAdd] = useState('');
  const weekDates = getWeekDates();
  const currentWeekId = weekId();
  const today = todayString();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'users', userId, 'blocks'), orderBy('order')),
      (snap) => setBlocks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Block)))
    );
    return unsub;
  }, [userId]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'users', userId, 'plans', currentWeekId),
      (snap) => { if (snap.exists()) setWeekPlan(snap.data() as WeekPlan); }
    );
    return unsub;
  }, [userId, currentWeekId]);

  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  function getBlockColor(pb: PlanBlock): string {
    if (pb.category === 'focus' && pb.blockId) return blockMap[pb.blockId]?.color ?? '#2E9BB5';
    return pb.color || CATEGORY_COLORS[pb.category] || '#5D6D7E';
  }

  async function handleGenerate() {
    if (!rawInput.trim() || generating) return;
    setGenerating(true);
    try {
      const plan = await generateWeeklyPlan(rawInput, blocks, weekDates[0], userId);
      setWeekPlan(plan);
      setRawInput('');
    } catch (e) {
      console.error('Plan gen failed', e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleDailyAdd() {
    if (!dailyAdd.trim() || !weekPlan || !selectedDate || generating) return;
    setGenerating(true);
    try {
      const updated = await replanDay(selectedDate, dailyAdd, weekPlan, blocks, userId);
      setWeekPlan((prev) => prev ? { ...prev, days: { ...prev.days, [selectedDate]: updated } } : prev);
      setDailyAdd('');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={styles.root}>
      {!weekPlan ? (
        <div style={styles.inputPanel}>
          <h2 style={styles.inputTitle}>이번 주 계획을 입력하세요</h2>
          <p style={styles.inputSubtitle}>
            할 일, 약속, 기상/취침 시간, 고정 일정을 자유롭게 입력하면 AI가 주간 계획을 만들어 드립니다.
          </p>
          <textarea
            style={styles.textarea}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={'이번 주 할일:\n- React 챕터 3, 4 끝내기 (각 2시간)\n- 수요일 치과 2시\n기상 6:00, 취침 23:00'}
            rows={10}
          />
          <button
            style={{ ...styles.generateBtn, opacity: generating || !rawInput.trim() ? 0.5 : 1 }}
            onClick={handleGenerate}
            disabled={generating || !rawInput.trim()}
          >
            {generating ? '생성 중...' : '생성 ✨'}
          </button>
        </div>
      ) : (
        <div style={styles.calendarLayout}>
          <div style={styles.weekPanel}>
            <div style={styles.weekToolbar}>
              <span style={{ color: '#7D8590', fontSize: 13 }}>Week of {weekDates[0]}</span>
              <button style={styles.resetBtn} onClick={() => setWeekPlan(null)}>Re-generate</button>
            </div>
            <div style={styles.weekGrid}>
              {weekDates.map((date) => {
                const day = weekPlan.days[date];
                const isToday = date === today;
                const isSelected = date === selectedDate;
                return (
                  <div
                    key={date}
                    style={{
                      ...styles.dayCol,
                      ...(isToday ? styles.dayColToday : {}),
                      ...(isSelected ? styles.dayColSelected : {}),
                    }}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div style={styles.dayColHeader}>
                      <span style={{ color: isToday ? '#2E9BB5' : '#7D8590', fontSize: 11, fontWeight: 700 }}>
                        {getDayLabel(date)}
                      </span>
                      <span style={{ color: isToday ? '#2E9BB5' : '#E6EDF3', fontSize: 18, fontWeight: 700 }}>
                        {parseInt(date.split('-')[2], 10)}
                      </span>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {(day?.blocks ?? []).map((pb) => (
                        <div
                          key={pb.id}
                          style={{
                            padding: '4px 6px', borderRadius: 5, marginBottom: 3,
                            background: getBlockColor(pb) + '33',
                            borderLeft: `3px solid ${getBlockColor(pb)}`,
                          }}
                        >
                          <div style={{ fontSize: 9, color: '#7D8590' }}>{pb.startTime}–{pb.endTime}</div>
                          <div style={{ fontSize: 11, color: '#E6EDF3', fontWeight: 600 }}>{pb.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div style={styles.dayDetail}>
              <div style={styles.dayDetailHeader}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#E6EDF3' }}>{selectedDate}</span>
              </div>
              <div style={styles.addBar}>
                <input
                  style={styles.addInput}
                  value={dailyAdd}
                  onChange={(e) => setDailyAdd(e.target.value)}
                  placeholder="+ 오늘 추가 (예: 미팅 3시 30분)"
                  onKeyDown={(e) => e.key === 'Enter' && handleDailyAdd()}
                />
                <button
                  style={{ ...styles.addBtn, opacity: !dailyAdd.trim() || generating ? 0.4 : 1 }}
                  onClick={handleDailyAdd}
                  disabled={!dailyAdd.trim() || generating}
                >
                  추가
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px 16px' }}>
                {(weekPlan.days[selectedDate]?.blocks ?? []).map((pb) => {
                  const color = getBlockColor(pb);
                  return (
                    <div key={pb.id} style={{ display: 'flex', marginBottom: 10, borderLeft: `3px solid ${color}`, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: 48, padding: '10px 4px', textAlign: 'center', background: '#161B22' }}>
                        <div style={{ fontSize: 10, color: '#7D8590' }}>{pb.startTime}</div>
                        <div style={{ fontSize: 10, color: '#7D8590' }}>{pb.endTime}</div>
                      </div>
                      <div style={{ flex: 1, padding: 10, background: color + '22' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color }}>{pb.name}</span>
                          {pb.isFixed && (
                            <span style={{ background: '#EF4444', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 4 }}>고정</span>
                          )}
                        </div>
                        {pb.note && <div style={{ fontSize: 12, color: '#7D8590', marginTop: 4 }}>{pb.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  inputPanel: {
    flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 16,
    maxWidth: 680, margin: '0 auto', width: '100%',
  },
  inputTitle: { fontSize: 22, fontWeight: 700, color: '#E6EDF3', margin: 0 },
  inputSubtitle: { fontSize: 14, color: '#7D8590', lineHeight: 1.6, margin: 0 },
  textarea: {
    flex: 1, background: '#161B22', border: '1px solid #21262D', borderRadius: 12,
    padding: 16, color: '#E6EDF3', fontSize: 14, resize: 'none', lineHeight: 1.7,
    outline: 'none', fontFamily: '-apple-system',
  },
  generateBtn: {
    background: '#2E9BB5', border: 'none', borderRadius: 12, padding: '14px',
    color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
  },
  calendarLayout: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  weekPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  weekToolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', borderBottom: '1px solid #21262D',
  },
  resetBtn: {
    background: 'transparent', border: '1px solid #21262D', borderRadius: 8,
    color: '#2E9BB5', fontSize: 13, padding: '4px 12px', cursor: 'pointer',
  },
  weekGrid: {
    display: 'flex', flex: 1, gap: 1, background: '#21262D',
    overflow: 'hidden',
  },
  dayCol: {
    flex: 1, background: '#0D1117', padding: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden',
    minHeight: 200,
  },
  dayColToday: { background: '#0D1520' },
  dayColSelected: { background: '#161B22' },
  dayColHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingBottom: 6, borderBottom: '1px solid #21262D' },
  dayDetail: {
    height: 320, borderTop: '1px solid #21262D', display: 'flex', flexDirection: 'column',
    background: '#0D1117',
  },
  dayDetailHeader: { padding: '12px 16px', borderBottom: '1px solid #21262D' },
  addBar: { display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #21262D' },
  addInput: {
    flex: 1, background: '#161B22', border: '1px solid #21262D', borderRadius: 8,
    padding: '8px 12px', color: '#E6EDF3', fontSize: 13, outline: 'none',
  },
  addBtn: {
    background: '#2E9BB5', border: 'none', borderRadius: 8, padding: '0 14px',
    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
};
