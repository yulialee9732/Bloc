import { Session, MonthStats, Block } from './types';

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatSecondsShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatSecondsLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function weekId(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function monthId(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getWeekDates(date: Date = new Date()): string[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    return dateString(curr);
  });
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function lightenHex(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function buildCSV(sessions: Session[], blocks: Block[]): string {
  const blockMap = Object.fromEntries(blocks.map((b) => [b.id, b.name]));
  const header = 'date,block_name,elapsed_seconds,elapsed_formatted,completed,reflection';
  const rows = sessions.map((s) => {
    const name = blockMap[s.blockId] ?? s.blockId;
    const formatted = formatSecondsLong(s.elapsed);
    const reflection = s.reflection ? `"${s.reflection.replace(/"/g, '""')}"` : '""';
    return `${s.date},${name},${s.elapsed},${formatted},${s.completed},${reflection}`;
  });
  return [header, ...rows].join('\n');
}

export function aggregateMonthStats(sessions: Session[]): Partial<MonthStats> {
  const dailyTotals: Record<string, number> = {};
  const blockTotals: Record<string, number> = {};
  for (const s of sessions) {
    dailyTotals[s.date] = (dailyTotals[s.date] ?? 0) + s.elapsed;
    blockTotals[s.blockId] = (blockTotals[s.blockId] ?? 0) + s.elapsed;
  }
  return { dailyTotals, blockTotals };
}

export function ringProgress(elapsed: number, dailyGoal: number): number {
  if (dailyGoal === 0) return 0;
  return Math.min(1, elapsed / dailyGoal);
}

export function isStreakAlive(lastHitDate: string): boolean {
  const today = todayString();
  const yesterday = dateString(new Date(Date.now() - 86400000));
  return lastHitDate === today || lastHitDate === yesterday;
}

export function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr + 'T00:00:00').getDay()];
}
