import { DAY_CODES, type DayCode, type Meeting } from "../data/schema";

/** A meeting flattened to minutes-since-midnight for fast overlap checks. */
export interface TimeBlock {
  day: DayCode;
  startMin: number;
  endMin: number;
  location: string;
}

/** Parse "HH:MM" (24h) to minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes since midnight back to "H:MM AM/PM" for display. */
export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function meetingToBlock(m: Meeting): TimeBlock {
  return {
    day: m.day,
    startMin: toMinutes(m.start),
    endMin: toMinutes(m.end),
    location: m.location,
  };
}

/** Two blocks conflict iff same day and their [start,end) intervals overlap. */
export function blocksConflict(a: TimeBlock, b: TimeBlock): boolean {
  return a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin;
}

/**
 * True if any block in `blocks` overlaps any block in `existing`.
 * Used both within a course (sanity) and across courses (the main constraint).
 */
export function anyConflict(existing: TimeBlock[], blocks: TimeBlock[]): boolean {
  for (const e of existing) {
    for (const b of blocks) {
      if (blocksConflict(e, b)) return true;
    }
  }
  return false;
}

/** Earliest start / latest end across blocks, or null if no timed meetings. */
export function timeBounds(blocks: TimeBlock[]): { min: number; max: number } | null {
  if (blocks.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const b of blocks) {
    if (b.startMin < min) min = b.startMin;
    if (b.endMin > max) max = b.endMin;
  }
  return { min, max };
}

export const DAY_LABELS: Record<DayCode, string> = {
  Mo: "Mon",
  Tu: "Tue",
  We: "Wed",
  Th: "Thu",
  Fr: "Fri",
  Sa: "Sat",
  Su: "Sun",
};

export { DAY_CODES };
export type { DayCode };
