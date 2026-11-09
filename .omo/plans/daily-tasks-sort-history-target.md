# daily-tasks-sort-history-target - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** Di halaman Daily Tasks, kartu-kartu bisa digeser (drag & drop) untuk menentukan urutan prioritas dan urutannya tersimpan permanen. Setiap kartu menampilkan riwayat 7 hari terakhir sebagai satu baris centang yang bisa diklik untuk membuka detail riwayat 7 hari, 1 bulan, dan 1 tahun. Jumlah target harian juga bisa diedit langsung di kartu.

**Why this approach:** Urutan disimpan sebagai field `order` di database (mengikuti pola yang sudah dipakai fitur Eisenhower) supaya prioritas bertahan setelah reload/refresh, bukan sekadar urutan sementara di layar. Riwayat memakai data yang sudah terkumpul otomatis setiap hari, jadi tidak ada pekerjaan pencatatan baru.

**What it will NOT do:** Tidak mengubah cara kerja penghitungan harian yang ada (tambah/kurang/reset otomatis). Tidak menyentuh halaman atau fitur lain di luar Daily Tasks. Tidak menambah library/dependency baru.

**Effort:** Medium
**Risk:** Low - semua pola (drag-sort, field order, modal) sudah ada contohnya di codebase ini; risiko terbesar hanya data histori lama yang bolong ditampilkan sebagai hari kosong.
**Decisions to sanity-check:** (1) Hari dianggap "tercapai" jika count hari itu >= target saat ini; (2) mengubah target langsung menghitung ulang status selesai kartu; (3) hari tanpa data histori tampil kosong, bukan dianggap gagal.

Your next move: jalankan `$start-work` untuk mengeksekusi rencana ini. Full execution detail follows below.

---

> TL;DR (machine): <1 line - effort, risk, deliverables>

## Scope
### Must have
1. **Sort prioritas kartu (drag & drop)** di `/dashboard/daily-tasks`:
   - Grid kartu bisa di-reorder dengan drag & drop (@dnd-kit, sudah terpasang).
   - Urutan dibaca "kiri-ke-kanan, atas-ke-bawah" sesuai layout grid (1 kolom mobile, 2 kolom md, 3 kolom lg).
   - Urutan PERSISTEN di DB: field baru `order: number` di model `DailyTask` (konvensi yang sudah ada di `models/Task.ts:19`).
   - `getDailyTasks` sort `{ order: 1, createdAt: 1 }`; task baru dapat `order` = max+1 per user.
   - Optimistic update di client; revert ke urutan sebelumnya jika server action gagal.
2. **Histori 7 hari satu baris (check/uncheck)** di setiap kartu:
   - Satu baris 7 sel = 7 hari terakhir (hari ini + 6 hari ke belakang, zona WIB).
   - Sel terisi (check) jika hari itu `completedCount >= targetCount`; hari ini pakai `currentCount >= targetCount`; hari tanpa data histori = sel kosong/redup.
   - Strip ini bisa diklik → membuka modal detail histori.
