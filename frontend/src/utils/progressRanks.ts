// Single source of truth for progress rank buckets aligned to 0-20,000 totalMinutes scale

export interface RankTier {
  name: string;
  subtitle: string;
  minMinutes: number;
  maxMinutes: number;
}

// Updated rank buckets matching the 0-20,000 minute bowl-fill scale
export const RANK_TIERS: RankTier[] = [
  { name: 'Droplet', subtitle: 'first steps on the path', minMinutes: 0, maxMinutes: 499 },
  { name: 'Stream', subtitle: 'building momentum', minMinutes: 500, maxMinutes: 1999 },
  { name: 'Pool', subtitle: 'deepening practice', minMinutes: 2000, maxMinutes: 4999 },
  { name: 'Lake', subtitle: 'steady presence', minMinutes: 5000, maxMinutes: 9999 },
  { name: 'Ocean', subtitle: 'vast awareness', minMinutes: 10000, maxMinutes: 19999 },
  { name: 'Infinite Waters', subtitle: 'boundless calm', minMinutes: 20000, maxMinutes: Infinity },
];

/**
 * Get the current rank tier based on total minutes meditated
 */
export function getCurrentRank(totalMinutes: number): RankTier {
  return RANK_TIERS.find(
    rank => totalMinutes >= rank.minMinutes && totalMinutes <= rank.maxMinutes
  ) || RANK_TIERS[0];
}

/**
 * Get the index of the current rank tier
 */
export function getRankIndex(totalMinutes: number): number {
  return RANK_TIERS.findIndex(
    rank => totalMinutes >= rank.minMinutes && totalMinutes <= rank.maxMinutes
  );
}

/**
 * Get the next rank tier, or null if at max rank
 */
export function getNextRank(totalMinutes: number): RankTier | null {
  const currentIndex = getRankIndex(totalMinutes);
  if (currentIndex === -1 || currentIndex >= RANK_TIERS.length - 1) {
    return null;
  }
  return RANK_TIERS[currentIndex + 1];
}

/**
 * Get minutes until the next rank tier
 */
export function getMinutesUntilNextRank(totalMinutes: number): number | null {
  const nextRank = getNextRank(totalMinutes);
  if (!nextRank) return null;
  return nextRank.minMinutes - totalMinutes;
}

/**
 * Format rank for display (name + subtitle)
 */
export function formatRankDisplay(totalMinutes: number): string {
  const rank = getCurrentRank(totalMinutes);
  return `${rank.name} – ${rank.subtitle}`;
}
