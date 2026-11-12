# DESIGN.md — Eisenhower Matrix App

Panduan desain visual dan UI untuk seluruh halaman aplikasi. Dokumen ini adalah sumber kebenaran (source of truth) untuk warna, tipografi, komponen, dan perilaku interaksi.

---

## 1. Prinsip Desain

| Prinsip                   | Penjelasan                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------- |
| **Fokus**                 | UI bersih dan lapang agar pengguna fokus memprioritaskan task, bukan melihat dekorasi. |
| **Tenang & Profesional**  | Satu keluarga warna teal. Tidak ada warna mencolok yang memicu rasa panik.             |
| **Jelas secara hierarki** | Aksi utama selalu solid teal, aksi sekunder outline, aksi destruktif dibedakan jelas.  |
| **Responsif**             | Mobile-first. Matriks 2×2 jadi 1 kolom di layar kecil.                                 |
| **Aksesibel**             | Kontras minimal WCAG AA, fokus keyboard terlihat, tidak mengandalkan warna saja.       |

---

## 2. Sistem Warna — Aturan 60 / 30 / 10

| Porsi   | Warna     | Hex       | Peran                                                               |
| ------- | --------- | --------- | ------------------------------------------------------------------- |
| **60%** | Putih     | `#FFFFFF` | Latar halaman, kartu, dialog, ruang kosong                          |
| **30%** | Teal      | `#167D8D` | Header, tombol utama, judul section, border aktif, ikon, progress   |
| **10%** | Teal muda | `#B9E4E8` | Aksen: hover, highlight, badge, latar kuadran, chip, track progress |

### 2.1 Token Warna

```css
:root {
  /* 60% — Dominan */
  --color-bg: #ffffff;
  --color-surface: #ffffff;

  /* 30% — Sekunder (brand) */
  --color-primary: #167d8d;
  --color-primary-hover: #126876; /* primary digelapkan ~10% */
  --color-primary-press: #0e5662; /* primary digelapkan ~20% */

  /* 10% — Aksen */
  --color-accent: #b9e4e8;
  --color-accent-soft: #e8f6f8; /* aksen diputihkan, untuk latar halus */
  --color-accent-strong: #8fd0d8; /* aksen dipertegas, untuk border/hover */

  /* Netral fungsional (teks & garis, bukan bagian dari 60/30/10) */
  --color-ink: #0b3a42; /* teks utama */
  --color-ink-muted: #4f7a82; /* teks sekunder */
  --color-border: #d3ecef; /* garis tipis */
  --color-disabled-bg: #eef4f5;
  --color-disabled-text: #8fa9ae;

  /* Fungsional — hanya untuk aksi destruktif */
  --color-danger: #b42318;
  --color-danger-soft: #fdecea;
}
```

### 2.2 Aturan Penggunaan

- **Dilarang** menambah warna brand baru. Variasi hanya boleh berupa gelap/terang dari `#167D8D` dan `#B9E4E8`.
- **Teks pada latar `#167D8D`** harus putih (`#FFFFFF`), kontras ±4.9:1.
- **Teks pada latar `#B9E4E8`** harus `--color-ink` (`#0B3A42`), jangan putih.
- **Teks `#167D8D` di atas putih** hanya untuk teks ≥ 14px bold atau ≥ 18px regular. Untuk teks kecil gunakan `--color-ink`.
- `--color-danger` hanya dipakai pada tombol **Delete** dan pesan error. Maksimal muncul sebagai ikon/teks kecil agar rasio 60/30/10 tetap terjaga.
- Status selesai/progress memakai teal (bukan hijau) supaya palet tetap konsisten.

### 2.3 Distribusi per Layar

| Area         | 60% Putih                   | 30% Teal                                | 10% Aksen                                     |
| ------------ | --------------------------- | --------------------------------------- | --------------------------------------------- |
| Landing      | Latar section, kartu fitur  | Hero heading, tombol utama, footer      | Badge, highlight kata, ilustrasi              |
| Sign In      | Latar halaman & kartu login | Tombol Google (outline teal), logo      | Latar dekoratif halus                         |
| Dashboard    | Latar, kartu task           | Header bar, judul kuadran, tombol utama | Latar kuadran, drop-highlight, statistik      |
| Daily/Weekly | Latar, kartu task           | Progress fill, tombol utama, chip aktif | Track progress, chip default, modal tab aktif |

