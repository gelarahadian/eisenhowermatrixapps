# update-daily-task-title - Work Plan

## TL;DR (For humans)

**What you'll get:** Tombol "Edit" di card daily task → judul bisa diubah langsung inline (input + Save/Cancel), tersimpan ke MongoDB, tampil langsung di UI tanpa reload. Nama duplikat dan nama kosong ditolak dengan pesan error yang jelas.

**Why this approach:** Mengikuti dua konvensi yang sudah ada di repo: server action gaya `updateTask` (`app/actions/task-actions.ts:34`) dan inline-edit gaya deadline di `TaskCard` (`components/dashboard/task-card.tsx:64-146`). Tidak ada dependency baru, tidak ada perubahan schema.

**What it will NOT do:** Tidak mengubah targetCount/progress/riwayat, tidak mengubah halaman lain, tidak menambah framework test, tidak menambah auth check baru (mengikuti konvensi action yang sudah ada).

**Effort:** Kecil — 3 file, 1 file tidak tersentuh di luar itu.

**Risk:** Rendah. Satu failure path nyata: unique index `{userId, date, name}` → rename ke nama yang sudah ada hari ini harus ditangani (pre-check + catch E11000).

**Decisions:** Inline-edit di card (dipilih user); test strategy = none + agent QA (dipilih user); rename boleh dilakukan pada task yang completed; scope hanya judul.

## Scope

**IN:**
- Server action baru `updateDailyTask(id, name)` di `app/actions/daily-task-actions.ts`
- Inline edit judul di `components/dashboard/daily-task-card.tsx` (tombol Edit → input + Save/Cancel + pesan error)
- Wiring handler + state di `components/dashboard/daily-task-list.tsx`
- Validasi: trim, non-empty, duplikat ditolak (kecuali nama identik dengan nama saat ini)
- Agent-executed QA: typecheck/build + verifikasi runtime

**OUT (Must-NOT-Have):**
- Edit targetCount, currentCount, completed, history, date, atau field apa pun selain `name`
- Modal dialog untuk rename (user memilih inline-edit)
- Framework test baru (vitest/jest/dll) atau dependency apa pun
- Perubahan schema `models/DailyTask.ts`, index, atau file di luar Scope IN
- Auth/ownership check baru (konvensi repo: action hanya terima id; jangan tambahkan)
- Perubahan pada delete/increment/decrement/create action yang sudah ada

## Verification strategy

- **Test strategy: none** (tanpa framework) + **agent-executed QA** — setiap todo punya QA happy + failure dengan tool, invocation, dan evidence path eksplisit.
- Typecheck/build: `npx tsc --noEmit` dan `npx next build` dari `/home/lar/EisenHowerApp`.
- Runtime QA: `npm run dev` → `/auth/signin` login → `/dashboard/daily-tasks` → jalankan skenario happy/failure via browser (Playwright/agent-browser), screenshot + log disimpan di `.omo/evidence/update-daily-task-title/`.
- Jika runtime butuh Mongo/Auth yang tidak tersedia di environment: fallback = typecheck/build + code-level verification, dicatat eksplisit di evidence sebagai `runtime_unavailable` (bukan klaim lulus tanpa bukti).

## Execution strategy

Dependency: Todo 1 (action) → Todo 3 (list wiring memanggil action). Todo 2 (card UI) independen terhadap Todo 1 secara compile (menerima callback), tapi QA end-to-end butuh keduanya. Urutan: 1 → 2 → 3 → 4 (QA menyeluruh).

Wave:
- Wave 1: Todo 1, Todo 2
- Wave 2: Todo 3
- Wave 3: Todo 4 (build + runtime QA)
- Final verification wave: F1–F4 paralel

## Todos

