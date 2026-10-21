# spinner-loading-increment - Work Plan

## TL;DR (For humans)

(What you'll get) Saat klik "+ Count One" pada daily task, tombol menampilkan **ikon spinner muter** (`Loader2` lucide-react + `animate-spin`) selama server action berjalan, lalu kembali normal. Tombol disabled selama loading — mencegah double-click yang menyebabkan count nambah dobel.

(Why this approach) `handleIncrement` di `daily-task-list.tsx` saat ini tidak punya loading state sama sekali. Melacak `pendingTaskId` di list (pemilik state tasks) dan mengirim prop boolean ke card adalah pola React minimal — tanpa library, tanpa ubah server action.

(What it will NOT do) Tidak menambah library, tidak mengubah `daily-task-actions.ts`, tidak menyentuh tombol "− Kurangi" / Delete / form Add Task, tidak mengubah styling lain.

(Effort) ~15 menit, 2 file komponen.

(Risk) Sangat rendah — perubahan murni UI state; logika increment tidak berubah.

(Decisions) D1: hanya tombol increment yang dapat spinner (sesuai permintaan user). D2: disabled saat pending = ya (bug dobel-count ikut tertutup). D3: ikon `Loader2` (terverifikasi tersedia di lucide-react terpasang).

## Scope

**IN:**
- `components/dashboard/daily-task-list.tsx`: state `pendingTaskId: string | null`; `handleIncrement` set sebelum `await` dan reset di `finally`; prop `isIncrementing={pendingTaskId === taskId}` dikirim ke `DailyTaskCard`.
- `components/dashboard/daily-task-card.tsx`: props interface tambah `isIncrementing?: boolean`; tombol increment saat `isIncrementing` render `<Loader2 size={16} className="animate-spin" />` (import dari `lucide-react`) menggantikan teks "+ Count One", dan `disabled` saat `isIncrementing || task.completed`.
- **Perluasan (disetujui user, pola identik):** state `pendingDecrementTaskId` + `handleDecrement` try/finally + prop `isDecrementing`; tombol "− Kurangi" spinner saat `isDecrementing`, disabled saat `isDecrementing || task.completed || task.currentCount === 0`.

**OUT (Must-NOT-Have):**
- Tidak menambah dependency npm.
- Tidak mengubah `app/actions/daily-task-actions.ts` atau model/schema.
- Tidak mengubah tombol decrement/delete, form Add Task, progress bar, atau styling lain.
- Tidak menambah test framework.

## Verification strategy

Repo tidak punya test runner. QA agent-executed:
1. `npm run build` → exit 0.
2. Verifikasi logika state via inspeksi diff: set → await → finally reset (tidak ada jalur yang meninggalkan spinner menyala selamanya, termasuk saat server action throw).
3. Manual QA: `npm run dev` + buka `/dashboard/daily-tasks` (login dulu) — klik "+ Count One", amati spinner muncul lalu hilang; klik cepat 2x saat loading → count hanya nambah 1. Evidence: log dev server + catatan observasi.

## Execution strategy

Sequential (kedua file satu rantai: list mengirim prop → card mengonsumsi). Eksekusi langsung oleh orchestrator sesuai override user (infrastruktur subagent rusak: `task()` abort, model reviewer tidak tersedia) — atau via worker jika infrastruktur pulih.

## Todos

- [x] 1. Tambah loading state increment di `daily-task-list.tsx` + spinner di `daily-task-card.tsx`
  - References: `components/dashboard/daily-task-list.tsx:35-44` (`handleIncrement` yang diberi pending state), `:112-120` (pemanggilan `DailyTaskCard`); `components/dashboard/daily-task-card.tsx:5-10` (Props interface), `:94-104` (tombol increment); `package.json` (`lucide-react` sudah terpasang, `Loader2` terverifikasi ada).
  - Acceptance:
    - `daily-task-list.tsx`: `const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);` — `handleIncrement` menjadi: `setPendingTaskId(taskId); try { const updated = await incrementDailyTask(taskId); setTasks(...); } finally { setPendingTaskId(null); }` — reset di `finally`, bukan hanya setelah await.
    - Prop dikirim: `isIncrementing={pendingTaskId === ((task as any)._id || task.id)}`.
    - `daily-task-card.tsx`: `interface Props` tambah `isIncrementing?: boolean;` dan destructure di signature; import `import { Loader2 } from 'lucide-react';`.
    - Tombol increment (className biru): `disabled={task.completed || isIncrementing}`; konten: `{isIncrementing ? <Loader2 size={16} className="animate-spin" /> : task.completed ? '✓ Completed' : '+ Count One'}`.
  - QA happy: build exit 0; diff menunjukkan set→await→finally lengkap. Evidence: output build + `git diff`.
  - QA failure: simulasi server action throw — `finally` tetap mereset spinner (inspeksi kode: reset ada di `finally`). Evidence: inspeksi diff.
  - Commit: `feat: show spinner on increment button while loading`

- [x] 2. Perluasan: spinner + disabled juga pada tombol "− Kurangi" (pola identik, disetujui user)
  - References: `components/dashboard/daily-task-list.tsx:46-55` (`handleDecrement`), `:112-121` (pemanggilan `DailyTaskCard`); `components/dashboard/daily-task-card.tsx` (Props interface + tombol decrement).
  - Acceptance: `pendingDecrementTaskId` state; `handleDecrement` set→await→`finally` reset; prop `isDecrementing` dikirim; tombol decrement: `disabled={task.completed || task.currentCount === 0 || isDecrementing}`, konten spinner `<Loader2 size={16} className="animate-spin" />` saat `isDecrementing`, else "− Kurangi".
  - QA happy: build exit 0; diff menunjukkan pola try/finally sama dengan increment. Evidence: output build + `git diff`.
  - QA failure: server action throw → `finally` mereset spinner. Evidence: inspeksi diff.
  - Commit: `feat: show spinner on decrement button while loading`

## Final verification wave

- [x] F1. Plan compliance audit — hanya 2 file di Scope yang berubah. Evidence: `git diff --stat`.
- [x] F2. Code quality review — tanpa `as any` baru, tanpa TODO, reset di `finally`. Evidence: grep + inspeksi diff.
- [x] F3. Real manual QA — build exit 0 + dev server: spinner muncul saat klik dan hilang setelah selesai; double-click saat loading tidak menambah count dobel. Evidence: log dev server + observasi.
- [x] F4. Scope fidelity — `package.json` tidak berubah; tidak ada file lain tersentuh. Evidence: `git status` + `git diff package.json`.

## Commit strategy

Satu commit: `feat: show spinner on increment button while loading` (kedua file satu perubahan kohesif). `.omo` state di commit chore terpisah.

## Success criteria

- `npm run build` exit 0.
- Spinner tampil saat increment berjalan dan hilang setelahnya (termasuk saat error).
- Double-click saat loading tidak menghasilkan increment ganda.
- Hanya 2 file di Scope yang berubah; `package.json` bersih.
