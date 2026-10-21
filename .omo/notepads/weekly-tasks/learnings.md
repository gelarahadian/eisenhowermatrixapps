## 2026-10-21 Weekly tasks feature (direct execution)
- Helpers verified: Mon 00:00 WIB boundary exact (wib-week-check.out ALL PASS).
- DB QA (weekly-qa.out ALL PASS): validation rejects day 9; unique index E11000 (needs await init() in scripts — mongoose builds indexes async); rollover archives history + clears doneDays + updates weekStart.
- Route /dashboard/weekly-tasks 307->signin (compiles, middleware OK); dev server killed after QA.
- Interactive UI flow (create/centang/refresh) needs user's Google session — handed to user.
