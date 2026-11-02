---
slug: update-daily-task-title
intent: clear
review_required: false
classification: standard
status: exploring
created: 2026-11-02
---

# Draft: Update feature pada card daily task (judul bisa diubah)

## Request (verbatim)
"sekarang saya mau membuat feature update pada card dayli task jadi judul nya bisa di ubah"

## Components ledger (topology lock)
| id | outcome | status | evidence |
|----|---------|--------|----------|
| C1 | Server action rename `updateDailyTask` di `app/actions/daily-task-actions.ts` | known | file has create/increment/decrement/delete, NO update; pattern: `updateTask` di `app/actions/task-actions.ts:34` |
| C2 | UI edit judul pada `components/dashboard/daily-task-card.tsx` | known | `<h3>{task.name}</h3>` baris 60-65, tidak ada affordance edit; pola inline-edit ada di `components/dashboard/task-card.tsx:64-79,124-146` |
| C3 | Wiring handler + state di `components/dashboard/daily-task-list.tsx` | known | pola `handleIncrement/handleDelete` baris 37-72; add modal baris 85-116 |

## Key facts (explored)
- Schema `models/DailyTask.ts:35` — unique compound index `{ userId, date, name }` → rename ke nama yang sudah ada hari ini = duplicate key error → WAJIB ditangani (validasi/400-style friendly error).
- `name: { type: String, required: true }` — empty/whitespace harus ditolak.
- Tidak ada test infra: `package.json` script `test` = exit 1, zero `*.test.*` files.
- Server action pattern: `"use server"`, `dbConnect()`, `findByIdAndUpdate(..., { new: true })`, `revalidatePath("/dashboard/daily-tasks")`, return `JSON.parse(JSON.stringify(...))`.
- ID handling: `(task as any)._id || task.id` konsisten di list & card.
- Rename berlaku lintas hari (dokumen persist, `date` di-update oleh reset harian) — nama ikut bertahan, tidak perlu logika khusus.

## Surviving forks — RESOLVED (2026-11-02)
1. Pola UI edit → **Inline-edit di card** (tombol Edit → input + Save/Cancel, ikut pola `task-card.tsx:64-79,124-146`). [user answer]
2. Test strategy → **None + agent QA** (tsc/next build + runtime QA; tanpa test framework baru). [user answer]

## Adopted defaults (tidak ditanya)
- Scope: HANYA judul (`name`). Must-NOT-Have: edit targetCount, edit progress, delete-lain, dsb.
- Task completed tetap boleh di-rename (nama orthogonal dengan progres).
- Duplicate name → tolak dengan pesan error jelas di UI (dipaksa oleh unique index `{userId,date,name}`).
- Nama wajib non-empty setelah trim.

## Approval gate
status: plan-written (approved 2026-11-02; plan file: `.omo/plans/update-daily-task-title.md`)
approach:
- C1: `updateDailyTask(id, name)` server action di `app/actions/daily-task-actions.ts` — trim+validate non-empty, cek duplikat (unique index) → friendly error, `findByIdAndUpdate({name}, {new:true})`, `revalidatePath("/dashboard/daily-tasks")`, return updated JSON (pola `updateTask` task-actions.ts:34).
- C2: inline edit di `daily-task-card.tsx` — state `isEditingName`/`draftName`, tombol "Edit" di header, input + Save/Cancel, props baru `onRename?` + `isRenaming?`, pesan error duplikat tampil di card.
- C3: `handleRename` di `daily-task-list.tsx` — panggil action, update local `tasks` state (nama baru), pending flag, teruskan props ke card.
next workflow action: present summary → tawarkan start work atau high-accuracy review; eksekusi HANYA oleh worker via `/start-work`.
