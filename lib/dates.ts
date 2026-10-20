/** Returns today's date in WIB (Asia/Jakarta) as YYYY-MM-DD. */
const WIB_TIME_ZONE = 'Asia/Jakarta';

const wibFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: WIB_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getWibTodayString(now: Date = new Date()): string {
  if (isNaN(now.getTime())) {
    return '';
  }
  return wibFormatter.format(now);
}
