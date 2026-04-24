import { Timestamp } from 'firebase/firestore';

export interface Block {
  id: string;
  name: string;
  icon: string;
  color: string;
  duration: number;
  dailyGoal: number;
  order: number;
  createdAt: Timestamp;
}

export interface Session {
  id?: string;
  blockId: string;
  date: string;
  elapsed: number;
  completed: boolean;
  reflection: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
}

export interface HabitEntry {
  date: string;
  entries: Record<string, boolean>;
  goalHit: Record<string, boolean>;
}

export interface Streak {
  blockId: string;
  current: number;
  longest: number;
  lastHitDate: string;
  updatedAt: Timestamp;
}

export interface TimerState {
  status: 'running' | 'paused' | 'idle';
  elapsed: number;
  startedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export interface MonthStats {
  month: string;
  dailyTotals: Record<string, number>;
  blockTotals: Record<string, number>;
  updatedAt: Timestamp;
}

export type BlockCategory = 'focus' | 'meal' | 'travel' | 'event' | 'rest';

export interface PlanBlock {
  id: string;
  startTime: string;
  endTime: string;
  name: string;
  category: BlockCategory;
  blockId?: string;
  color: string;
  note?: string;
  isFixed: boolean;
}

export interface PlanDay {
  date: string;
  blocks: PlanBlock[];
  lastUpdatedAt: Timestamp;
  dailyAdditions: string[];
}

export interface WeekPlan {
  weekId: string;
  rawInput: string;
  generatedAt: Timestamp;
  days: Record<string, PlanDay>;
}

export interface ColorTheme {
  id: string;
  name: string;
  colors: [string, string, string, string];
  background: string;
  surface: string;
}

export interface AIAnalysis {
  statsLine: string;
  trendSentence: string;
  behavioralInsight: string;
  reflectionPattern: string;
  generatedAt: Timestamp;
}

export type CompletionSound = 'soft-chime' | 'piano-note' | 'game-clear';