3. **Modal detail histori** (dari klik strip): 3 tab — **7 Hari** (daftar 7 hari: tanggal, check/uncheck, count), **1 Bulan** (kalender bulan berjalan WIB, sel check per hari), **1 Tahun** (12 baris bulan: jumlah hari tercapai per bulan). Sumber data: `task.history` + hari ini.
4. **Edit target count** di kartu: ikon edit di samping "x / y" → input inline → simpan via server action baru `updateDailyTaskTarget` (validasi min 1, integer) → hitung ulang `completed`/`completedAt` (currentCount >= target baru → completed; sebaliknya → belum) → state client ikut terupdate.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- TIDAK menambah dependency baru apa pun (@dnd-kit sudah ada di package.json).
- TIDAK mengubah semantik `resetDailyCounts` / `incrementDailyTask` / `decrementDailyTask`.
- TIDAK menyentuh komponen eisenhower (`eisenhower-matrix.tsx`, `quadrant.tsx`, `task-list.tsx`, `task-card.tsx`) atau weekly tasks — hanya dibaca sebagai referensi pattern.
- TIDAK menghapus fitur existing (rename, delete, add task, tombol increment/decrement).
- TIDAK memperkenalkan framework test baru; verifikasi via `tsc --noEmit` + `npm run build` + QA manual dev-server.
- TIDAK membuat halaman/stripe histori untuk weekly task — hanya daily tasks.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: **none** (repo tidak punya framework test; `npm test` adalah placeholder error). Verifikasi = `npx tsc --noEmit` (exit 0) + `npm run build` (exit 0) + QA manual agent-executed pada dev server (`npm run dev`) memakai Playwright MCP: drag-reorder persisten setelah reload, strip 7 hari tampil, modal 3 tab terbuka, edit target tersimpan.
- Evidence: `.omo/evidence/daily-tasks-sort-history-target/task-<N>-<nama>.<ext>` (screenshot/log QA per todo).

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: T1 (schema + types + sort + order task baru).
- Wave 2: T2 (server actions reorder + update target) — butuh field `order` dari T1.
- Wave 3: T3 (grid sortable) — butuh action reorder dari T2.
- Wave 4: T4 (strip 7 hari + modal histori) — file sama dengan T3 (`daily-task-card.tsx`), harus setelah T3 selesai.
- Wave 5: T5 (edit target count UI) — file sama (`daily-task-card.tsx`), harus setelah T4.
- Wave 6: T6 (verifikasi penuh: tsc + build + QA manual dev server).
- Semua todo SEQUENTIAL karena T3/T4/T5 mengedit file yang sama (`components/dashboard/daily-task-card.tsx`) — file conflict.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 | - | T2 | - |
| T2 | T1 | T3, T5 | - |
| T3 | T2 | T4, T5 | - |
| T4 | T3 | T5 | - |
| T5 | T2, T4 | T6 | - |
| T6 | T1-T5 | - | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. T1: Field `order` di model + types + sort & assignment
  What to do / Must NOT do:
  - `models/DailyTask.ts`: tambah `order: number` ke interface `IDailyTask` dan `order: { type: Number, default: 0 }` ke schema (tempatkan setelah `completedAt`, sebelum `history`). JANGAN ubah index unique yang ada.
  - `lib/types.ts`: tambah `order: number` ke interface `DailyTask` (setelah `completedAt`).
  - `app/actions/daily-task-actions.ts`:
    - `getDailyTasks`: ganti `.sort({ createdAt: 1 })` → `.sort({ order: 1, createdAt: 1 })` (fallback createdAt menjaga task lama yang `order`-nya default 0).
    - `createDailyTask`: sebelum create, hitung `order` berikutnya = (max `order` task user ini + 1) via `DailyTask.findOne({ userId }).sort({ order: -1 })`, default 0 jika tidak ada; masukkan ke dokumen baru.
  - Must NOT do: jangan migration script; jangan ubah reset/increment/decrement.
  Parallelization: Wave 1 | Blocked by: - | Blocks: T2
  References (executor has NO interview context - be exhaustive):
  - `models/DailyTask.ts:9-35` (interface + schema + index)
  - `models/Task.ts:8,19` (konvensi field `order` yang sudah ada)
  - `lib/types.ts:22-32` (interface DailyTask client)
  - `app/actions/daily-task-actions.ts:45-57` (getDailyTasks), `:59-85` (createDailyTask)
  Acceptance criteria (agent-executable): `npx tsc --noEmit` exit 0; grep membuktikan `order` ada di schema & kedua interface; `getDailyTasks` memakai sort `{ order: 1, createdAt: 1 }`.
  QA scenarios (name the exact tool + invocation): happy: `npx tsc --noEmit` → exit 0 (evidence: log). failure: grep `order` di `models/DailyTask.ts` kosong → todo GAGAL, perbaiki ulang. Evidence `.omo/evidence/daily-tasks-sort-history-target/task-1-tsc.log`.
  Commit: Y | feat(daily-tasks): add persistent order field to daily task model

