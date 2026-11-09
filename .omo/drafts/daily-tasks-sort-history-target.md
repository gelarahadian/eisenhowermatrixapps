---
slug: daily-tasks-sort-history-target
status: plan-written
intent: clear
review_required: false
pending-action: user decides: start work ($start-work) or high-accuracy review first
approach: dnd-kit sortable grid + persisted `order` field (konvensi models/Task.ts) + strip histori 7 hari clickable + modal 7 Hari/1 Bulan/1 Tahun + inline edit target count dengan recompute completed
---

# Draft: daily-tasks-sort-history-target

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | outcome | status | evidence |
| --- | --- | --- | --- |
| order-persistence | urutan kartu persisten via field `order` + sort `{order:1, createdAt:1}` | active | .omo/plans/daily-tasks-sort-history-target.md T1-T3 |
| history-strip-modal | strip 7 hari check/uncheck + modal 7 Hari/1 Bulan/1 Tahun | active | T4 |
| target-edit | edit target count inline + recompute completed | active | T2, T5 |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Persistensi urutan | field `order: number` di DailyTask | konvensi sudah ada di models/Task.ts:19 | ya |
| Hari "tercapai" | completedCount >= targetCount saat ini | data histori tidak menyimpan target per hari | ya |
| Ubah target | recompute completed/completedAt | konsisten dengan logika increment/decrement | ya |
| Hari tanpa data histori | sel kosong/redup | histori lazy-reset hanya terisi saat app dibuka | ya |
| Modal histori dibuat sekarang | ya (full scope) | user menyebut 3 rentang secara eksplisit | ya |

## Findings (cited - path:lines)
- app/dashboard/daily-tasks/page.tsx:16-33 — server page, getDailyTasks → DailyTaskList
- components/dashboard/daily-task-list.tsx:12-163 — state client, add modal, handlers
- components/dashboard/daily-task-card.tsx:210-231 — histori lama berupa list expand/collapse (diganti strip)
- models/DailyTask.ts:20-35 — schema + unique index {userId, date, name}
- app/actions/daily-task-actions.ts:45-57 — getDailyTasks sort createdAt:1 (diganti order:1, createdAt:1)
- models/Task.ts:8,19 — konvensi field `order` sudah ada
- package.json:17-19 — @dnd-kit core/sortable/utilities terpasang
- components/dashboard/task-card.tsx + eisenhower-matrix.tsx — pattern useSortable/DndContext
- lib/dates.ts:26-53 — helper tanggal WIB
- Tidak ada framework test (package.json test = placeholder error)

## Decisions (with rationale)
- rectSortingStrategy untuk grid (urutan kiri-ke-kanan, atas-ke-bawah sesuai permintaan user)
- reorderDailyTasks validasi kepemilikan userId (action menerima input dari client)
- Optimistic reorder + revert snapshot saat gagal
- Tidak ada dependency baru

## Scope IN
Lihat plan ## Scope (4 fitur: sortable persisten, strip 7 hari, modal histori 3 rentang, edit target).

## Scope OUT (Must NOT have)
Lihat plan ## Scope Must NOT have (tanpa dependency baru, tanpa ubah semantik reset/increment/decrement, tanpa sentuh eisenhower/weekly, tanpa framework test).

## Open questions
(none — semua fork diselesaikan; user menyetujui brief)

## Approval gate
status: approved (user: "ya i agree" / "oke" / "ya lanjutkan")
plan: .omo/plans/daily-tasks-sort-history-target.md ditulis lengkap (T1-T6 + F1-F4 + TL;DR)
