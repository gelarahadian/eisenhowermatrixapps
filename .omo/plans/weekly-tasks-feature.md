# weekly-tasks-feature - Work Plan

## TL;DR (For humans)

(What you'll get) Fitur **Weekly Tasks**: buat tugas mingguan dengan jadwal hari tertentu (mis. "Rapat Tim — Sen & Kam"), centang selesai/belum per hari jadwal, progress "X/Y hari minggu ini", riwayat per minggu. Reset otomatis tiap **Senin 00:00 WIB**. Halaman baru `/dashboard/weekly-tasks` + tombol di header.

(Why this approach) Memirror persis pola Daily Task yang sudah terbukti di repo (Mongoose model + lazy reset on-read + server actions + list/card components + spinner loading) — konsistensi kode dan risiko minimal.

(What it will NOT do) Tidak menyentuh task matriks Eisenhower, Daily Task existing, schema lama, tanpa cron/scheduler, tanpa library baru.

(Effort) ~2 jam, 8 file (3 baru produk + 1 model + 1 actions + 1 types + 1 helper + 1 header edit).

(Risk) Rendah–sedang: fitur baru berdiri sendiri; satu-satunya titik sentuh file existing hanyalah `dashboard-header.tsx` (link) dan `lib/types.ts` + `lib/dates.ts` (penambahan ekspor, tidak mengubah yang ada).

(Decisions) D1: checklist selesai/belum per hari jadwal (bukan count). D2: minggu dimulai Senin 00:00 WIB. D3: halaman baru + link header. D4: centang hanya untuk hari jadwal ≤ hari ini. D5: `daysOfWeek` memakai konvensi JS `getDay()` (0=Minggu..6=Sabtu), UI menampilkan chip Sen–Min. D6: lazy reset on-read (pola daily), tanpa cron.

## Scope

**IN:**
1. `lib/dates.ts` — tambah 2 ekspor murni:
   - `getWibDayOfWeek(now: Date = new Date()): number` → 0–6 (konvensi `getDay()`, dihitung di zona `Asia/Jakarta` via `Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' })` + map `Sun→0 .. Sat→6`; formatter module-scope).
   - `getWibWeekStart(now: Date = new Date()): string` → `YYYY-MM-DD` Senin minggu berjalan WIB. Implementasi deterministik: ambil string tanggal WIB hari ini + weekday; `Date.UTC(y, m-1, d) - ((weekday+6)%7)*86400000`; format balik dengan getter UTC (`getUTCFullYear/getUTCMonth/getUTCDate` + padStart) — tidak bergantung TZ server.
2. `models/WeeklyTask.ts` (baru):
   - Interface `IWeeklyHistoryEntry { weekStart: string; completedDays: number[]; completedAt: Date }`.
   - Interface `IWeeklyTask extends Document { name: string; daysOfWeek: number[]; weekStart: string; doneDays: number[]; userId: ObjectId; history: IWeeklyHistoryEntry[] }`.
   - Schema + validasi: `name` required; `daysOfWeek` required, array of int 0–6 (min/max per elemen, unik tidak diwajibkan tapi create memfilter duplikat); `weekStart` required string; `doneDays` default `[]`; index unik `{ userId: 1, weekStart: 1, name: 1 }`; `{ timestamps: true }`; pola `mongoose.models.WeeklyTask || mongoose.model(...)` seperti `models/DailyTask.ts:37`.
3. `lib/types.ts` — tambah (tidak mengubah yang ada): `WeeklyHistoryEntry`, `WeeklyTask` (padanan `DailyTask`, `history: WeeklyHistoryEntry[]`).
4. `app/actions/weekly-task-actions.ts` (baru, "use server", pola `daily-task-actions.ts`):
   - `getWeeklyTasks(userId)` → `dbConnect`, lazy reset: semua task user dengan `weekStart !== getWibWeekStart()` → push history `{ weekStart: task.weekStart, completedDays: task.doneDays, completedAt: new Date() }`, set `doneDays: []`, `weekStart: current`; lalu return task dengan `weekStart` current, sort `createdAt: 1`, `JSON.parse(JSON.stringify(tasks))`.
   - `createWeeklyTask(data: { name: string; daysOfWeek: number[]; userId: string })` → validasi `daysOfWeek` non-kosong, elemen int 0–6, dedupe; `weekStart: getWibWeekStart()`, `doneDays: []`, `history: []`; `revalidatePath("/dashboard/weekly-tasks")`.
   - `toggleDayCompletion(id: string, day: number)` → validasi task ada, `weekStart === getWibWeekStart()` (jika stale → return `{ success: false, reason: 'stale-week' }`, JANGAN auto-reset di sini), `daysOfWeek.includes(day)`, `day <= getWibDayOfWeek()` (tidak bisa centang masa depan); toggle push/pull `day` dari `doneDays`; `revalidatePath`.
   - `deleteWeeklyTask(id: string)` → `findByIdAndDelete`, `revalidatePath`.
5. `components/dashboard/weekly-task-card.tsx` (baru, "use client") — mirror `daily-task-card.tsx`:
   - Props: `{ task: WeeklyTask; isToggling?: number | null; onToggle?: (id: string, day: number) => void; onDelete?: (id: string) => void }`.
   - Tampilan: nama task, progress `X / Y hari minggu ini` (X = doneDays yang termasuk daysOfWeek, Y = daysOfWeek.length) + progress bar (pattern `daily-task-card.tsx:74-79`), badge kecil "Hari ini" jika `daysOfWeek` memuat hari ini WIB (`client` boleh pakai `new Date().getDay()` — konsisten WIB di browser user Indonesia; selain itu terima prop `todayWibDay` dari page agar akurat — PILIH: page mengirim `todayWibDay` sebagai prop, tanpa dependensi TZ browser).
   - Chips Sen–Min urut (label statis: Sen(1) Sel(2) Rab(3) Kam(4) Jum(5) Sab(6) Min(0)); chip hanya dirender untuk `daysOfWeek`; state centang = `doneDays.includes(day)`; klikable hanya jika `day <= todayWibDay`; chip hari ini diberi ring/border highlight; klik chip → `onToggle(taskId, day)`.
   - Selama toggle: chip menampilkan `<Loader2 size={14} className="animate-spin" />` (pola `spinner-loading-increment`, `isToggling === day`), chip disabled saat `isToggling !== null && isToggling !== undefined`.
   - Tombol Delete merah + riwayat collapsible "Lihat Riwayat (N)" memakai `formatHistoryDate`-style: tampil `weekStart` + jumlah hari selesai (pattern `daily-task-card.tsx:107-127`).
6. `components/dashboard/weekly-task-list.tsx` (baru, "use client") — mirror `daily-task-list.tsx`:
   - State `tasks`, `isAddOpen`, `newName`, `selectedDays: number[]` (checkbox group Sen–Min, min 1 hari utk submit), `pendingToggle: { id: string; day: number } | null`.
   - `handleToggle`: set `pendingToggle`, `try { await toggleDayCompletion(...) ; update state task terkait (doneDays baru + completed dari response) } finally { setPendingToggle(null) }`.
   - `handleDelete`, `handleAddTask` mengikuti pola daily (`daily-task-list.tsx:19-33,57-60`).
   - Empty state: "Belum ada weekly task. Klik \"+ Add Weekly Task\" untuk mulai."
7. `app/dashboard/weekly-tasks/page.tsx` (baru) — mirror `daily-tasks/page.tsx`: guard session → redirect signin; `todayWibDay = getWibDayOfWeek()` dihitung server-side dan dikirim ke list; heading "Weekly Tasks" + sub "Tugas mingguan sesuai jadwal. Reset otomatis setiap Senin."; tombol back.
8. `components/dashboard/dashboard-header.tsx` — tambah Link "Weekly Tasks" → `/dashboard/weekly-tasks` (styling identik tombol Daily Tasks, warna bisa `bg-indigo-600` agar beda).

**OUT (Must-NOT-Have):**
- Tidak mengubah `models/DailyTask.ts`, `daily-task-actions.ts`, komponen daily apa pun (kecuali dua file additive di atas).
- Tidak menambah dependency npm.
- Tidak membuat cron/VM/scheduled job.
- Tidak mengubah auth, eisenhower matrix, layout, middleware.
- Tidak menambah test framework.

## Verification strategy

Tanpa test runner. QA agent-executed:
1. `npm run build` → exit 0 (setelah setiap todo yang menyentuh kode).
2. Skrip verifikasi murni `/tmp/opencode/wib-week-check.mjs` (replikasi logika `getWibDayOfWeek`/`getWibWeekStart`): happy cases — `2026-10-21T17:00:00Z` (Rabu 00:00 WIB? cek: 17:00Z Wed → Wed di WIB... hitung di skrip) beserta boundary Senin `00:00 WIB` dan `23:59 WIB Minggu`; failure case invalid Date tidak throw. Evidence: `/tmp/opencode/wib-week-check.out`.
3. Manual QA dev server: buka `/dashboard/weekly-tasks`, tambah task dengan 2 hari jadwal, centang chip hari ini, refresh → state persist; ganti minggu (simulasi via update `weekStart` doc di DB dengan skrip sekali-pakai ATAU verifikasi unit di skrip) → arsip + reset `doneDays`. Evidence: log + catatan observasi.

## Execution strategy

Sequential per rantai dependensi: helper (1) → schema/types (2) → actions (3) → UI card/list (4-5) → page/header (6). Setiap todo diverifikasi (build) sebelum lanjut. Eksekusi langsung oleh orchestrator (override user: infrastruktur subagent rusak) atau worker bila pulih.

## Todos

- [x] 1. Tambah `getWibDayOfWeek()` + `getWibWeekStart()` di `lib/dates.ts` + skrip verifikasi
  - References: `lib/dates.ts` (existing helper, polity module-scope formatter); `models/DailyTask.ts:24` (`date: string` pola `YYYY-MM-DD`).
  - Acceptance: dua ekspor baru sesuai spec Scope IN-1; getter UTC; tidak ada perubahan ekspor/kode existing; skrip `/tmp/opencode/wib-week-check.mjs` membuktikan: (a) Minggu `2026-10-25T16:59:00Z` (23:59 WIB Minggu) → `weekStart = 2026-10-19` (Senin yang sama); (b) Senin `2026-10-26T04:00:00Z` (11:00 WIB Senin) → `weekStart = 2026-10-26`; (c) `getWibDayOfWeek` untuk Rabu → 3, Minggu → 0; (d) invalid Date tidak throw (return `''` / `-1` konsisten — PILIH: kedua helper return `''` dan `0`? KONSISTEN: `getWibDayOfWeek` return `-1` utk invalid, `getWibWeekStart` return `''`). Output ke `/tmp/opencode/wib-week-check.out`, exit 0.
  - QA happy: ASSIGN di atas PASS semua. Evidence: `/tmp/opencode/wib-week-check.out`.
  - QA failure: invalid Date → return sentinel tanpa throw. Evidence: file `.out` yang sama.
  - Commit: `feat: WIB day-of-week + week-start helpers (lib/dates.ts)`

- [x] 2. Model `models/WeeklyTask.ts` + interface `lib/types.ts`
  - References: `models/DailyTask.ts` (pola full: interface, schema, index unik, export guard); `lib/types.ts:16-32` (pola type serializable).
  - Acceptance: sesuai spec Scope IN-2 & IN-3; index unik `{ userId, weekStart, name }`; tidak ada file existing yang barisnya dihapus (hanya append).
  - QA happy: `npm run build` exit 0 (typecheck interface konsisten). Evidence: output build.
  - QA failure: menghilangkan satu field required akan gagal typecheck di todo 3 — dicek di build todo 3. Evidence: output build.
  - Commit: `feat: WeeklyTask model + shared types`

- [x] 3. `app/actions/weekly-task-actions.ts` (4 server actions)
  - References: `app/actions/daily-task-actions.ts` (pola penuh: "use server", dbConnect, lazy reset di getter, revalidatePath, JSON.parse(JSON.stringify(...)), try/catch console.error).
  - Acceptance: 4 ekspor sesuai spec Scope IN-4; lazy reset mengarsip `doneDays` sebelum mengosongkan; `toggleDayCompletion` menolak hari masa depan & minggu stale tanpa throw; create dedupe `daysOfWeek` + fallback [] jika kosong → throw validation error yang tertangkap try/catch pattern.
  - QA happy: grep memastikan semua 4 ekspor ada; build exit 0. Evidence: output build + grep.
  - QA failure: toggle pada `weekStart` lama → `{ success: false, reason: 'stale-week' }` (inspeksi kode). Evidence: inspeksi diff.
  - Commit: `feat: weekly task server actions with lazy weekly reset`

- [x] 4. Komponen `weekly-task-card.tsx` + `weekly-task-list.tsx`
  - References: `components/dashboard/daily-task-card.tsx` + `daily-task-list.tsx` (pola penuh termasuk spinner pattern `isIncrementing`/`pendingTaskId` try-finally & modal add form).
  - Acceptance: sesuai spec Scope IN-5 & IN-6; chips hanya hari jadwal; centang masa depan tidak klikable; spinner per-chip saat `pendingToggle.day` cocok; disabled global saat ada toggle pending; empty state; modal add dengan pilihan hari (checkbox, min 1).
  - QA happy: build exit 0. Evidence: output build.
  - QA failure: klik chip masa depan → tidak memanggil onToggle (klikable guard). Evidence: inspeksi diff.
  - Commit: `feat: weekly task card + list components with per-day toggle`

- [x] 5. Halaman `/dashboard/weekly-tasks` + link header
  - References: `app/dashboard/daily-tasks/page.tsx` (pola halaman); `components/dashboard/dashboard-header.tsx` (letak link).
  - Acceptance: halaman sesuai spec Scope IN-7; header punya 3 tombol: Daily Tasks, Weekly Tasks, Logout; `todayWibDay` dihitung server dan dikirim ke `WeeklyTaskList`.
  - QA happy: build exit 0; dev server `curl /dashboard/weekly-tasks` → 307 ke signin (route terdaftar); `/dashboard` masih 200/307 normal. Evidence: curl output.
  - QA failure: session tidak ada → redirect `/auth/signin` (pola page daily). Evidence: curl output.
  - Commit: `feat: weekly tasks page + header navigation`

- [x] 6. Manual QA end-to-end + final wave
  - Dev server: tambah 1 weekly task (2 hari jadwal), centang hari ini, refresh persist. Simulasi pergantian minggu: skripsi sekali-pakai `/tmp/opencode/force-week-rollover.mjs` (koneksi MONGODB_URI dari env, update `weekStart` semua WeeklyTask ke minggu lalu) → buka halaman → history bertambah, doneDays kosong, weekStart = Senin ini. Cleanup: kembalikan data QA (hapus task uji), matikan dev server, hapus/arsip skrip.
  - Evidence: `/tmp/opencode/dev-weekly-qa.log` + catatan observasi di `.omo/notepads/weekly-tasks/learnings.md`.

## Final verification wave

- [x] F1. Plan compliance audit — hanya file daftar Scope yang berubah/dibuat. Evidence: `git diff --stat` vs Scope.
- [x] F2. Code quality review — tanpa `as any` baru di file baru (kecuali pola `(session.user as any).id` yang sudah baku di repo), tanpa TODO, reset spinner di `finally`. Evidence: grep + inspeksi diff.
- [x] F3. Real manual QA — build exit 0 + alur end-to-end todo 6 lulus. Evidence: log + notepad.
- [x] F4. Scope fidelity — `package.json` & file daily/matrix tidak berubah. Evidence: `git diff package.json` = 0 + `git status`.

## Commit strategy

Satu commit per todo (6 commit feat), gaya `feat: ...`. `.omo` state: chore commit terpisah di akhir.

## Success criteria

- `npm run build` exit 0.
- Skrip `/tmp/opencode/wib-week-check.out` ALL PASS (boundary Senin 00:00 WIB tepat).
- Jalur end-to-end: buat task weekly 2 hari → centang hari ini → persist setelah refresh → simulasi rollover minggu → arsip + reset.
- Halaman `/dashboard/weekly-tasks` terjangkau dari header; file daily/matrix tidak tersentuh.
