# fix-wib-reset - Work Plan

## TL;DR (For humans)

(What you'll get) Reset harian daily task memakai batas tengah malam **WIB (Asia/Jakarta)**, bukan jam server — jadi count reset konsisten jam 00:00 WIB di mana pun app di-deploy. Tampilan tanggal riwayat juga stabil di semua zona waktu browser.

(Why this approach) Satu sumber kebenaran tanggal (`getTodayString()` di `app/actions/daily-task-actions.ts:7-13`) dipakai oleh reset, fetch, dan create — mengganti isinya dengan helper WIB memperbaiki semua jalur sekaligus tanpa mengubah schema/logika DB.

(What it will NOT do) Tidak menambah cron/scheduler, tidak menambah library, tidak mengubah model MongoDB, tidak menyentuh eisenhower-matrix/task biasa.

(Effort) ~30 menit, 2 file produk + 1 file helper baru.

(Risk) Rendah — perubahan murni perhitungan string tanggal; perilaku lama untuk user WIB tidak berubah.

(Decisions) D1: hardcode `Asia/Jakarta` di satu konstanta. D2: QA tanpa test runner → build + skrip verifikasi node. D3: fix display riwayat ikut scope.

## Scope

**IN:**
- `lib/dates.ts` (BARU): helper murni `getWibTodayString(now?: Date): string` → `YYYY-MM-DD` di zona `Asia/Jakarta`.
- `app/actions/daily-task-actions.ts`: `getTodayString()` delegasi ke helper (mempengaruhi `resetDailyCounts`, `getDailyTasks`, `createDailyTask`).
- `components/dashboard/daily-task-card.tsx`: `formatHistoryDate()` parse aman (`${dateStr}T00:00:00`) + `timeZone: 'Asia/Jakarta'` + guard `Invalid Date`.

**OUT (Must-NOT-Have):**
- Tidak menambah dependency npm (tanpa date-fns-tz/luxon).
- Tidak membuat cron/scheduled job.
- Tidak mengubah `models/DailyTask.ts`, `lib/types.ts`, atau data lama di DB.
- Tidak menyentuh `task-actions.ts`, `eisenhower-matrix.tsx`, `task-card.tsx`, `completed-tasks.tsx`.
- Tidak menambah test framework.

## Verification strategy

Repo tidak punya test runner (`package.json` → `"test": "echo \"Error: no test specified\" && exit 1"`). QA agent-executed:
1. Skrip verifikasi sekali-pakai `/tmp/opencode/wib-date-check.mjs` (replikasi logika Intl helper) membandingkan output untuk beberapa `Date` injected — happy + failure scenario, output disimpan `/tmp/opencode/wib-date-check.out`.
2. `npm run build` → exit 0.
3. Manual QA: buka `/dashboard/daily-tasks`, pastikan halaman render dan copy "Reset otomatis setiap hari." tetap tampil.

## Execution strategy

Sequential (semua todo menyentuh rantai dependensi yang sama: helper → pemakai → display). Eksekusi oleh worker session via `/start-work`, bukan oleh planner.

## Todos

- [x] 1. Buat `lib/dates.ts` dengan helper `getWibTodayString()` + verifikasi skrip node
  - References: `app/actions/daily-task-actions.ts:7-13` (pola `getTodayString` lama); `components/dashboard/daily-task-card.tsx:40-46` (zona waktu yang dipakai display).
  - Acceptance: file `lib/dates.ts` berisi `export function getWibTodayString(now: Date = new Date()): string` memakai `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })` dan mengembalikan `YYYY-MM-DD`; formatter dibuat sekali di module scope.
  - QA happy: skrip `/tmp/opencode/wib-date-check.mjs` — `getWibTodayString(new Date('2026-10-21T20:00:00Z'))` → `2026-10-21`; `new Date('2026-10-21T18:00:00Z')` (= 01:00 WIB 22 Okt) → `2026-10-22`. Evidence: `/tmp/opencode/wib-date-check.out`.
  - QA failure: input `new Date('invalid')` → helper tetap mengembalikan string (bukan throw); skrip mencatat hasilnya. Evidence: `/tmp/opencode/wib-date-check.out`.
  - Commit: `fix: add WIB date helper (lib/dates.ts)`

- [x] 2. Rewire `getTodayString()` di `app/actions/daily-task-actions.ts` ke helper WIB
  - References: `app/actions/daily-task-actions.ts:7-13` (fungsi yang diganti), `:15-46` (`resetDailyCounts` pemakai), `:48-60` (`getDailyTasks`), `:62-88` (`createDailyTask`).
  - Acceptance: `getTodayString()` menjadi wrapper satu baris yang memanggil `getWibTodayString()` dari `@/lib/dates`; tidak ada `new Date()` lain yang menentukan string tanggal hari; tiga pemakai tidak diubah logikanya.
  - QA happy: `npm run build` exit 0; grep memastikan `getWibTodayString` terimpor. Evidence: output build.
  - QA failure: skenario "server UTC jam 20:00 UTC" — helper menghasilkan tanggal WIB berikutnya, bukan tanggal UTC (dibuktikan lewat skrip todo 1). Evidence: `/tmp/opencode/wib-date-check.out`.
  - Commit: `fix: daily task reset boundary uses WIB`

- [x] 3. Fix `formatHistoryDate()` di `components/dashboard/daily-task-card.tsx` agar stabil WIB
  - References: `components/dashboard/daily-task-card.tsx:40-46` (fungsi yang diganti), `:117-124` (pemakai di render riwayat).
  - Acceptance: `formatHistoryDate` mem-parse `new Date(\`${dateStr}T00:00:00\`)`, menambahkan `timeZone: 'Asia/Jakarta'` pada opsi `toLocaleDateString('id-ID', ...)`, dan guard: jika `isNaN(date.getTime())` kembalikan `dateStr` apa adanya.
  - QA happy: string `2026-10-21` tampil `21 Okt 2026` di zona waktu browser mana pun (logika: parse lokal tengah malam + format WIB). Evidence: output build + inspeksi kode.
  - QA failure: input `bukan-tanggal` → guard mengembalikan string mentah, bukan `Invalid Date`. Evidence: inspeksi kode + build.
  - Commit: `fix: history date display stable across timezones`

## Final verification wave

- [x] F1. Plan compliance audit — verifikasi semua todo sesuai spec plan ini, tidak ada scope creep. Evidence: diff `git diff --stat` vs Scope.
- [x] F2. Code quality review — helper murni, tanpa duplikasi, tanpa `as any`/TODO baru. Evidence: `lsp_diagnostics` + grep TODO/FIXME.
- [x] F3. Real manual QA — `npm run build` exit 0 + halaman `/dashboard/daily-tasks` render normal. Evidence: output build + screenshot/inspeksi.
- [x] F4. Scope fidelity — hanya 3 file di atas yang berubah; tidak ada dependency baru di `package.json`. Evidence: `git status` + `git diff`.

## Commit strategy

Satu commit per todo (3 commit kecil), gaya konvensional `fix: ...`. Tidak ada push otomatis.

## Success criteria

- `npm run build` exit 0.
- Helper mengembalikan `YYYY-MM-DD` zona WIB untuk semua skenario skrip verifikasi.
- Tidak ada file di luar Scope yang berubah; `package.json` tidak berubah.
