/** Returns today's date in WIB (Asia/Jakarta) as YYYY-MM-DD. */
const WIB_TIME_ZONE = 'Asia/Jakarta';

const wibFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const wibWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: WIB_TIME_ZONE,
  weekday: 'short',
});

const WEEKDAY_TO_NUMBER: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getWibTodayString(now: Date = new Date()): string {
  if (isNaN(now.getTime())) {
    return '';
  }
  return wibFormatter.format(now);
}

/** Returns the day of week in WIB (0=Sunday..6=Saturday, like Date.getDay()), or -1 for invalid input. */
export function getWibDayOfWeek(now: Date = new Date()): number {
  if (isNaN(now.getTime())) {
    return -1;
  }
  return WEEKDAY_TO_NUMBER[wibWeekdayFormatter.format(now)] ?? -1;
}

/** Returns the Monday of the current week in WIB as YYYY-MM-DD, or '' for invalid input. */
export function getWibWeekStart(now: Date = new Date()): string {
  const today = getWibTodayString(now);
  if (!today) {
    return '';
  }
  const weekday = getWibDayOfWeek(now);
  const [year, month, day] = today.split('-').map(Number);
  const mondayMs = Date.UTC(year, month - 1, day) - ((weekday + 6) % 7) * 86400000;
  const monday = new Date(mondayMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}
