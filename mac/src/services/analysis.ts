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
import { db } from './firebase';
import { Session, MonthStats, Block, AIAnalysis } from '../../../shared/types';
import { monthId, formatSecondsShort } from '../../../shared/utils';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateAnalysis(blocks: Block[], userId: string): Promise<AIAnalysis> {
  const now = new Date();
  const months = [
    monthId(now),
    monthId(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
  ];

  const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
  const [statsSnap, sessionsSnap] = await Promise.all([
    getDocs(query(collection(db, 'users', userId, 'stats'), where('month', 'in', months))),
    getDocs(query(
      collection(db, 'users', userId, 'sessions'),
      where('date', '>=', cutoff),
      orderBy('date', 'desc')
    )),
  ]);

  const monthStats = statsSnap.docs.map((d) => d.data() as MonthStats);
  const recentSessions = sessionsSnap.docs.map((d) => d.data() as Session);
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b]));

  const lines: string[] = ['FOCUS DATA SUMMARY:'];
  for (const stats of monthStats) {
    const total = Object.values(stats.dailyTotals).reduce((a, b) => a + b, 0);
    lines.push(`Month ${stats.month}: Total ${formatSecondsShort(total)}`);
    const entries = Object.entries(stats.dailyTotals).sort(([, a], [, b]) => b - a);
    if (entries[0]) lines.push(`  Best day: ${entries[0][0]} (${formatSecondsShort(entries[0][1])})`);
    for (const [blockId, t] of Object.entries(stats.blockTotals)) {
      lines.push(`  ${blockMap[blockId]?.name ?? blockId}: ${formatSecondsShort(t)}`);
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

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: `You are a productivity coach analyzing focus timer data. Return EXACTLY 4 lines:
LINE1: stats line — "Best day: [day] · Total this month: [Xh Ym] · Top block: [name]"
LINE2: trend observation — one sentence
LINE3: behavioral insight — one actionable sentence
LINE4: reflection pattern (or "Add session reflections to unlock pattern insights")
No markdown, no extra text.`,
    messages: [{ role: 'user', content: lines.join('\n') }],
  });

  const responseLines = (message.content[0] as { text: string }).text.trim().split('\n');
  const analysis: AIAnalysis = {
    statsLine: responseLines[0] ?? '',
    trendSentence: responseLines[1] ?? '',
    behavioralInsight: responseLines[2] ?? '',
    reflectionPattern: responseLines[3] ?? '',
    generatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(doc(db, 'users', userId, 'aiAnalysis', 'latest'), analysis);
  return analysis;
}
