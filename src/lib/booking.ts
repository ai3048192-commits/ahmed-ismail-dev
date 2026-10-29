// Turns the dashboard's weekly availability (in Ahmed's timezone) into concrete
// bookable instants, shown to each visitor in their own local time.

import type { SiteSettings } from "./settings";

/** minutes the zone is ahead of UTC at a given instant */
function zoneOffsetMin(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** the UTC instant of a wall-clock time in a zone (handles DST by re-checking once) */
export function zonedTime(y: number, m: number, d: number, hh: number, mm: number, timeZone: string) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - zoneOffsetMin(new Date(guess), timeZone) * 60000;
  t = guess - zoneOffsetMin(new Date(t), timeZone) * 60000;
  return new Date(t);
}

/** calendar date (y, m, d, weekday) of an instant as seen in a zone */
function zonedDate(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(at).map((p) => [p.type, p.value])
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { y: +parts.year, m: +parts.month, d: +parts.day, weekday, key: `${parts.year}-${parts.month}-${parts.day}` };
}

const hm = (v: string) => {
  const [h, m] = (v || "0:0").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
};

export type Day = { key: string; date: Date; slots: Date[] };

/** every open slot in the booking window, grouped by day; days with no free slot are dropped */
export function availableDays(s: SiteSettings, taken: Set<number>, now = new Date()): Day[] {
  let tz = s.timezone || "Africa/Cairo";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  const slot = Math.max(10, Number(s.booking_slot) || 30);
  const start = hm(s.booking_start);
  const end = hm(s.booking_end);
  const earliest = now.getTime() + 2 * 3600_000; // at least two hours' notice
  const blocked = new Set(s.booking_blocked || []);
  const days: Day[] = [];

  for (let i = 0; i <= Math.min(90, Number(s.booking_days_ahead) || 21); i++) {
    const day = zonedDate(new Date(now.getTime() + i * 86400_000), tz);
    if (!s.booking_days.includes(day.weekday) || blocked.has(day.key) || days.some((x) => x.key === day.key)) continue;
    const slots: Date[] = [];
    for (let min = start.h * 60 + start.m; min + slot <= end.h * 60 + end.m; min += slot) {
      const at = zonedTime(day.y, day.m, day.d, Math.floor(min / 60), min % 60, tz);
      if (at.getTime() >= earliest && !taken.has(at.getTime())) slots.push(at);
    }
    if (slots.length) days.push({ key: day.key, date: slots[0], slots });
  }
  return days;
}