- [x] 1. Server action `updateDailyTask` di `app/actions/daily-task-actions.ts`
  - **What:** Tambah export `updateDailyTask(id: string, name: string)` di `app/actions/daily-task-actions.ts` setelah `deleteDailyTask` (setelah baris 164). Logic: `dbConnect()`; `DailyTask.findById(id)` → jika tidak ada return `{ success: false, error: "Task not found" }`; `const trimmed = name.trim()`; jika `trimmed.length === 0` return `{ success: false, error: "Nama tidak boleh kosong" }`; jika `trimmed === task.name` return `{ success: true, task: JSON.parse(JSON.stringify(task)) }` (no-op, lolos tanpa update); cek duplikat `DailyTask.findOne({ userId: task.userId, date: task.date, name: trimmed, _id: { $ne: id } })` → jika ketemu return `{ success: false, error: "Nama sudah dipakai task lain hari ini" }`; `DailyTask.findByIdAndUpdate(id, { name: trimmed }, { new: true })` dibunggu try/catch — jika catch error dengan `code === 11000` return `{ success: false, error: "Nama sudah dipakai task lain hari ini" }`, error lain rethrow/log dan return `{ success: false, error: "Gagal menyimpan" }`. Sukses: `revalidatePath("/dashboard/daily-tasks")` lalu return `{ success: true, task: JSON.parse(JSON.stringify(updated)) }`.
  - **References:** `app/actions/daily-task-actions.ts` (pola semua action di file ini: `dbConnect`, `revalidatePath("/dashboard/daily-tasks")`, `JSON.parse(JSON.stringify(...))`); `app/actions/task-actions.ts:34-47` (pola `updateTask`); `models/DailyTask.ts:21` (`name` required), `models/DailyTask.ts:35` (unique index `{userId, date, name}` → sumber E11000), `models/DailyTask.ts:9-18` (`IDailyTask` punya `userId`, `date`); gap-analysis #1 (no-op rename), #2 (race E11000), #3 (return shape).
  - **Acceptance:**
    - [x] `npx tsc --noEmit` lulus dari `/home/lar/EisenHowerApp`.
    - [x] Return selalu object `{ success: boolean, ... }` — tidak pernah throw untuk kasus bisnis (not found / empty / duplikat).
    - [x] Rename ke nama identik → `success: true` tanpa update DB.
    - [x] Nama kosong/whitespace-only → `success: false` + pesan, DB tidak berubah.
    - [x] Nama duplikat dengan task lain hari ini → `success: false` + pesan, DB tidak berubah.
  - **QA:**
    - Happy: `npx tsc --noEmit` → evidence `.omo/evidence/update-daily-task-title/todo1-tsc.txt` (exit code + output). Runtime (jika tersedia): rename task lewat UI → nama berubah setelah reload → screenshot `todo1-rename-ok.png`.
    - Failure: via UI, isi nama task lain yang sudah ada → Save → pesan error tampil, nama lama bertahan → screenshot `todo1-rename-dup.png`. Nama kosong → Save disabled (terverifikasi di Todo 2). Evidence index dicatat di `todo1-qa.md`.
  - **Commit:** `feat(daily-tasks): add updateDailyTask rename server action`

