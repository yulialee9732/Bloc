import Anthropic from '@anthropic-ai/sdk';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { WeekPlan, PlanDay, PlanBlock, Block } from '../../../shared/types';
import { weekId, todayString } from '../../../shared/utils';

const client = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY });

const BLOCK_COLORS = {
  focus: '',
  meal: '#6B7280',
  travel: '#D97706',
  event: '#EF4444',
  rest: '#9CA3AF',
};

const PLANNING_SYSTEM_PROMPT = `You are a productivity planner. Parse the user's free-text input and generate a structured weekly schedule.

Rules:
1. Fixed anchors (user-specified times) are LOCKED — schedule everything else around them
2. Add travel buffer before any event with an address mentioned
3. Schedule deep focus work (Learning, Portfolio, etc.) in morning peak hours when possible
4. Insert meal breaks at natural times (breakfast ~7-8am, lunch ~12-1pm, dinner ~6-7pm)
5. Never schedule back-to-back focus blocks — add short breaks
6. Nothing after stated bedtime
7. Insert walk + prep time after wake time
8. When conflicts arise, shift personal errands before focus blocks

Output ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "days": {
    "YYYY-MM-DD": {
      "blocks": [
        {
          "id": "unique_id",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "name": "block name",
          "category": "focus|meal|travel|event|rest",
          "blockId": "optional_focus_block_id",
          "color": "#hex",
          "note": "short AI note",
          "isFixed": false
        }
      ]
    }
  }
}`;

export async function generateWeeklyPlan(
  rawInput: string,
  blocks: Block[],
  weekStartDate: string
): Promise<WeekPlan> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const blockContext = blocks
    .map((b) => `- ${b.name} (id: ${b.id}, color: ${b.color})`)
    .join('\n');

  const prompt = `Week starting ${weekStartDate}. Dates: ${weekDates.join(', ')}

User's focus blocks:
${blockContext}

User's input:
${rawInput}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: PLANNING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  const parsed = JSON.parse(text);

  const days: Record<string, PlanDay> = {};
  for (const [date, dayData] of Object.entries(parsed.days as Record<string, { blocks: PlanBlock[] }>)) {
    days[date] = {
      date,
      blocks: dayData.blocks,
      lastUpdatedAt: serverTimestamp() as Timestamp,
      dailyAdditions: [],
    };
  }

  const currentWeekId = weekId(new Date(weekStartDate + 'T00:00:00'));
  const plan: WeekPlan = {
    weekId: currentWeekId,
    rawInput,
    generatedAt: serverTimestamp() as Timestamp,
    days,
  };

  await setDoc(doc(db, 'users', userId, 'plans', currentWeekId), plan);
  return plan;
}

export async function replanDay(
  date: string,
  addition: string,
  existingPlan: WeekPlan,
  blocks: Block[]
): Promise<PlanDay> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  const existingDay = existingPlan.days[date];
  const existingBlocks = JSON.stringify(existingDay?.blocks ?? []);

  const blockContext = blocks.map((b) => `- ${b.name} (id: ${b.id}, color: ${b.color})`).join('\n');

  const prompt = `Replan ${date} given this new addition: "${addition}"

Existing schedule for ${date}:
${existingBlocks}

User's focus blocks:
${blockContext}

Output ONLY a JSON array of PlanBlock objects for the updated day schedule.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: PLANNING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  const updatedBlocks: PlanBlock[] = JSON.parse(text);

  const updatedDay: PlanDay = {
    date,
    blocks: updatedBlocks,
    lastUpdatedAt: serverTimestamp() as Timestamp,
    dailyAdditions: [...(existingDay?.dailyAdditions ?? []), addition],
  };

  const planRef = doc(db, 'users', userId, 'plans', existingPlan.weekId);
  await setDoc(planRef, {
    [`days.${date}`]: updatedDay,
  }, { merge: true });

  return updatedDay;
}
