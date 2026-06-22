import type { Priority, UserProfile } from "./void-types";

/** Mirrors backend/app/progression.py for UI hints (offline estimates). */

export const XP_BY_PRIORITY: Record<Priority, number> = {
  critical: 120,
  high: 80,
  medium: 50,
  low: 30
};

export const RANK_TIERS: { minLevel: number; rank: string; title: string }[] = [
  { minLevel: 1, rank: "AVENO RANK: TIER I", title: "Discipline Seeker" },
  { minLevel: 5, rank: "AVENO RANK: TIER II", title: "Focus Apprentice" },
  { minLevel: 10, rank: "AVENO RANK: TIER III", title: "Task Adept" },
  { minLevel: 15, rank: "AVENO RANK: TIER IV", title: "Flow Walker" },
  { minLevel: 20, rank: "AVENO RANK: TIER V", title: "Deep Worker" },
  { minLevel: 30, rank: "AVENO RANK: TIER VI", title: "Aveno Veteran" },
  { minLevel: 40, rank: "AVENO RANK: TIER VII", title: "Aveno Master" },
  { minLevel: 50, rank: "AVENO RANK: TIER VIII", title: "Legend of Focus" },
  { minLevel: 75, rank: "AVENO RANK: TIER IX", title: "Aveno Paragon" },
  { minLevel: 100, rank: "AVENO RANK: TIER X", title: "Eternal Focus" }
];

export function xpRequiredForLevel(level: number): number {
  return Math.max(100, Math.round(100 * 1.18 ** Math.max(0, level - 1)));
}

export function rankForLevel(level: number) {
  let result = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (level >= tier.minLevel) result = tier;
  }
  return result;
}

export function xpForFocusMinutes(minutes: number) {
  return Math.max(1, minutes);
}

export function xpForTaskCompletion(
  priority: Priority,
  difficulty: number,
  importance: number,
  dueDate: string,
  completedAt: string
) {
  const base = XP_BY_PRIORITY[priority];
  const onTime = completedAt.slice(0, 10) <= dueDate ? 20 : 0;
  return base + difficulty * 4 + importance * 3 + onTime;
}

export function estimateTaskXp(priority: Priority, difficulty: number, importance: number, dueDate: string) {
  return xpForTaskCompletion(priority, difficulty, importance, dueDate, dueDate);
}

export function applyXp(profile: UserProfile, amount: number): UserProfile {
  if (amount < 1) return profile;
  let { level, xp, xpToNext } = profile;
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = xpRequiredForLevel(level);
  }
  const tier = rankForLevel(level);
  return { ...profile, level, xp, xpToNext, rank: tier.rank, title: tier.title };
}

export function xpProgressPercent(xp: number, xpToNext: number) {
  if (xpToNext <= 0) return 100;
  return Math.min(100, Math.round((xp / xpToNext) * 100));
}