- [x] 2. Inline edit judul di `components/dashboard/daily-task-card.tsx`
  - **What:** Di `daily-task-card.tsx`: (a) tambah props `onRename?: (taskId: string, newName: string) => Promise<{ success: boolean; error?: string }>` dan `isRenaming?: boolean` ke `Props` (baris 6-13); (b) tambah state `isEditingName` (boolean), `draftName` (string), `editError` (string | null); (c) di header (baris 58-73), tambah tombol "Edit" berwarna biru (`text-blue-600 hover:text-blue-700`) sebelah kiri tombol Delete, tampil hanya saat `!isEditingName`; klik → `setDraftName(task.name); setEditError(null); setIsEditingName(true)`; (d) saat `isEditingName`, ganti `<h3>` dengan blok edit: `<input value={draftName} ...>` auto-focus, `<p>` merah untuk `editError`, baris tombol "Save" (`bg-blue-600 text-white`, label "Saving..." + spinner `Loader2 animate-spin` saat `isRenaming`, disabled saat `isRenaming || draftName.trim().length === 0`) dan "Cancel" (border); (e) handler Save: `const res = await onRename?.(taskId, draftName)`; jika `res?.success === false` → `setEditError(res.error || "Gagal menyimpan")` dan biarkan form terbuka; jika success → `setIsEditingName(false); setEditError(null)`; (f) Cancel: `setDraftName(task.name); setEditError(null); setIsEditingName(false)` (gap-analysis #5). Saat `isEditingName`, sembunyikan tombol Edit. Layout header tetap `flex justify-between items-start`; grup tombol Edit+Delete dalam satu `div flex gap-2 ml-2`.
  - **References:** `components/dashboard/daily-task-card.tsx:6-13` (Props), `:16` (taskId), `:58-73` (header/h3/Delete); **template utama:** `components/dashboard/task-card.tsx:33-34,64-79,124-146` (pola isEditing + draft + Save/Cancel + input panel); `components/dashboard/daily-task-card.tsx:2-3` (sudah import `useState`, `Loader2`); gap-analysis #4 (disable saat renaming), #5 (reset draft).
  - **Acceptance:**
    - [x] `npx tsc --noEmit` lulus.
    - [x] Klik Edit → input muncul terprefill nama saat ini, tombol Save disabled jika draft kosong/whitespace.
    - [x] Save dengan `isRenaming=true` menampilkan "Saving..." dan men-disable Save/Cancel/Edit (tidak bisa double-submit).
    - [x] `onResolve` failure → form tetap terbuka + pesan error merah tampil; success → form tertutup.
    - [x] Cancel → form tertutup, draft ter-reset, tidak memanggil `onRename`.
    - [x] Tidak ada perubahan di progress bar, tombol count, riwayat, atau Delete behavior.
  - **QA:**
    - Happy: runtime — klik Edit, ubah nama, Save → judul card berubah, form tertutup → screenshot `todo2-inline-edit-ok.png`. Jika runtime unavailable: `npx tsc --noEmit` + review diff vs template `task-card.tsx` → `todo2-tsc.txt` + `todo2-code-review.md`.
    - Failure: draft kosong → Save disabled (screenshot `todo2-save-disabled.png`); Cancel setelah edit tidak tersimpan → nama lama tetap (screenshot `todo2-cancel.png`).
  - **Commit:** `feat(daily-tasks): add inline title edit UI to DailyTaskCard`

- [x] 3. Wiring `handleRename` di `components/dashboard/daily-task-list.tsx`
  - **What:** Di `daily-task-list.tsx`: (a) import `updateDailyTask` dari `@/app/actions/daily-task-actions` (baris 6, gabungkan ke import yang ada); (b) tambah state `pendingRenameTaskId: string | null`; (c) tambah handler `handleRename = async (taskId: string, newName: string): Promise<{ success: boolean; error?: string }> => { setPendingRenameTaskId(taskId); try { const res = await updateDailyTask(taskId, newName); if (res.success && res.task) { setTasks(prev => prev.map(t => (((t as any)._id || t.id) === taskId ? { ...t, name: res.task.name } : t))); } return res; } catch { return { success: false, error: "Gagal menyimpan" }; } finally { setPendingRenameTaskId(null); } }` — pola id-match persis seperti `handleIncrement` baris 42-46 (gap-analysis #6); (d) teruskan `onRename={handleRename}` dan `isRenaming={pendingRenameTaskId === ((task as any)._id || task.id)}` ke `<DailyTaskCard>` (baris 125-133).
  - **References:** `components/dashboard/daily-task-list.tsx:6` (import), `:14-15` (state pattern), `:37-51` (`handleIncrement` — pola pending + map + id-match), `:124-134` (props ke card); `app/actions/daily-task-actions.ts` (return shape dari Todo 1); gap-analysis #6 (`_id` vs `id`).
  - **Acceptance:**
    - [x] `npx tsc --noEmit` lulus.
    - [x] Sukses rename → state `tasks` ter-update (nama baru tampil tanpa reload), `pendingRenameTaskId` kembali null.
    - [x] Gagal rename (duplikat) → state tasks TIDAK berubah, error diteruskan ke card.
    - [x] `pendingRenameTaskId` benar per-task: hanya card yang sedang rename yang `isRenaming=true`.
  - **QA:**
    - Happy: runtime — rename lewat UI, nama berubah langsung tanpa refresh → screenshot `todo3-list-rename-ok.png` (+ `todo3-qa.md` mencatat langkah). Jika runtime unavailable: `npx tsc --noEmit` + code review alur → `todo3-tsc.txt` + `todo3-code-review.md`.
    - Failure: rename ke nama duplikat → pesan error tampil di card, daftar tidak berubah → screenshot `todo3-rename-dup.png`.
  - **Commit:** `feat(daily-tasks): wire rename handler into DailyTaskList`

- [x] 4. Typecheck, build, dan runtime QA menyeluruh
  - **What:** Dari `/home/lar/EisenHowerApp`: jalankan `npx tsc --noEmit` lalu `npx next build`; jika keduanya lulus dan environment mendukung (Mongo + auth tersedia), jalankan `npm run dev` dan jalankan skenario end-to-end penuh di `/dashboard/daily-tasks`: (1) rename valid → berubah & persist setelah reload; (2) rename ke nama task lain hari ini → error, tidak berubah; (3) draft kosong → Save disabled; (4) Cancel → tidak ada perubahan; (5) rename task completed → boleh; (6) count/progress/history/Delete masih berfungsi normal (regresi). Semua output + screenshot masuk `.omo/evidence/update-daily-task-title/`. Jika runtime tidak tersedia, catat `runtime_unavailable` dengan alasan di `final-qa.md` — jangan mengklaim lulus runtime tanpa bukti.
  - **References:** Seluruh Scope IN; `package.json` (tidak ada script test — jangan coba `npm test`); `.env.local` (cek kredensial Mongo untuk menentukan kelayakan runtime).
  - **Acceptance:**
    - [x] `npx tsc --noEmit` exit 0 → `evidence/final-tsc.txt`.
    - [x] `npx next build` exit 0 → `evidence/final-build.txt`.
    - [x] Semua 6 skenario QA di atas punya verdict tertulis di `evidence/final-qa.md` (lulus / gagal / runtime_unavailable + alasan).
  - **QA:**
    - Happy: kedua command exit 0 + minimal 1 skenario runtime terekam (atau fallback dicatat jujur).
    - Failure: jika build/tsc gagal → perbaiki dulu sebelum lanjut; evidence error disimpan `evidence/final-fail-*.txt`.
  - **Commit:** `chore(daily-tasks): record QA evidence for rename feature` (hanya file evidence; jika tidak ada perubahan kode, gabung ke commit terakhir)

## Final verification wave

- [x] F1. Plan compliance audit — baca plan + diff aktual; verifikasi setiap baris Scope IN ada di diff dan tidak ada satu pun item Must-NOT-Have yang masuk (terutama: tidak ada perubahan `models/DailyTask.ts`, tidak ada edit field selain `name`, tidak ada dependency baru). Evidence: `evidence/F1-compliance.md`.
- [x] F2. Code quality review — review diff terhadap konvensi file yang ada (pola action di `daily-task-actions.ts`, pola inline-edit di `task-card.tsx`, pola handler di `daily-task-list.tsx`); cek tidak ada `any` baru yang tidak perlu, tidak ada dead state, error message konsisten bahasa Indonesia. Evidence: `evidence/F2-quality.md`.
- [x] F3. Real manual QA — jalankan ulang skenario Todo 4 di environment nyata (atau konfirmasi `runtime_unavailable` dengan bukti tsc/build); verifikasi rename persist setelah reload dan duplicate error tampil. Evidence: `evidence/F3-qa.md` + screenshot.
- [x] F4. Scope fidelity — pastikan hanya 3 file produk yang berubah (`daily-task-actions.ts`, `daily-task-card.tsx`, `daily-task-list.tsx`) + evidence; `git status`/`git diff --stat` bersih dari file lain. Evidence: `evidence/F4-scope.md`.

## Commit strategy

- Commit per todo (3 commit fitur + 1 commit evidence), conventional commits, bahasa Indonesia ringkas seperti tercantum di tiap todo.
- Jangan campur perubahan file lain (worktree dirty) ke dalam commit ini.
- Commit terakhir hanya berisi `.omo/evidence/` jika memang ada.

## Success criteria

1. User klik "Edit" di card daily task → input judul muncul prefilled → Save → judul baru tampil dan persist setelah reload.
2. Nama kosong/whitespace tidak bisa disimpan (Save disabled atau ditolak dengan pesan).
3. Nama duplikat dengan task lain pada hari yang sama → pesan error jelas, data tidak berubah (termasuk saat race E11000).
4. Cancel tidak mengubah apa pun; double-submit tidak mungkin saat renaming.
5. Rename berlaku juga untuk task completed; progress/count/history/Delete tidak terpengaruh.
6. `npx tsc --noEmit` dan `npx next build` lulus; semua QA punya evidence path.
7. Diff produk hanya menyentuh 3 file dalam Scope IN.