- [x] 2. T2: Server actions `reorderDailyTasks` + `updateDailyTaskTarget`
  What to do / Must NOT do:
  - `app/actions/daily-task-actions.ts` tambah 2 action ("use server" sudah di header file):
    - `reorderDailyTasks(userId: string, orderedIds: string[])`: `dbConnect()`; untuk KESELAMATAN validasi tiap id milik `userId` (`DailyTask.findOne({ _id: id, userId })` — skip/reject id asing); lalu bulk update `order` = index array (loop `findByIdAndUpdate` atau `bulkWrite`). Return `{ success: true }` / `{ success: false }` (jangan throw ke client).
    - `updateDailyTaskTarget(id: string, targetCount: number)`: validasi `Number.isInteger` & `>= 1` (return `{ success: false, error: "Target harus bilangan bulat minimal 1" }`); fetch task; hitung `isComplete = task.currentCount >= targetCount`; update `{ targetCount, completed: isComplete, completedAt: isComplete ? (task.completedAt ?? new Date()) : null }`; `revalidatePath("/dashboard/daily-tasks")`; return `{ success: true, task: JSON.parse(JSON.stringify(updated)) }` atau `{ success: false, error }`.
  - Must NOT do: jangan ubah action existing; jangan return objek mongoose mentah (harus lewat `JSON.parse(JSON.stringify(...))` seperti action lain).
  Parallelization: Wave 2 | Blocked by: T1 | Blocks: T3, T5
  References (executor has NO interview context - be exhaustive):
  - `app/actions/daily-task-actions.ts:1-10` (header "use server", imports, pola return), `:166-230` (pola updateDailyTask: validasi + error handling + revalidatePath + E11000)
  - `app/actions/daily-task-actions.ts:87-119` (pola logika completed/completedAt di increment)
  - `models/DailyTask.ts:20-33` (schema)
  Acceptance criteria (agent-executable): `npx tsc --noEmit` exit 0; kedua fungsi tervalidasi kepemilikan/integer; return shape konsisten `{ success, ... }`.
  QA scenarios: happy: `npx tsc --noEmit` exit 0 + grep kedua nama fungsi ada. failure: `updateDailyTaskTarget` menerima 0/negatif → harus return success:false (review kode). Evidence `.omo/evidence/daily-tasks-sort-history-target/task-2-tsc.log`.
  Commit: Y | feat(daily-tasks): add reorder and target-update server actions

- [x] 3. T3: Grid kartu sortable (drag & drop persisten)
  What to do / Must NOT do:
  - `components/dashboard/daily-task-card.tsx`: bungkus root `<div>` kartu dengan `useSortable({ id: taskId })` dari `@dnd-kit/sortable` — `setNodeRef`, `transform`, `transition`, `isDragging` (opacity/visual saat drag). Ikuti PERSIS pattern `components/dashboard/task-card.tsx:31-60`. Sensor: `PointerSensor` dengan `activationConstraint: { distance: 8 }` + `KeyboardSensor` + `sortableKeyboardCoordinates` (pattern `eisenhower-matrix.tsx:3,152`).
  - `components/dashboard/daily-task-list.tsx`: bungkus grid `<div className="grid ...">` dengan `<DndContext sensors collisionDetection={closestCenter} onDragEnd>` + `<SortableContext items={taskIds} strategy={rectSortingStrategy}>` (rectSortingStrategy = urutan grid kiri-ke-kanan, atas-ke-bawah). `onDragEnd`: jika `active.id !== over.id` → `arrayMove` state lokal (optimistic) → panggil `reorderDailyTasks(userId, newOrderedIds)`; jika gagal (`success:false` atau throw) → kembalikan state ke snapshot urutan sebelum drag.
  - Must NOT do: jangan menambah dependency; jangan mengubah handler increment/decrement/rename/delete yang ada; jangan pakai `verticalListSortingStrategy` (layout-nya grid).
  Parallelization: Wave 3 | Blocked by: T2 | Blocks: T4, T5
  References (executor has NO interview context - be exhaustive):
  - `components/dashboard/task-card.tsx:1-60` (pattern useSortable di kartu)
  - `components/dashboard/task-list.tsx:1-40` (pattern SortableContext di list)
  - `components/dashboard/eisenhower-matrix.tsx:1-30,110-160` (pattern DndContext + sensors + arrayMove + DragEndEvent)
  - `components/dashboard/daily-task-list.tsx:12-20,140-162` (state + grid render)
  - `components/dashboard/daily-task-card.tsx:17-25,84-90` (root card div)
  - `app/actions/daily-task-actions.ts` (signature reorderDailyTasks dari T2)
  Acceptance criteria (agent-executable): `npx tsc --noEmit` exit 0; `npm run build` exit 0; di dev server, drag kartu A ke posisi B → urutan berubah, reload halaman → urutan PERSISTEN (terbaca dari DB).
  QA scenarios: happy: Playwright — buka `/dashboard/daily-tasks`, drag kartu pertama ke posisi kedua, screenshot, reload, screenshot → urutan sama (evidence `.omo/evidence/daily-tasks-sort-history-target/task-3-drag-persist.png`). failure: drag lalu reload → urutan kembali = persistensi gagal → cek network call `reorderDailyTasks` & field order, perbaiki. Evidence `.omo/evidence/daily-tasks-sort-history-target/task-3-*.png`.
  Commit: Y | feat(daily-tasks): drag-and-drop card sorting with persisted order

