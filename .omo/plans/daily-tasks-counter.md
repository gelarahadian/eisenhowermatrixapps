# daily-tasks-counter - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A new "Daily Tasks" page where you can create multiple named daily tasks (e.g., "Submit 10 proposals"), each with a counter that increments on click (1→2→3...→10), shows progress visually, and resets to 0 at midnight while preserving history of past days' completions.

**Why this approach:** Separate page keeps Eisenhower Matrix clean; daily reset with history enables streak tracking; multiple tasks per day supports varied daily quotas.

**What it will NOT do:** Modify existing Eisenhower Matrix tasks/quadrants; add real-time sync; change authentication; add notifications.

**Effort:** Medium
**Risk:** Low - straightforward CRUD + counter logic, well-understood patterns in codebase
**Decisions to sanity-check:** Daily reset implementation (middleware vs on-load), history schema design

Your next move: approve to start execution. Full execution detail follows below.

---
> TL;DR (machine): Medium effort, Low risk, 9 todos + 8 final verifiers, separate page with counter UI, daily reset with history

## Scope
### Must have
- DailyTask Mongoose model with name, targetCount, currentCount, date (YYYY-MM-DD), userId, completed, history array
- Server actions: createDailyTask, getDailyTasks, incrementDailyTask, deleteDailyTask, resetDailyCounts
- Page at /dashboard/daily-tasks with list of today's tasks, each showing name, counter (X/Y), progress bar, increment button
- Navigation button "Daily Tasks" in dashboard header
- Daily reset logic: on page load, check if date changed, create new day's records with counter=0, preserve history
- Multiple daily tasks per user per day, each independent

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No changes to existing Task model or Eisenhower Matrix components
- No WebSocket/real-time updates
- No email/push notifications
- No cross-user sharing of daily tasks
- No modification to auth system

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after + Jest + React Testing Library for components, manual QA via Playwright for E2E
- Evidence: .omo/evidence/daily-tasks-counter/task-<N>.<ext>

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1. DailyTask model | - | 2, 9 | - |
| 2. Server actions | 1 | 3, 4, 5, 7 | - |
| 3. DailyTasks page | 2 | - | 4, 5, 6 |
| 4. DailyTaskList component | 2 | - | 3, 5, 6 |
| 5. DailyTaskCard component | 2 | - | 3, 4, 6 |
| 6. Dashboard header nav | - | - | 3, 4, 5 |
| 7. Daily reset logic | 2 | - | - |
| 8. Route registration | 3 | - | - |
| 9. Types update | 1 | 2, 3, 4, 5 | - |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [x] 1. Create DailyTask Mongoose model in `models/DailyTask.ts`
  What to do / Must NOT do: Create model with fields: name (string, required), targetCount (number, required, min 1), currentCount (number, default 0), date (string, required, format YYYY-MM-DD), userId (ObjectId, ref User, required), completed (boolean, default false), history (array of { date: string, completedCount: number, completedAt: Date }). Add compound index on userId + date + name for uniqueness. Do NOT modify existing Task model.
  Parallelization: Wave 1 | Blocked by: - | Blocks: 2, 9
  References: models/Task.ts:1-25 (pattern), models/User.ts:1-15 (userId ref)
  Acceptance criteria: `node -e "require('./models/DailyTask')"` loads without error; model creates document with all fields; compound index prevents duplicate name per user per day
  QA scenarios: Create task with valid data → success; Create duplicate name same user same day → error; Missing required fields → validation error
  Commit: Y | feat(model): add DailyTask model with history tracking

- [x] 2. Add server actions in `app/actions/daily-task-actions.ts`
  What to do / Must NOT do: Export async functions: createDailyTask(data), getDailyTasks(userId), incrementDailyTask(id), deleteDailyTask(id), resetDailyCounts(userId). Use dbConnect from @/lib/mongodb. revalidatePath("/dashboard/daily-tasks") after mutations. resetDailyCounts: for each task where date !== today, push to history {date, completedCount: currentCount, completedAt}, set currentCount=0, date=today, completed=false. Do NOT add auth logic - rely on session in components.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3, 4, 5, 7
  References: app/actions/task-actions.ts:1-74 (pattern), lib/mongodb.ts:1-5 (dbConnect)
  Acceptance criteria: All 5 functions export and type-check; createDailyTask saves to DB; getDailyTasks returns today's tasks for user; incrementDailyTask increments currentCount and sets completed=true when currentCount >= targetCount; resetDailyCounts moves old tasks to history and resets counters
  QA scenarios: create → get → increment to target → verify completed=true; resetDailyCounts on mixed old/today tasks → old moved to history, today unchanged; unauthenticated call → handled by session in component
  Commit: Y | feat(actions): add daily task server actions with reset logic

