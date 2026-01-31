/**
 * Pilot ranks based on total flight hours (Oman Air Virtual).
 * Used in Navbar, Dashboard, and anywhere pilot rank is displayed.
 */
export const RANK_TIERS = [
  { name: 'Cadet', hours: 0, unlocks: 'Access to short-haul routes and access to all group flights' },
  { name: 'First Officer', hours: 40, unlocks: 'Access to medium-haul routes and access to fly historic Oman Air aircraft: A320-200, B757-200, B737-700' },
  { name: 'Senior First Officer', hours: 80, unlocks: 'Can suggest ROTW routes' },
  { name: 'Captain', hours: 120, unlocks: 'Access to all routes (short, medium, long-haul)' },
  { name: 'Senior Captain', hours: 200, unlocks: 'Access to 10 oneworld airlines routes' },
  { name: 'Elite Captain', hours: 300, unlocks: 'Muscat VIP Lounge access' },
  { name: 'Crown Captain', hours: 500, unlocks: 'One-time 5× flight points multiplier' },
  { name: 'Special Commander', hours: 800, unlocks: 'Special gate selection for events & flights' },
  { name: 'Falcon Commander', hours: 1000, unlocks: 'Personal Route of the Week (ROTW) – Once per month, a custom ROTW is created exclusively for the pilot' },
  { name: 'Sultan', hours: 1500, unlocks: 'Highest rank' },
];

/**
 * @param {number} totalHours - Pilot's total flight hours
 * @returns {{ name: string, hoursRequired: number, unlocks: string, nextRank: string | null, nextHours: number | null, progress: number }}
 */
export function getPilotRank(totalHours) {
  const h = Number(totalHours) || 0;
  let current = RANK_TIERS[0];
  let next = null;

  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (h >= RANK_TIERS[i].hours) {
      current = RANK_TIERS[i];
      next = RANK_TIERS[i + 1] || null;
      break;
    }
  }

  const nextRank = next ? next.name : null;
  const nextHours = next ? next.hours : null;
  const progress = nextHours != null
    ? Math.min(100, ((h - current.hours) / (nextHours - current.hours)) * 100)
    : 100;

  return {
    name: current.name,
    hoursRequired: current.hours,
    unlocks: current.unlocks,
    nextRank,
    nextHours,
    progress,
  };
}
