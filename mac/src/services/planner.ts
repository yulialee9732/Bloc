import Anthropic from '@anthropic-ai/sdk';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { WeekPlan, PlanDay, PlanBlock, Block } from '../../../shared/types';
import { weekId } from '../../../shared/utils';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a productivity planner. Parse the user's free-text input and generate a structured weekly schedule.

Rules:
1. Fixed anchors (user-specified times) are LOCKED
2. Add travel buffer before events with addresses
3. Schedule deep focus work in morning peak hours
4. Insert meal breaks at natural times
5. Never back-to-back focus blocks — add short breaks
6. Nothing after bedtime
7. Insert walk + prep after wake time
8. Shift personal errands before focus blocks on conflicts

Output ONLY valid JSON (no markdown):
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
          "note": "short note",
          "isFixed": false
        }
      ]
    }
  }
}`;

export async function generateWeeklyPlan(
  rawInput: string,
  blocks: Block[],
  weekStartDate: string,
  userId: string
): Promise<WeekPlan> {
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const blockContext = blocks.map((b) => `- ${b.name} (id: ${b.id}, color: ${b.color})`).join('\n');
  const prompt = `Week starting ${weekStartDate}. Dates: ${weekDates.join(', ')}\n\nFocus blocks:\n${blockContext}\n\nUser input:\n${rawInput}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
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
  blocks: Block[],
  userId: string
): Promise<PlanDay> {
  const existingDay = existingPlan.days[date];
  const blockContext = blocks.map((b) => `- ${b.name} (id: ${b.id}, color: ${b.color})`).join('\n');

  const prompt = `Replan ${date} given this new addition: "${addition}"\n\nExisting schedule:\n${JSON.stringify(existingDay?.blocks ?? [])}\n\nFocus blocks:\n${blockContext}\n\nOutput ONLY a JSON array of PlanBlock objects.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
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

  await setDoc(
    doc(db, 'users', userId, 'plans', existingPlan.weekId),
    { [`days.${date}`]: updatedDay },
    { merge: true }
  );

  return updatedDay;
}