- [x] 3. Create DailyTasks page component in `app/dashboard/daily-tasks/page.tsx`
  What to do / Must NOT do: Server component. Get session, redirect to /auth/signin if none. Call getDailyTasks(userId). Call resetDailyCounts(userId) to ensure fresh day. Pass tasks to DailyTaskList client component. Page title "Daily Tasks". Do NOT add any client-side logic here.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: -
  References: app/dashboard/page.tsx:1-20 (pattern), app/actions/daily-task-actions.ts (import)
  Acceptance criteria: Page renders at /dashboard/daily-tasks; redirects unauthenticated to signin; shows DailyTaskList with tasks; resetDailyCounts called on load
  QA scenarios: Authenticated user → sees page with tasks; Unauthenticated → redirects to signin; Empty state → shows "No daily tasks yet"
  Commit: Y | feat(page): add /dashboard/daily-tasks page with server-side data fetching

- [x] 4. Create DailyTaskList client component in `components/dashboard/daily-task-list.tsx`
  What to do / Must NOT do: Client component. Props: tasks (DailyTask[]), onIncrement, onDelete, onAddTask. Render "Add Daily Task" button opening dialog. Map tasks to DailyTaskCard. Handle empty state. Do NOT fetch data directly.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: -
  References: components/dashboard/add-task-dialog.tsx:1-78 (dialog pattern), components/dashboard/task-list.tsx:1-7 (list pattern)
  Acceptance criteria: Renders list of DailyTaskCard components; "Add Daily Task" button opens dialog; empty state shows helpful message
  QA scenarios: Multiple tasks → all render; Zero tasks → empty state; Add dialog → creates task via server action
  Commit: Y | feat(component): add DailyTaskList with add dialog

- [x] 5. Create DailyTaskCard client component in `components/dashboard/daily-task-card.tsx`
  What to do / Must NOT do: Client component. Props: task (DailyTask), onIncrement, onDelete. Display: task.name, counter "currentCount/targetCount" (e.g., "3/10"), progress bar (width = currentCount/targetCount * 100%), increment button (disabled if completed), delete button. Completed tasks: green checkmark, disabled increment, strikethrough name. Do NOT mutate task directly - call onIncrement/onDelete.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: -
  References: components/dashboard/task-card.tsx:1-10 (card pattern), components/dashboard/quadrant.tsx:1-8 (progress display)
  Acceptance criteria: Shows name, counter, progress bar; increment button works and disables at target; completed task shows checkmark and disabled; delete button works
  QA scenarios: Increment from 0 to target → progress bar fills, completes at target; Delete → removes from list; Completed task → visual indicator, button disabled
  Commit: Y | feat(component): add DailyTaskCard with counter and progress UI

- [x] 6. Add "Daily Tasks" navigation button to `components/dashboard/dashboard-header.tsx`
  What to do / Must NOT do: Add Link to /dashboard/daily-tasks next to Logout button. Style consistent with existing header. Do NOT change layout significantly.
  Parallelization: Wave 2 | Blocked by: - | Blocks: -
  References: components/dashboard/dashboard-header.tsx:1-16 (current header), app/landing/page.tsx:8-11 (Link pattern)
  Acceptance criteria: Button visible in dashboard header; clicking navigates to /dashboard/daily-tasks; style matches existing buttons
  QA scenarios: Click button → navigates to daily tasks page; Header layout unchanged otherwise
  Commit: Y | feat(ui): add Daily Tasks navigation to dashboard header

- [x] 7. Add daily reset logic in `app/actions/daily-task-actions.ts` (extend resetDailyCounts)
  What to do / Must NOT do: Enhance resetDailyCounts to be called automatically. Option A: Middleware in middleware.ts checking date cookie vs today. Option B: Call resetDailyCounts at top of getDailyTasks. Implement Option B (simpler, no middleware). Ensure reset runs once per day per user. Do NOT use cron - rely on page visits.
  Parallelization: Wave 2 | Blocked by: 2 | Blocks: -
  References: app/actions/daily-task-actions.ts (new file), app/actions/task-actions.ts:7-18 (getTasks pattern)
  Acceptance criteria: getDailyTasks calls resetDailyCounts internally; resetDailyCounts correctly archives old day's counts to history; new day starts at 0
  QA scenarios: Visit page day 1 → create task, increment to 5; Visit page day 2 → task shows 0/10, history has day 1 record with 5
  Commit: Y | feat(actions): integrate daily reset into getDailyTasks

