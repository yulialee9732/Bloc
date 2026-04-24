import Anthropic from '@anthropic-ai/sdk';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Session, MonthStats, Block, AIAnalysis } from '../../../shared/types';
import { monthId, formatSecondsShort, getDayLabel } from '../../../shared/utils';

const client = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY });

export async function generateAnalysis(blocks: Block[]): Promise<AIAnalysis> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const now = new Date();
  const months = [monthId(now), monthId(new Date(now.getFullYear(), now.getMonth() - 1, 1))];

  const [statsSnaps, recentSessionsSnap] = await Promise.all([
    Promise.all(months.map((m) => getDocs(collection(db, 'users', userId, 'stats')))),
    getDocs(
      query(
        collection(db, 'users', userId, 'sessions'),
        where('date', '>=', getDateDaysAgo(14)),
        orderBy('date', 'desc')
      )
    ),
  ]);

  const currentMonthStats = (
    await getDocs(
      query(collection(db, 'users', userId, 'stats'), where('month', 'in', months))
    )
  ).docs.map((d) => d.data() as MonthStats);

  const recentSessions = recentSessionsSnap.docs.map((d) => d.data() as Session);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const dataSummary = buildDataSummary(currentMonthStats, recentSessions, blockMap, blocks);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `You are a productivity coach analyzing focus timer data. Return EXACTLY 4 lines:
LINE1: stats line — "Best day: [day] · Total this month: [Xh Ym] · Top block: [name]"
LINE2: trend observation — one sentence about week-over-week or day pattern
LINE3: behavioral insight — one actionable sentence about behavior patterns
LINE4: reflection pattern — one sentence from session notes (if no reflections, say "Add session reflections to unlock pattern insights")
Be specific, concise, encouraging. No markdown, no extra text.`,
    messages: [{ role: 'user', content: dataSummary }],
  });

  const lines = (message.content[0] as { text: string }).text.trim().split('\n');
  const analysis: AIAnalysis = {
    statsLine: lines[0] ?? '',
    trendSentence: lines[1] ?? '',
    behavioralInsight: lines[2] ?? '',
    reflectionPattern: lines[3] ?? '',
    generatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(db, 'users', userId, 'aiAnalysis', 'latest'), analysis);
  return analysis;
}

function buildDataSummary(
  monthStats: MonthStats[],
  recentSessions: Session[],
  blockMap: Record<string, Block>,
  blocks: Block[]
): string {
  const lines: string[] = ['FOCUS DATA SUMMARY:'];

  for (const stats of monthStats) {
    const totalSeconds = Object.values(stats.dailyTotals).reduce((a, b) => a + b, 0);
    lines.push(`Month ${stats.month}: Total ${formatSecondsShort(totalSeconds)}`);
    const entries = Object.entries(stats.dailyTotals);
    const bestEntry = entries.sort(([, a], [, b]) => b - a)[0];
    if (bestEntry) lines.push(`  Best day: ${bestEntry[0]} (${formatSecondsShort(bestEntry[1])})`);
    for (const [blockId, total] of Object.entries(stats.blockTotals)) {
      const name = blockMap[blockId]?.name ?? blockId;
      lines.push(`  ${name}: ${formatSecondsShort(total)}`);
    }
  }

  const reflections = recentSessions
    .filter((s) => s.reflection?.trim())
    .slice(0, 5)
    .map((s) => `  [${s.date}] ${s.reflection}`);
  if (reflections.length > 0) {
    lines.push('RECENT REFLECTIONS:');
    lines.push(...reflections);
  }

  return lines.join('\n');
}

function getDateDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  return d.toISOString().split('T')[0];
}