- [x] 4. T4: Strip histori 7 hari + modal detail (7 Hari / 1 Bulan / 1 Tahun)
  What to do / Must NOT do:
  - `components/dashboard/daily-task-card.tsx`: GANTI blok histori lama (`:210-231`, tombol "Lihat Riwayat" + list expand) dengan strip satu baris 7 sel: hitung 7 tanggal terakhir WIB (hari ini dari `getWibTodayString` pola `lib/dates.ts:26-31`, mundur 6 hari via `Date.UTC` arithmetic seperti `lib/dates.ts:49-52`); sel = kotak kecil; terisi/check hijau jika `history` punya entry tanggal itu dengan `completedCount >= task.targetCount`; hari ini check jika `currentCount >= targetCount`; hari tanpa data = abu redup. Tampilkan label hari (S S R K J S M atau angka tanggal). Seluruh strip clickable → `setShowHistoryModal(true)`.
  - File BARU `components/dashboard/daily-task-history-modal.tsx` ("use client"): modal overlay (pattern modal add-task di `daily-task-list.tsx:107-138`), props `{ task, open, onClose }`, 3 tab state: "7 Hari" (daftar 7 hari: tanggal id-ID, ikon check/uncheck, `completedCount/targetCount`), "1 Bulan" (grid kalender bulan berjalan WIB: 7 kolom Sen-Min, sel hari dengan check jika histori tercapai, hari tanpa data kosong), "1 Tahun" (12 baris bulan berjalan mundur: nama bulan id-ID + jumlah hari tercapai dari `task.history`). Tutup dengan tombol X / klik overlay / Escape.
  - Must NOT do: jangan hapus fitur rename/delete/increment; jangan fetch data baru dari server (semua dari `task.history` + `currentCount` yang sudah ada di props); jangan pakai library kalender baru.
  Parallelization: Wave 4 | Blocked by: T3 | Blocks: T5
  References (executor has NO interview context - be exhaustive):
  - `components/dashboard/daily-task-card.tsx:20-24,67-82,210-231` (state histori lama yang diganti + formatHistoryDate yang bisa dipakai ulang)
  - `components/dashboard/daily-task-list.tsx:107-138` (pattern modal overlay)
  - `lib/dates.ts:1-53` (helper WIB: getWibTodayString, pola Date.UTC)
  - `lib/types.ts:16-32` (DailyHistoryEntry: date string YYYY-MM-DD, completedCount)
  - `models/DailyTask.ts:3-7` (bentuk entry histori di DB)
  Acceptance criteria (agent-executable): `npx tsc --noEmit` exit 0; `npm run build` exit 0; strip menampilkan tepat 7 sel; klik strip → modal terbuka dengan 3 tab berfungsi; Escape menutup modal.
  QA scenarios: happy: Playwright — screenshot kartu dengan strip 7 sel; klik strip → screenshot modal tab 7 Hari; klik tab 1 Bulan & 1 Tahun → screenshot masing-masing (evidence `.omo/evidence/daily-tasks-sort-history-target/task-4-*.png`). failure: modal tidak bisa ditutup dengan Escape → perbaiki handler keydown. Evidence `.omo/evidence/daily-tasks-sort-history-target/task-4-*.png`.
  Commit: Y | feat(daily-tasks): 7-day history strip with detail modal (week/month/year)

