# fix-wib-reset - draft

intent: clear
review_required: false
classification: Trivial (1 file inti + 1 komponen kecil)
status: awaiting-approval
next_action: write .omo/plans/fix-wib-reset.md (approval authorizes plan creation only)

## Findings (evidence)

- Boundary reset ditentukan `app/actions/daily-task-actions.ts:7-13` (`getTodayString()` memakai `new Date()` = jam lokal server).
- `resetDailyCounts()` (line 15-46) dipanggil lazily dari `getDailyTasks()` (line 51); membandingkan `date !== today` lalu reset `currentCount: 0`.
- `createDailyTask()` (line 69) juga memakai `getTodayString()` untuk tanggal task baru.
- Halaman menampilkan copy "Reset otomatis setiap hari." (`app/dashboard/daily-tasks/page.tsx:23`).
- Display riwayat di `components/dashboard/daily-task-card.tsx:40-46` mem-parse string `YYYY-MM-DD` via `new Date(dateStr)` → UTC midnight; di browser non-WIB-barat bisa tampil mundur 1 hari. Fix kecil yang berkaitan langsung.
- Tidak ada test runner (`package.json` → `"test": "echo \"Error: no test specified\" && exit 1"`).
- Tidak ada scheduler/cron di repo; semua reset terjadi on-open.

## Approach (proposed)

1. Ekstrak helper murni `lib/dates.ts`: `export function getWibTodayString(now: Date = new Date()): string` memakai `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })` → `YYYY-MM-DD`.
2. Ganti isi `getTodayString()` di `daily-task-actions.ts` untuk mendelegasikan ke helper (3 pemakaian: reset, fetch, create otomatis ikut WIB).
3. Bonus kecil (scope IN, direktur default): `formatHistoryDate()` di `daily-task-card.tsx` parse aman — `new Date(dateStr + 'T00:00:00')` + `timeZone: 'Asia/Jakarta'` agar tampilan riwayat stabil.
4. Must-NOT-Have: tidak menambah library (tanpa date-fns-tz), tanpa cron/jadwal baru, tanpa mengubah model/schema, tanpa sentuh eisenhower-matrix/task biasa.

## Decisions (defaults adopted, skipped = approved)

- D1: Hardcode `Asia/Jakarta` (WIB, UTC+7, tanpa DST) — konstanta di satu tempat. Tidak pakai env var.
- D2: Test strategy = no test infra → QA agent-executed: build `npm run build` + verifikasi helper via skrip node sekali-pakai (bandingkan output untuk `now` di beberapa UTC offset, e.g. injected Date) dengan evidence path; happy+failure scenario.
- D3: Scope termasuk fix display riwayat (1 baris) karena sebab sama (zona waktu) dan risikonya nol.

## Approval gate

Menunggu persetujuan user untuk menulis `.omo/plans/fix-wib-reset.md`.
