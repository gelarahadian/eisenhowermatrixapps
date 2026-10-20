## 2026-10-21 Todo 1 (direct execution, user override: no subagents)
- lib/dates.ts created: getWibTodayString() via Intl 'en-CA' + Asia/Jakarta, guard isNaN -> ''.
- Evidence: /tmp/opencode/wib-date-check.out (ALL PASS, exit 0). Boundary case 17:00Z = 00:00 WIB next day verified.
- Gotcha: Intl.format(invalid Date) throws RangeError -> guard needed. Test arithmetic: 20:00 UTC = 03:00 WIB NEXT day.
## 2026-10-21 Todos 2+3 (direct execution)
- getTodayString() now delegates to getWibTodayString(); 3 call sites (reset/fetch/create) inherit WIB automatically.
- Baseline proof: TZ=UTC at 17:30Z -> OLD=2026-10-21 vs NEW=2026-10-22 (failing-first captured).
- formatHistoryDate: T00:00:00 append + timeZone WIB + isNaN guard. TZ=America/New_York sim: 2026-10-21 -> "21 Okt 2026" (old code would show 20 Okt).
- npm run build exit 0. Pre-existing `as any` at daily-task-card.tsx:13 is out of scope.
