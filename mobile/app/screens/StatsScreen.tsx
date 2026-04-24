import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useStats } from '../hooks/useStats';
import { useBlocks } from '../hooks/useBlocks';
import WeeklyBarChart from '../components/charts/WeeklyBarChart';
import DailyBarChart from '../components/charts/DailyBarChart';
import BlockBreakdown from '../components/charts/BlockBreakdown';
import { formatSecondsShort, todayString, getDayLabel } from '../../../shared/utils';

type Tab = 'weekly' | 'monthly';

export default function StatsScreen() {
  const [tab, setTab] = useState<Tab>('weekly');
  const [selectedMonthDay, setSelectedMonthDay] = useState<string | null>(null);
  const { blocks } = useBlocks();
  const { weekSessions, monthStats, aiAnalysis, loading, getWeeklyBarData, getWeeklyStats, weekDates } = useStats();
  const today = todayString();

  const weeklyData = getWeeklyBarData({});
  const weeklyStats = getWeeklyStats();
  const topBlock = blocks.find((b) => b.id === weeklyStats.topBlockId);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'weekly' && styles.tabActive]}
            onPress={() => setTab('weekly')}
          >
            <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'monthly' && styles.tabActive]}
            onPress={() => setTab('monthly')}
          >
            <Text style={[styles.tabText, tab === 'monthly' && styles.tabTextActive]}>Monthly</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2E9BB5" />
        ) : tab === 'weekly' ? (
          <WeeklyView
            weeklyData={weeklyData}
            weeklyStats={weeklyStats}
            blocks={blocks}
            today={today}
            topBlock={topBlock}
            aiAnalysis={aiAnalysis}
          />
        ) : (
          <MonthlyView
            monthStats={monthStats}
            blocks={blocks}
            selectedDay={selectedMonthDay}
            onDaySelect={setSelectedMonthDay}
            aiAnalysis={aiAnalysis}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function WeeklyView({ weeklyData, weeklyStats, blocks, today, topBlock, aiAnalysis }: any) {
  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <WeeklyBarChart data={weeklyData} blocks={blocks} today={today} />
      </View>

      <View style={styles.summaryRow}>
        <StatCell label="Total" value={formatSecondsShort(weeklyStats.total)} />
        <StatCell
          label="Best Day"
          value={weeklyStats.bestDay?.total > 0 ? getDayLabel(weeklyStats.bestDay.date) : '—'}
        />
        <StatCell label="Top Block" value={topBlock?.name ?? '—'} />
      </View>

      <BlockBreakdown blockTotals={weeklyStats.byBlock} blocks={blocks} />

      {aiAnalysis && <AIPanel analysis={aiAnalysis} />}
    </View>
  );
}

function MonthlyView({ monthStats, blocks, selectedDay, onDaySelect, aiAnalysis }: any) {
  const totalSeconds = monthStats
    ? Object.values(monthStats.dailyTotals as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;
  const avgSeconds =
    monthStats && Object.keys(monthStats.dailyTotals).length > 0
      ? totalSeconds / Object.keys(monthStats.dailyTotals).length
      : 0;

  return (
    <View style={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Month</Text>
        {monthStats ? (
          <DailyBarChart stats={monthStats} blocks={blocks} onDayPress={onDaySelect} />
        ) : (
          <Text style={styles.empty}>No data yet this month</Text>
        )}
      </View>

      <View style={styles.summaryRow}>
        <StatCell label="Total" value={formatSecondsShort(totalSeconds)} />
        <StatCell label="Daily Avg" value={formatSecondsShort(Math.round(avgSeconds))} />
      </View>

      {selectedDay && monthStats?.blockTotals && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedDay} breakdown</Text>
          <BlockBreakdown blockTotals={monthStats.blockTotals} blocks={blocks} />
        </View>
      )}

      {aiAnalysis && <AIPanel analysis={aiAnalysis} />}
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AIPanel({ analysis }: { analysis: any }) {
  return (
    <View style={styles.aiPanel}>
      <Text style={styles.aiTitle}>✨ AI Analysis</Text>
      <Text style={styles.aiStats}>{analysis.statsLine}</Text>
      <Text style={styles.aiLine}>{analysis.trendSentence}</Text>
      <Text style={styles.aiLine}>{analysis.behavioralInsight}</Text>
      {analysis.reflectionPattern ? (
        <Text style={styles.aiReflection}>💭 {analysis.reflectionPattern}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#E6EDF3' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#21262D',
    borderRadius: 10,
    padding: 2,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  tabActive: { backgroundColor: '#2E9BB5' },
  tabText: { fontSize: 14, color: '#7D8590', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#E6EDF3', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCell: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#E6EDF3' },
  statLabel: { fontSize: 12, color: '#7D8590', marginTop: 4 },
  empty: { color: '#7D8590', fontSize: 14, textAlign: 'center', padding: 20 },
  aiPanel: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2E9BB5',
    gap: 8,
  },
  aiTitle: { fontSize: 15, fontWeight: '700', color: '#2E9BB5' },
  aiStats: { fontSize: 13, color: '#C9D1D9', fontWeight: '500' },
  aiLine: { fontSize: 14, color: '#C9D1D9', lineHeight: 20 },
  aiReflection: { fontSize: 13, color: '#7D8590', fontStyle: 'italic', lineHeight: 18 },
});