- [x] 8. Route registration for `/dashboard/daily-tasks`
  What to do / Must NOT do: Next.js App Router auto-registers page.tsx. Verify route works. No additional config needed. Do NOT modify next.config.js.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: -
  References: app/dashboard/page.tsx (existing route pattern)
  Acceptance criteria: `curl localhost:3000/dashboard/daily-tasks` returns 200 (authenticated) or 302 to signin
  QA scenarios: Direct navigation works; Refresh page works; Deep link works
  Commit: N | (no commit - verification only)

- [x] 9. Update types in `lib/types.ts` for DailyTask interface
  What to do / Must NOT do: Add export interface DailyTask { id: string; name: string; targetCount: number; currentCount: number; date: string; userId: string; completed: boolean; completedAt?: string; history: { date: string; completedCount: number; completedAt: string }[] }. Do NOT modify existing Task or Quadrant types.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 2, 3, 4, 5
  References: lib/types.ts:1-14 (existing types), models/DailyTask.ts (new model)
  Acceptance criteria: TypeScript compiles; DailyTask interface matches model fields; used in components and actions
  QA scenarios: Import DailyTask in actions and components → no type errors; history array typed correctly
  Commit: Y | feat(types): add DailyTask interface

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit - Verify all Must Have items implemented, no Must NOT Have violations
- [ ] F2. Code quality review - Check TypeScript strict mode, no any, proper error handling, consistent patterns
- [ ] F3. Real manual QA - Playwright: create task, increment to completion, verify reset next day, verify history
- [ ] F4. Scope fidelity - No changes to Eisenhower Matrix, Task model, auth, or unrelated files
- [ ] F5. Verify DailyTask model saves/loads correctly with userId isolation
- [ ] F6. Verify increment action increments counter and marks complete at target
- [ ] F7. Verify daily reset creates new day's record, preserves history
- [ ] F8. Verify multiple daily tasks per user per day work independently

## Commit strategy
One commit per todo (9 commits). Conventional commits: feat(model), feat(actions), feat(page), feat(component), feat(ui), feat(types).

## Success criteria
- User can create multiple named daily tasks with target counts
- Counter increments on click, shows progress visually
- At target count, task marks complete (disabled, checkmark)
- Next day, counters reset to 0, history preserved
- Navigation from dashboard header works
- All TypeScript compiles, no lint errors
- Playwright E2E passes for happy path

## Additional: History View Feature (pending approval)
- [x] 10. Add history view to DailyTaskCard in `components/dashboard/daily-task-card.tsx`
  What to do / Must NOT do: Add a `showHistory` state toggle and "Lihat Riwayat" button when `task.history` array is non-empty. Show expanded list of `{date, completedCount}` entries formatted with Indonesian locale date. Do NOT add any server actions - history data already comes from DailyTask model.
  Parallelization: Wave 3 | Blocked by: 5 | Blocks: -
  References: models/DailyTask.ts (history field), components/dashboard/daily-task-card.tsx (existing card)
  Acceptance criteria: Button "Lihat Riwayat (N)" visible when history exists; clicking toggles expanded list; each entry shows date + completed count
  QA scenarios: Task with history → button visible; click → shows list; click again → hides list; Task without history → no button
  Commit: Y | feat(ui): add history view to DailyTaskCard

## Additional: Decrement Counter Feature (pending approval)
- [x] 11. Add decrement server action in `app/actions/daily-task-actions.ts`
  What to do / Must NOT do: Export `decrementDailyTask(id)` function that decrements `currentCount` by 1 (min 0), resets `completed` to false and `completedAt` to null when un-completing. Do not allow decrement below 0. revalidatePath after update.
  Parallelization: Wave 3 | Blocked by: 2 | Blocks: 12
  References: app/actions/daily-task-actions.ts:incrementDailyTask (pattern), models/DailyTask.ts (schema)
  Acceptance criteria: currentCount decreases by 1 (min 0); completed set to false if was true; completedAt set to null
  QA scenarios: Count at 5 → decrement → 4; Count at 0 → decrement → stays 0; Completed task → decrement → un-completes
  Commit: Y | feat(actions): add decrementDailyTask server action

- [x] 12. Add decrement button to DailyTaskCard in `components/dashboard/daily-task-card.tsx`
  What to do / Must NOT do: Add "− Kurangi" button next to "+ Count One" button. Disable when currentCount is 0 or task is completed. Call onDecrement server action. Do not remove existing increment button.
  Parallelization: Wave 3 | Blocked by: 11 | Blocks: -
  References: components/dashboard/daily-task-card.tsx (existing card), app/actions/daily-task-actions.ts:decrementDailyTask (new action)
  Acceptance criteria: "− Kurangi" button visible; disabled at count=0; clicking decrements counter; progress bar updates accordingly
  QA scenarios: Count at 3 → click − → 2; Count at 0 → button disabled; Completed task → button disabled
  Commit: Y | feat(ui): add decrement button to DailyTaskCard