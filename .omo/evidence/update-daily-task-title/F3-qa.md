# F3 — Real manual QA (2026-11-02)

## Yang dijalankan (nyata)
1. `npx tsc --noEmit` exit 0 → `final-tsc.txt`
2. `npx next build` exit 0 → `final-build.txt`
3. `npm run dev` boot sukses (Ready 424ms) → `dev-server.log`
4. Browser Playwright:
   - `/auth/signin` render OK (heading "Login ke Eisenhower Todo", tombol Sign in with Google) → `signin-page.png`
   - `/dashboard/daily-tasks` → redirect `/auth/signin` (auth gate utuh)
   - Console: hanya favicon 404, TIDAK ada error runtime terkait perubahan
5. Data-layer probe langsung ke MongoDB Atlas → `runtime-data-probe.txt`: **ALL_PASS (6/6)** — index unik, E11000, rename valid persist, duplikat terdeteksi, no-op tidak false-positive, empty ditolak

## Yang TIDAK bisa dijalankan (jujur)
Klik-Edit-End-to-End di UI butuh login Google OAuth — agent tidak punya sesi Google. Verdict skenario UI: `runtime_unavailable` (tercatat di `final-qa.md`). Skenario 3-6 terverifikasi code-level dengan baris referensi.

## Persistensi rename
Terbukti di data-layer: `valid_rename_persists :: Task A Baru` — update tersimpan di dokumen, sehingga reload (yang hanya `find({userId,date})`) akan mengembalikan nama baru.

VERDICT: **APPROVE** (dengan catatan runtime_unavailable untuk klik-UI E2E, sesuai fallback yang diizinkan plan)