- [x] 5. T5: Edit target count di kartu
  What to do / Must NOT do:
  - `components/dashboard/daily-task-card.tsx`: di baris Progress (`:154-167`), tambah tombol edit kecil (ikon pensil lucide-react, sudah dipakai `Loader2` di file ini) di samping teks `{currentCount} / {targetCount}`. Klik → mode edit inline: `<input type="number" min={1}>` berisi target sekarang + tombol Save/Cancel (pattern persis edit nama di `:88-123`: Enter=save, Escape=cancel, error merah). Save → panggil `updateDailyTaskTarget(taskId, newTarget)`; jika `success` → update state task di `daily-task-list.tsx` lewat callback baru `onUpdateTarget(taskId, newTarget)` (tambahkan handler `handleUpdateTarget` di list yang memetakan `targetCount`, `completed`, `completedAt` dari response — pattern `handleIncrement` `:38-52`); jika gagal → tampilkan `error` dari response.
  - Progress bar otomatis ikut karena dihitung dari `task.targetCount` (`:19`).
  - Must NOT do: jangan buat modal terpisah (inline edit saja); jangan validasi di client saja (server action T2 sudah validasi); jangan ubah tombol increment/decrement.
  Parallelization: Wave 5 | Blocked by: T2, T4 | Blocks: T6
  References (executor has NO interview context - be exhaustive):
  - `components/dashboard/daily-task-card.tsx:19,44-65,88-123,154-167` (progress row + pattern inline edit nama)
  - `components/dashboard/daily-task-list.tsx:38-52,75-94,146-158` (pattern handler + pass callback ke card)
  - `app/actions/daily-task-actions.ts` (signature `updateDailyTaskTarget` dari T2, return `{ success, task }`)
  Acceptance criteria (agent-executable): `npx tsc --noEmit` exit 0; `npm run build` exit 0; di dev server: edit target 10 → 3 saat currentCount 3 → kartu langsung jadi completed (✓ + progress penuh); edit ke 0 → error "Target harus bilangan bulat minimal 1" tampil.
  QA scenarios: happy: Playwright — klik edit, isi 3, Save, screenshot kartu completed; reload → target tetap 3 (evidence `.omo/evidence/daily-tasks-sort-history-target/task-5-target-edit.png`). failure: isi 0 → Save → pesan error tampil, nilai lama tetap (evidence `.omo/evidence/daily-tasks-sort-history-target/task-5-target-invalid.png`).
  Commit: Y | feat(daily-tasks): inline target count editing on task card

- [x] 6. T6: Verifikasi penuh + QA manual end-to-end
  What to do / Must NOT do:
  - Jalankan `npx tsc --noEmit` (harus exit 0) dan `npm run build` (harus exit 0).
  - Jalankan `npm run dev`, buka `/dashboard/daily-tasks` (login akun test yang ada), lakukan SATU alur lengkap: (a) drag 2 kartu tukar posisi → reload → urutan persisten; (b) strip 7 hari tampil di tiap kartu; (c) klik strip → modal 3 tab; (d) edit target → completed terhitung ulang; (e) increment/decrement/rename/delete/add masih berfungsi (regresi).
  - Must NOT do: jangan perbaiki bug dengan mengubah scope di luar rencana; jika ada regresi fitur existing, perbaiki minimal dan catat.
  Parallelization: Wave 6 | Blocked by: T1-T5 | Blocks: Final wave
  References (executor has NO interview context - be exhaustive):
  - Semua file yang diubah T1-T5; `package.json:8-9` (scripts dev/build)
  Acceptance criteria (agent-executable): tsc exit 0 + build exit 0 + kelima langkah QA (a-e) terbukti via screenshot di `.omo/evidence/daily-tasks-sort-history-target/task-6-*.png`.
  QA scenarios: happy: seluruh alur (a-e) sukses. failure: salah satu langkah gagal → perbaiki, ulangi langkah gagal tersebut sampai lulus. Evidence `.omo/evidence/daily-tasks-sort-history-target/task-6-*.png`.
  Commit: Y | chore(daily-tasks): verify sorting, history strip, and target editing end-to-end

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [x] F1. Plan compliance audit
- [x] F2. Code quality review
- [x] F3. Real manual QA
- [x] F4. Scope fidelity

## Commit strategy
- Satu commit per todo (T1-T6), conventional commits dengan scope `daily-tasks` (lihat baris Commit tiap todo).
- Urutan commit = urutan wave (T1 → T6); tidak ada commit gabungan.
- Jangan commit file di luar scope: `models/DailyTask.ts`, `lib/types.ts`, `app/actions/daily-task-actions.ts`, `components/dashboard/daily-task-list.tsx`, `components/dashboard/daily-task-card.tsx`, `components/dashboard/daily-task-history-modal.tsx` (baru), `.omo/plans/*`, `.omo/evidence/*`.

## Success criteria
1. Kartu daily task bisa di-drag untuk menentukan prioritas; urutan tersimpan di DB dan bertahan setelah reload (grid kiri-ke-kanan, atas-ke-bawah).
2. Setiap kartu menampilkan strip histori 7 hari (check/uncheck) dalam satu baris.
3. Strip bisa diklik → modal histori dengan tab 7 Hari / 1 Bulan / 1 Tahun.
4. Target count bisa diedit langsung di kartu; status completed terhitung ulang otomatis.
5. Semua fitur existing (add, increment, decrement, rename, delete) tetap berfungsi.
6. `npx tsc --noEmit` dan `npm run build` exit 0; bukti QA berupa screenshot tersimpan di `.omo/evidence/daily-tasks-sort-history-target/`.