---

## 3. Tipografi

**Font:** `Inter` (fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`).

| Peran                      | Ukuran  | Weight | Line-height | Warna               |
| -------------------------- | ------- | ------ | ----------- | ------------------- |
| Display (Hero)             | 48–56px | 700    | 1.1         | `--color-primary`   |
| H1 (judul halaman)         | 30px    | 700    | 1.2         | `--color-primary`   |
| H2 (judul section/kuadran) | 20px    | 600    | 1.3         | `--color-primary`   |
| H3 (judul kartu)           | 16px    | 600    | 1.4         | `--color-ink`       |
| Body                       | 14–16px | 400    | 1.5         | `--color-ink`       |
| Caption / meta (deadline)  | 12px    | 500    | 1.4         | `--color-ink-muted` |
| Tombol                     | 14px    | 600    | 1           | sesuai varian       |

---

## 4. Spacing, Radius, Elevasi

**Spacing** (basis 4px): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

**Radius**

| Elemen              | Radius  |
| ------------------- | ------- |
| Tombol, input, chip | `8px`   |
| Kartu, kuadran      | `12px`  |
| Dialog, modal       | `16px`  |
| Badge, chip hari    | `999px` |

**Elevasi**

```css
--shadow-card: 0 1px 3px rgba(22, 125, 141, 0.1);
--shadow-hover: 0 4px 12px rgba(22, 125, 141, 0.16);
--shadow-drag: 0 12px 28px rgba(22, 125, 141, 0.28);
--shadow-modal: 0 20px 48px rgba(11, 58, 66, 0.22);
```

Container maksimum: `1200px` (landing), `1280px` (dashboard). Padding horizontal: `16px` mobile, `24px` tablet, `32px` desktop.

---

## 5. Komponen

### 5.1 Tombol

| Varian        | Latar      | Teks      | Border          | Hover           | Dipakai untuk                                                                   |
| ------------- | ---------- | --------- | --------------- | --------------- | ------------------------------------------------------------------------------- |
| **Primary**   | `#167D8D`  | Putih     | –               | `#126876`       | Get Started, + Add Task, Add Task (dialog), Save                                |
| **Secondary** | Putih      | `#167D8D` | 1.5px `#167D8D` | latar `#B9E4E8` | Login, Copy Summary, Daily/Weekly Tasks, Back to Dashboard, Sign in with Google |
| **Soft**      | `#B9E4E8`  | `#0B3A42` | –               | `#8FD0D8`       | Selesai, Edit, Count One, Cancel                                                |
| **Ghost**     | Transparan | `#167D8D` | –               | latar `#E8F6F8` | Lihat detail, Lihat Riwayat, ikon pensil                                        |
| **Danger**    | Putih      | `#B42318` | 1px `#B42318`   | latar `#FDECEA` | Delete, Logout (opsional)                                                       |

- Tinggi: `40px` default, `48px` untuk CTA landing, `32px` untuk tombol di dalam kartu.
- State **focus**: ring 2px `#167D8D` dengan offset 2px.
- State **disabled**: latar `--color-disabled-bg`, teks `--color-disabled-text`, `cursor: not-allowed`.
- State **loading**: spinner 16px menggantikan ikon, teks tetap.

### 5.2 Input & Textarea

- Latar putih, border 1px `--color-border`, radius 8px, tinggi 40px.
- Focus: border `#167D8D` + ring `#B9E4E8` 3px.
- Error: border `--color-danger` + pesan 12px di bawah input.
- Label: 14px/500, `--color-ink`, jarak 6px ke input.

### 5.3 Kartu Task (TaskCard)

```
┌──────────────────────────────────────┐
│ ⋮⋮  Judul task (16px/600)            │
│     Deskripsi singkat (14px, muted)  │
│     ⏰ 12 Nov 2026, 17:00            │
│ ──────────────────────────────────── │
│ [Edit]  [Selesai]           [Delete] │
└──────────────────────────────────────┘
```

- Latar putih, border 1px `--color-border`, radius 12px, `--shadow-card`.
- Hover: `--shadow-hover`, border `#8FD0D8`.
- Dragging: `--shadow-drag`, rotasi 1.5°, opasitas 0.95, kursor `grabbing`.
- Deadline lewat tempo: teks `--color-danger` + ikon peringatan (tidak hanya warna).
- Editor deadline: `datetime-local` muncul inline dengan tombol **Save** (Primary kecil) dan **Cancel** (Soft kecil).

### 5.4 Dialog / Modal

- Overlay: `rgba(11,58,66,.45)`, klik overlay menutup.
- Panel putih, radius 16px, `--shadow-modal`, lebar maks 480px (form) / 720px (riwayat).
- Header: judul H2 teal + tombol tutup (X) ghost di kanan.
- Footer: tombol **Cancel** (Soft) di kiri dari **Add Task / Save** (Primary), rata kanan.
- `Escape` menutup, fokus terkunci di dalam dialog (focus trap).

### 5.5 Progress Bar

- Track `#B9E4E8`, fill `#167D8D`, tinggi 8px, radius 999px.
- Animasi fill `300ms ease-out`.
- Selesai (100%): fill tetap teal + label **✓ Completed** (teks teal bold) di kanan.

### 5.6 Chip & Badge

| Jenis                                   | Default                                            | Aktif / Dipilih             |
| --------------------------------------- | -------------------------------------------------- | --------------------------- |
| Chip hari (weekly)                      | Latar `#B9E4E8`, teks `#0B3A42`                    | Latar `#167D8D`, teks putih |
| Chip hari — selesai                     | Latar `#167D8D`, ikon ✓ putih                      | –                           |
| Chip hari — hari ini                    | Ring 2px `#167D8D`                                 | –                           |
| Chip hari — sudah lewat & belum selesai | Latar `#EEF4F5`, teks `#8FA9AE`                    | –                           |
| Chip hari — masa depan                  | Latar `#EEF4F5`, teks `#8FA9AE`, tidak bisa diklik | –                           |
| Badge kuadran                           | Latar `#B9E4E8`, teks `#0B3A42`                    | –                           |

### 5.7 Tab (Modal Riwayat)

- Container pill dengan latar `#E8F6F8`.
- Tab aktif: latar `#167D8D`, teks putih. Tab tidak aktif: transparan, teks `#167D8D`.

---

## 6. Halaman

### 6.1 Landing Page — `/` dan `/landing`

**Tujuan:** Memperkenalkan konsep Eisenhower Matrix dan mengajak pengguna masuk.

**Struktur section**

1. **Navbar** (sticky, latar putih, border bawah `--color-border`)
   - Kiri: logo + nama app (teal).
   - Kanan: tombol **Login** (Secondary) → `/auth/signin`.
2. **Hero** (latar putih, aksen lingkaran blur `#B9E4E8`)
   - Heading display teal, subjudul `--color-ink-muted`.
   - CTA utama **Get Started** (Primary 48px) → `/auth/signin`.
   - Ilustrasi mockup matriks 2×2 dengan kuadran berwarna teal/aksen.
3. **Fitur** — grid 4 kartu putih dengan ikon teal di lingkaran `#B9E4E8`:
   - Drag & drop ke kuadran
   - Fokus pada yang penting
   - Delegasi & eliminasi
   - Statistik progres
4. **Penjelasan 4 kuadran** — grid 2×2 (Do, Schedule, Delegate, Delete), tiap kuadran memiliki intensitas teal berbeda (lihat 6.3).
5. **CTA akhir** — blok latar `#167D8D`, teks putih, tombol **Start Prioritizing Today** (putih, teks teal) → `/auth/signin`.
6. **Footer** — latar putih, teks muted, garis atas `--color-border`.

| Tombol                   | Varian                   | Tujuan         |
| ------------------------ | ------------------------ | -------------- |
| Login                    | Secondary                | `/auth/signin` |
| Get Started              | Primary besar            | `/auth/signin` |
| Start Prioritizing Today | Putih di atas latar teal | `/auth/signin` |

---

### 6.2 Sign In — `/auth/signin`

**Tujuan:** Autentikasi via NextAuth (Google).

- Layout: kartu terpusat vertikal & horizontal, lebar maks 400px, latar halaman putih dengan dekorasi `#E8F6F8`.
- Isi kartu: logo, H1 "Selamat datang", teks pendukung, satu tombol.
- Tombol **Sign in with Google**: Secondary full-width, ikon Google di kiri. Hover latar `#B9E4E8`. Sukses → `/dashboard`.
- State loading: spinner + teks "Menghubungkan…"; tombol disabled.
- State error (gagal login): banner `--color-danger-soft` di atas tombol dengan ikon dan pesan.

---

### 6.3 Dashboard — `/dashboard`

**Tujuan:** Halaman utama dengan matriks Eisenhower 2×2. Dilindungi autentikasi.

**Header (sticky)**

- Latar `#167D8D`, teks putih, tinggi 64px.
- Kiri: judul "Eisenhower Matrix".
- Kanan: **Daily Tasks**, **Weekly Tasks** (tombol putih-outline di atas teal, hover latar putih teks teal), **Logout** (ghost putih).
- Mobile: menu collapse ke ikon hamburger.

**Toolbar aksi** (di bawah header, latar putih)

- **+ Add Task** (Primary) → membuka dialog (judul, deskripsi, deadline opsional).
- **Copy Summary** (Secondary) → salin ringkasan per kuadran; tampilkan toast "Tersalin ✓".

**Inbox + Quick Task Input**

- Kartu putih dengan header "Inbox" dan input pada bagian atas: placeholder "Ketik tugas lalu tekan Enter…". Enter langsung membuat task di Inbox.
- Daftar task Inbox berupa TaskCard yang bisa di-drag ke kuadran mana pun.

**Matriks 2×2**

|                   | **Urgent**                 | **Not Urgent**           |
| ----------------- | -------------------------- | ------------------------ |
| **Important**     | **DO** — kerjakan sekarang | **SCHEDULE** — jadwalkan |
| **Not Important** | **DELEGATE** — delegasikan | **DELETE** — hilangkan   |

Diferensiasi kuadran memakai tingkat teal (bukan warna baru) plus label teks dan ikon:

| Kuadran  | Header                      | Latar area | Border               |
| -------- | --------------------------- | ---------- | -------------------- |
| DO       | `#167D8D` teks putih        | `#E8F6F8`  | 2px `#167D8D`        |
| SCHEDULE | Putih teks `#167D8D` (bold) | putih      | 2px `#167D8D`        |
| DELEGATE | `#B9E4E8` teks `#0B3A42`    | putih      | 2px `#B9E4E8`        |
| DELETE   | Putih teks `#4F7A82`        | `#F6FAFB`  | 2px dashed `#B9E4E8` |

- Setiap kuadran memiliki: header (label + jumlah task), area daftar task, empty state ("Tarik tugas ke sini").
- Grid: 2 kolom ≥ 768px, 1 kolom di bawahnya. Gap 16–24px. Tinggi minimum kuadran 240px.

**Drag & Drop (drop target)**

- Saat kartu dalam drag: semua kuadran memunculkan border dashed `#8FD0D8`.
- Saat kartu berada di atas kuadran: latar `#B9E4E8` (opasitas 50%), border solid `#167D8D`, ruang placeholder muncul di posisi sisip.
- Reorder dalam kuadran: kartu lain bergeser halus (`200ms`).
- Dukungan keyboard: Space untuk ambil/jatuhkan, panah untuk pindah, Escape untuk batal.

**Tugas yang Selesai**

- Section collapsible di bawah matriks. Kartu dengan teks dicoret (`line-through`), opasitas 0.7, ikon ✓ teal.

**Statistics**

- Baris kartu stat: Total, Completed, jumlah per kuadran (4 angka), dan progress bar persentase.
- Angka 28px/700 teal, label 12px muted.

**Tombol per TaskCard**

| Tombol        | Varian                   | Fungsi                                 |
| ------------- | ------------------------ | -------------------------------------- |
| Edit          | Soft kecil               | Buka editor deadline                   |
| Save / Cancel | Primary / Soft kecil     | Simpan atau batal deadline             |
| Selesai       | Soft kecil dengan ikon ✓ | Tandai selesai                         |
| Delete        | Danger kecil             | Hapus permanen (disarankan konfirmasi) |
| Seluruh kartu | –                        | Drag handle                            |

---

### 6.4 Daily Tasks — `/dashboard/daily-tasks`

**Tujuan:** Melacak task rutin harian berbasis kuota, reset otomatis harian (WIB).

**Header halaman**

- **← Back to Dashboard** (Secondary) di kiri, H1 "Daily Tasks" teal, **+ Add Daily Task** (Primary) di kanan.

**Kartu Daily Task**

```
┌─────────────────────────────────────────────┐
│ ⋮⋮  Minum air putih            ✎  [Delete]  │
│     Target: 8 / hari  ✎                      │
│ ▓▓▓▓▓▓▓▓░░░░░░░░  5 / 8                      │
│ [ − Kurangi ]            [ + Count One ]     │
│ Sen Sel Rab Kam Jum Sab Min   Lihat detail ▸ │
└─────────────────────────────────────────────┘
```

- Nama task H3; ikon pensil (ghost) di sebelahnya untuk edit nama → muncul input + **Save / Cancel**.
- Target count: teks "Target: N / hari" dengan ikon **pensil**; saat edit muncul input angka + **✓** (simpan, teal) dan **✕** (batal, muted).
- Progress bar 8px dengan teks `count / target`.
- **− Kurangi**: Soft; disabled saat count 0.
- **+ Count One**: Primary; saat target tercapai berubah menjadi label **✓ Completed** (latar `#B9E4E8`, teks `#0B3A42`) dan disabled.
- **Grid 7 hari**: 7 kotak kecil (28px). Hari penuh = latar teal + ✓; sebagian = latar `#B9E4E8`; kosong = `#EEF4F5`. Klik membuka modal riwayat bersama **Lihat detail ▸**.
- Drag handle (⋮⋮) di kiri untuk reorder, urutan disimpan ke DB; tampilkan indikator "Menyimpan…" ringan.

**Dialog Tambah Task:** field _Nama task_ dan _Target per hari_ (angka, default 10, min 1). Tombol **Cancel** (Soft) dan **Add Task** (Primary).

**Modal Riwayat (DailyTaskHistoryModal)**

- Tab pill: **7 Hari / 1 Bulan / 1 Tahun**.
  - _7 Hari_: daftar baris per tanggal — tanggal, `count/target`, progress mini.
  - _1 Bulan_: kalender grid 7 kolom; hari selesai teal, sebagian `#B9E4E8`, kosong abu muda; hari ini diberi ring teal.
  - _1 Tahun_: 12 kartu bulan dengan persentase hari selesai dan bar mini.
- Ditutup dengan tombol **X**, klik overlay, atau **Escape**.

---

### 6.5 Weekly Tasks — `/dashboard/weekly-tasks`

**Tujuan:** Melacak task rutin mingguan berdasarkan hari terjadwal; reset otomatis setiap Senin.

**Header halaman:** **← Back to Dashboard**, H1 "Weekly Tasks", **+ Add Weekly Task**.

**Dialog Tambah Task**

- Input _Nama task_.
- Pemilih hari: 7 tombol toggle (Senin–Minggu). Terpilih: latar teal teks putih. Tidak terpilih: latar `#B9E4E8`, teks `#0B3A42`. Minimal satu hari wajib dipilih.
- **Cancel** (Soft) dan **Add Task** (Primary, disabled sampai ≥ 1 hari terpilih).

**Kartu Weekly Task**

```
┌─────────────────────────────────────────────┐
│ Rapat Tim                          [Delete] │
│ ( Sen ✓ ) ( Sel ) ( Rab ◉ ) ( Kam ) ...     │
│ ▼ Lihat Riwayat (3)                          │
└─────────────────────────────────────────────┘
```

- Hanya hari yang terjadwal yang tampil sebagai chip aktif; hari lain disembunyikan atau diredam.
- Perilaku chip hari (klik hanya untuk hari ≤ hari ini):
  - ✓ selesai → latar teal, ikon putih
  - Hari ini → ring 2px teal
  - Sudah lewat belum selesai → abu
  - Masa depan → abu, `cursor: not-allowed`, tooltip "Belum bisa diselesaikan"
- **▼ / ▲ Lihat Riwayat (N)** (Ghost): memperluas panel dengan transisi 200ms, berisi baris per minggu sebelumnya — rentang tanggal dan `selesai/terjadwal` hari beserta progress mini.

---

## 7. Interaksi & Motion

| Interaksi           | Durasi                      | Easing                   |
| ------------------- | --------------------------- | ------------------------ |
| Hover tombol/kartu  | 150ms                       | ease-out                 |
| Buka dialog/modal   | 200ms (fade + scale 0.97→1) | ease-out                 |
| Progress bar        | 300ms                       | ease-out                 |
| Reorder drag & drop | 200ms                       | cubic-bezier(.2,.8,.2,1) |
| Toast               | 3 detik tampil              | slide-in 200ms           |

Hormati `prefers-reduced-motion`: matikan skala, rotasi, dan slide; sisakan fade.

---

## 8. Aksesibilitas

- Kontras: teks putih di `#167D8D` ≈ 4.9:1 (AA); teks `#0B3A42` di `#B9E4E8` > 9:1 (AAA).
- Semua tombol ikon wajib `aria-label` (mis. "Edit target", "Tutup riwayat").
- Fokus selalu terlihat (ring teal 2px).
- Status tidak hanya lewat warna: gunakan ikon (✓, ⚠), teks, atau pola (dashed vs solid).
- Dialog: `role="dialog"`, `aria-modal="true"`, focus trap, kembalikan fokus ke pemicu setelah ditutup.
- Drag & drop harus punya alternatif keyboard (lihat 6.3).
- Target sentuh minimal 40×40px di mobile.

---

## 9. Responsif

| Breakpoint | Lebar    | Perilaku                                  |
| ---------- | -------- | ----------------------------------------- |
| `sm`       | ≥ 640px  | Toolbar sebaris, dialog tidak full-screen |
| `md`       | ≥ 768px  | Matriks 2×2, grid fitur 2 kolom           |
| `lg`       | ≥ 1024px | Grid fitur 4 kolom, Daily/Weekly 2 kolom  |
| `xl`       | ≥ 1280px | Container dibatasi 1280px                 |

Di bawah 640px: matriks 1 kolom (urutan DO → SCHEDULE → DELEGATE → DELETE), dialog full-screen sheet dari bawah, header menjadi hamburger.

---

## 10. Konfigurasi Tailwind (referensi)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#167D8D",
          hover: "#126876",
          press: "#0E5662",
        },
        accent: {
          DEFAULT: "#B9E4E8",
          soft: "#E8F6F8",
          strong: "#8FD0D8",
        },
        ink: { DEFAULT: "#0B3A42", muted: "#4F7A82" },
        line: "#D3ECEF",
        danger: { DEFAULT: "#B42318", soft: "#FDECEA" },
      },
      borderRadius: { card: "12px", dialog: "16px" },
      boxShadow: {
        card: "0 1px 3px rgba(22,125,141,.10)",
        hover: "0 4px 12px rgba(22,125,141,.16)",
        drag: "0 12px 28px rgba(22,125,141,.28)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
};
```

---

## 11. Checklist Review Desain

- [ ] Putih tetap dominan (~60%) di setiap halaman.
- [ ] `#167D8D` hanya untuk elemen penting (header, CTA, progress, judul).
- [ ] `#B9E4E8` dipakai sebagai aksen, tidak menjadi latar halaman penuh.
- [ ] Tidak ada warna brand baru di luar turunan gelap/terang dua warna teal.
- [ ] Setiap tombol memiliki state hover, focus, disabled, dan loading.
- [ ] Semua aksi destruktif memakai varian Danger.
- [ ] Empty state, loading state, dan error state tersedia di setiap daftar.
- [ ] Drag & drop punya feedback visual dan alternatif keyboard.
