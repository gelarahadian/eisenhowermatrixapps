# sync-do-to-daily - Work Plan

## TL;DR (For humans)

**What you'll get:** Tasks in the Eisenhower "DO" quadrant (Important + Urgent, not completed) appear at the top of the Daily Tasks page as a "⚡ Do Now (Eisenhower)" section. You can mark them complete, edit deadlines, or delete them directly there — no need to open the Matrix page.

**Why this approach:** Reuses existing `TaskCard` component and `completeTask`/`updateTask`/`deleteTask` server actions. Zero new data models, zero sync logic. The DO tasks are simply fetched and rendered alongside DailyTasks.

**What it will NOT do:**
- Create new DailyTask records for DO tasks
- Sync completion back from DailyTask → Task (one-way display only)
- Add increment/decrement counters to DO tasks on Daily page
- Change anything on the Eisenhower Matrix page

**Effort:** Quick
**Risk:** Low - read-only display + existing mutation handlers
**Decisions to sanity-check:** Visual distinction badge on DO tasks; TaskCard handlers work correctly in Daily context

Your next move: approve, or run a high-accuracy review. Full execution detail follows below.

---

> TL;DR (machine): Quick, Low risk - display DO tasks on Daily page using existing TaskCard

## Scope
### Must have
- Fetch DO quadrant tasks (quadrant='do', completed=false) for current user on Daily Tasks page
- Render as separate section "⚡ Do Now (Eisenhower)" above existing DailyTasks
- Reuse TaskCard component with complete/edit/delete handlers targeting Task model
- Visual badge "Eisenhower" on these cards for distinction

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No new DailyTask documents created
- No sync logic between Task and DailyTask collections
- No increment/decrement buttons on DO tasks in Daily view
- No changes to Eisenhower Matrix page or its components
- No new server actions or API routes

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + manual QA via Playwright
- Evidence: .omo/evidence/task-N-sync-do-to-daily.log

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | - | 2,3 | - |
| 2 | 1 | 4 | 3 |
| 3 | 1 | 4 | 2 |
| 4 | 2,3 | - | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. **Update Daily Tasks page server component** — fetch DO tasks and pass to DailyTaskList
    What to do / Must NOT do: In `app/dashboard/daily-tasks/page.tsx`, import `getTasks` from `@/app/actions/task-actions`, fetch tasks for current user, filter to `quadrant === 'do' && !completed`, pass as `doTasks` prop to `DailyTaskList`. Do NOT modify DailyTask fetching logic.
    Parallelization: Wave 1 | Blocked by: - | Blocks: 2,3
    References (executor has NO interview context - be exhaustive): `app/dashboard/daily-tasks/page.tsx:1-36`, `app/actions/task-actions.ts:7-18`
    Acceptance criteria (agent-executable): `npm run build` passes; `curl /dashboard/daily-tasks` returns 200 (redirects to signin if unauthed)
    QA scenarios (name the exact tool + invocation): happy + failure, Evidence .omo/evidence/task-1-sync-do-to-daily.log
    Commit: Y | feat(daily): fetch DO tasks for display on Daily page

- [ ] 2. **Update DailyTaskList to render DO tasks section** — add "Do Now" section above daily tasks
    What to do / Must NOT do: In `components/dashboard/daily-task-list.tsx`, accept new `doTasks` prop (Task[]). Render a section header "⚡ Do Now (Eisenhower)" with teal badge, then map `doTasks` to `TaskCard` with existing handlers (`onComplete`, `onDelete`, `onDueDateChange` from task-actions). Do NOT use DailyTask increment/decrement handlers. Add subtle "Eisenhower" badge on each card.
    Parallelization: Wave 2 | Blocked by: 1 | Blocks: 4
    References: `components/dashboard/daily-task-list.tsx:1-245`, `components/dashboard/task-card.tsx:1-226`, `app/actions/task-actions.ts:34-74`
    Acceptance criteria: `npm run build` passes; DO tasks render with correct handlers
    QA scenarios: happy + failure, Evidence .omo/evidence/task-2-sync-do-to-daily.log
    Commit: Y | feat(daily): render DO tasks section with TaskCard

- [ ] 3. **Add visual distinction badge to TaskCard for DO tasks** — optional prop to show "Eisenhower" label
    What to do / Must NOT do: In `components/dashboard/task-card.tsx`, add optional `source?: 'eisenhower' | 'daily'` prop. When 'eisenhower', render a small teal badge "Eisenhower" near title. No other behavior changes.
    Parallelization: Wave 2 | Blocked by: 1 | Blocks: 4
    References: `components/dashboard/task-card.tsx:1-226`
    Acceptance criteria: `npm run build` passes; badge renders only when prop set
    QA scenarios: happy + failure, Evidence .omo/evidence/task-3-sync-do-to-daily.log
    Commit: Y | feat(task-card): add Eisenhower source badge

- [ ] 4. **Integration verification** — build, type-check, and manual QA via Playwright
    What to do / Must NOT do: Run `npm run build` (must pass). Start dev server, navigate to `/dashboard/daily-tasks` (requires login), verify: (a) DO section appears above daily tasks, (b) "Selesai" on DO task calls completeTask and updates Matrix on refresh, (c) Edit deadline works, (d) Delete works, (e) DailyTask increment/decrement unchanged. Do NOT test unauthed redirect (already works).
    Parallelization: Wave 3 | Blocked by: 2,3 | Blocks: -
    References: all above files
    Acceptance criteria: `npm run build` passes; manual QA checklist all ✓
    QA scenarios: happy + failure, Evidence .omo/evidence/task-4-sync-do-to-daily.log
    Commit: Y | test(daily): verify DO tasks display and actions on Daily page

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
One commit per todo (4 commits). Conventional commits: `feat(daily): ...`, `feat(task-card): ...`, `test(daily): ...`.

## Success criteria
- `npm run build` exits 0
- DO tasks visible on `/dashboard/daily-tasks` with "Selesai" working
- No regression on existing DailyTask features
- No new DailyTask documents created