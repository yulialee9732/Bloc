import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { db } from '../../services/firebase';
import { Session, MonthStats, Block, AIAnalysis } from '../../../../shared/types';
import {
  getWeekDates, todayString, getDayLabel, formatSecondsShort, monthId,
} from '../../../../shared/utils';
import { generateAnalysis } from '../../services/analysis';

interface Props {
  userId: string;
}

export default function MacStatsScreen({ userId }: Props) {
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = todayString();
  const weekDates = getWeekDates();
  const currentMonth = monthId();

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'users', userId, 'blocks'), orderBy('order')),
      (snap) => setBlocks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Block)))
    );
    return unsub;
  }, [userId]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', userId, 'sessions'),
      where('date', '>=', weekDates[0]),
      where('date', '<=', weekDates[6]),
      orderBy('date')
    );
    return onSnapshot(q, (snap) => {
      setWeekSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session)));
    });
  }, [userId]);

  useEffect(() => {
    return onSnapshot(doc(db, 'users', userId, 'stats', currentMonth), (snap) => {
      if (snap.exists()) setMonthStats(snap.data() as MonthStats);
    });
  }, [userId, currentMonth]);

  useEffect(() => {
    return onSnapshot(doc(db, 'users', userId, 'aiAnalysis', 'latest'), (snap) => {
      if (snap.exists()) setAiAnalysis(snap.data() as AIAnalysis);
    });
  }, [userId]);

  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const weeklyChartData = weekDates.map((date) => {
    const daySessions = weekSessions.filter((s) => s.date === date);
    const total = daySessions.reduce((sum, s) => sum + s.elapsed, 0);
    return { date, label: getDayLabel(date), totalHours: +(total / 3600).toFixed(1), total };
  });

  const totalWeek = weekSessions.reduce((s, x) => s + x.elapsed, 0);
  const bestDay = weeklyChartData.reduce((a, b) => (b.total > a.total ? b : a), weeklyChartData[0]);

  const byBlock: Record<string, number> = {};
  weekSessions.forEach((s) => { byBlock[s.blockId] = (byBlock[s.blockId] ?? 0) + s.elapsed; });
  const topBlockId = Object.entries(byBlock).sort(([, a], [, b]) => b - a)[0]?.[0];

  const monthlyChartData = monthStats
    ? Object.entries(monthStats.dailyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
          date, label: parseInt(date.split('-')[2], 10).toString(),
          totalHours: +(total / 3600).toFixed(1),
        }))
    : [];

  const totalMonth = monthStats
    ? Object.values(monthStats.dailyTotals).reduce((a, b) => a + b, 0)
    : 0;

  async function refreshAnalysis() {
    setRefreshing(true);
    try { await generateAnalysis(blocks, userId); } finally { setRefreshing(false); }
  }

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h2 style={styles.title}>Stats</h2>
        <div style={styles.tabs}>
          {(['weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              style={{ ...styles.tabBtn, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.left}>
          {tab === 'weekly' ? (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>This Week</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyChartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="label" tick={{ fill: '#7D8590', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#7D8590', fontSize: 11 }} unit="h" />
                    <Tooltip
                      contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 8 }}
                      labelStyle={{ color: '#E6EDF3' }}
                      formatter={(v: number) => [`${v}h`, 'Focus']}
                    />
                    <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                      {weeklyChartData.map((entry) => (
                        <Cell
                          key={entry.date}
                          fill={entry.date === today ? '#2E9BB5' : '#1A6B8A'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={styles.statRow}>
                <StatCard label="Total" value={formatSecondsShort(totalWeek)} />
                <StatCard label="Best Day" value={bestDay?.total > 0 ? bestDay.label : '—'} />
                <StatCard label="Top Block" value={blockMap[topBlockId]?.name ?? '—'} />
              </div>
              <BlockBreakdownMac byBlock={byBlock} blocks={blocks} />
            </>
          ) : (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>This Month</div>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthlyChartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                      <XAxis dataKey="label" tick={{ fill: '#7D8590', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#7D8590', fontSize: 11 }} unit="h" />
                      <Tooltip
                        contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: 8 }}
                        labelStyle={{ color: '#E6EDF3' }}
                        formatter={(v: number) => [`${v}h`, 'Focus']}
                      />
                      <Bar dataKey="totalHours" fill="#1A6B8A" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#7D8590', textAlign: 'center', padding: 40 }}>No data yet</p>
                )}
              </div>
              <div style={styles.statRow}>
                <StatCard label="Total" value={formatSecondsShort(totalMonth)} />
                <StatCard
                  label="Daily Avg"
                  value={monthlyChartData.length > 0
                    ? formatSecondsShort(Math.round(totalMonth / monthlyChartData.length))
                    : '—'}
                />
              </div>
            </>
          )}
        </div>

        <div style={styles.right}>
          <div style={styles.aiPanel}>
            <div style={styles.aiHeader}>
              <span style={styles.aiTitle}>✨ AI Analysis</span>
              <button
                style={styles.refreshBtn}
                onClick={refreshAnalysis}
                disabled={refreshing || blocks.length === 0}
              >
                {refreshing ? '...' : 'Refresh'}
              </button>
            </div>
            {aiAnalysis ? (
              <div style={styles.aiContent}>
                <p style={styles.aiStats}>{aiAnalysis.statsLine}</p>
                <p style={styles.aiLine}>{aiAnalysis.trendSentence}</p>
                <p style={styles.aiLine}>{aiAnalysis.behavioralInsight}</p>
                {aiAnalysis.reflectionPattern && (
                  <p style={styles.aiReflection}>💭 {aiAnalysis.reflectionPattern}</p>
                )}
              </div>
            ) : (
              <p style={{ color: '#7D8590', fontSize: 13, padding: '8px 0' }}>
                No analysis yet. Complete sessions to unlock insights.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1, background: '#161B22', borderRadius: 12, padding: '14px 16px',
      border: '1px solid #21262D', textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#7D8590', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function BlockBreakdownMac({ byBlock, blocks }: { byBlock: Record<string, number>; blocks: Block[] }) {
  const total = Object.values(byBlock).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  return (
    <div style={{ background: '#161B22', borderRadius: 12, padding: 16, border: '1px solid #21262D' }}>
      <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', background: '#21262D' }}>
        {blocks.filter((b) => byBlock[b.id] > 0).map((b) => (
          <div key={b.id} style={{ width: `${(byBlock[b.id] / total) * 100}%`, background: b.color }} />
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {blocks.filter((b) => byBlock[b.id] > 0).map((b) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: b.color }} />
            <span style={{ flex: 1, fontSize: 13, color: '#E6EDF3' }}>{b.name}</span>
            <span style={{ fontSize: 13, color: '#7D8590' }}>{formatSecondsShort(byBlock[b.id])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { flex: 1, overflow: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 800, color: '#E6EDF3', margin: 0 },
  tabs: { display: 'flex', background: '#21262D', borderRadius: 10, padding: 2, gap: 2 },
  tabBtn: {
    padding: '6px 16px', borderRadius: 8, border: 'none',
    background: 'transparent', color: '#7D8590', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  tabActive: { background: '#2E9BB5', color: '#fff' },
  body: { display: 'flex', gap: 20, flex: 1, minHeight: 0 },
  left: { flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' },
  right: { width: 280, display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: '#161B22', borderRadius: 14, padding: 16, border: '1px solid #21262D' },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#E6EDF3', marginBottom: 12 },
  statRow: { display: 'flex', gap: 10 },
  aiPanel: {
    background: '#161B22', borderRadius: 14, padding: 16,
    border: '1px solid #2E9BB5', display: 'flex', flexDirection: 'column', gap: 10,
  },
  aiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  aiTitle: { fontSize: 14, fontWeight: 700, color: '#2E9BB5' },
  refreshBtn: {
    fontSize: 12, color: '#7D8590', background: '#21262D',
    border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
  },
  aiContent: { display: 'flex', flexDirection: 'column', gap: 8 },
  aiStats: { fontSize: 13, color: '#C9D1D9', fontWeight: 600, margin: 0 },
  aiLine: { fontSize: 13, color: '#C9D1D9', lineHeight: 1.5, margin: 0 },
  aiReflection: { fontSize: 12, color: '#7D8590', fontStyle: 'italic', lineHeight: 1.5, margin: 0 },
};
