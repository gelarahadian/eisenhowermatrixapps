import Link from 'next/link';
import {
  CalendarCheck2,
  CalendarRange,
  Zap,
  ChartColumn,
  ChevronDown,
} from 'lucide-react';

/*
 * Landing sesuai DESIGN.md §6.1.
 * Bahasa: full Indonesia. Dial: ENERGY 1 / RHYTHM 2 / MOTION 1 (tenang, tanpa animasi dekoratif).
 * Palet: teal 60/30/10, putih dominan.
 * Ikon fitur dipilih relevan dengan isinya: kalender untuk daily/weekly,
 * petir karena fitur di app memang bernama "Do Now" dengan label ⚡, grafik untuk statistik.
 */

const HERO_QUADRANTS = [
  {
    label: 'DO',
    header: 'text-primary',
    area: 'bg-accent-soft border border-primary',
    tasks: ['Selesaikan laporan klien', 'Perbaiki bug checkout'],
    struck: false,
  },
  {
    label: 'SCHEDULE',
    header: 'text-primary',
    area: 'bg-white border border-primary',
    tasks: ['Rencanakan sprint minggu depan'],
    struck: false,
  },
  {
    label: 'DELEGATE',
    header: 'text-ink',
    area: 'bg-white border border-accent-strong',
    tasks: ['Minta bantuan desain banner'],
    struck: false,
  },
  {
    label: 'DELETE',
    header: 'text-ink-muted',
    area: 'bg-white border border-dashed border-line',
    tasks: ['Scroll berita berlebihan'],
    struck: true,
  },
] as const;

const STEPS = [
  { title: 'Tulis task', description: 'Catat semua yang perlu dikerjakan, tanpa mikir urutannya dulu.' },
  { title: 'Geser ke kuadran', description: 'Tentukan mana yang urgent dan penting lewat drag & drop.' },
  { title: 'Selesaikan harian', description: 'Penuhi kuota daily task setiap hari.' },
  { title: 'Pantau histori', description: 'Lihat streak dan statistik progresmu dari waktu ke waktu.' },
] as const;

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: 'Daily task dengan streak',
    description:
      'Tentukan kuota harian, lihat strip histori 7 hari, dan pertahankan streakmu. Hari yang selesai ditandai teal.',
  },
  {
    icon: CalendarRange,
    title: 'Weekly task',
    description: 'Susun jadwal per hari, dari Senin sampai Minggu, lewat chip hari.',
  },
  {
    icon: Zap,
    title: 'Do Now otomatis',
    description:
      'Task urgent dan penting dari matriks otomatis tampil di halaman harian. Tidak perlu pindah manual.',
  },
  {
    icon: ChartColumn,
    title: 'Riwayat & statistik',
    description: 'Rekap 7 hari, 1 bulan, dan 1 tahun dalam bentuk kalender dan persentase.',
  },
] as const;

const FAQS = [
  {
    question: 'Apakah Eitrix gratis?',
    answer:
      'Ya, semua fitur Eitrix bisa dipakai gratis. Cukup masuk dengan akun Google untuk mulai menyusun prioritas.',
  },
  {
    question: 'Apa bedanya matriks, daily task, dan weekly task?',
    answer:
      'Matriks dipakai untuk memilah task berdasarkan urgent dan penting. Daily task untuk target yang diulang tiap hari, weekly task untuk jadwal per hari dalam seminggu.',
  },
  {
    question: 'Apakah task urgent dan penting muncul di halaman harian?',
    answer:
      'Muncul. Task di kuadran Do otomatis tampil sebagai Do Now di halaman daily task, jadi kamu langsung tahu apa yang harus dikerjakan duluan.',
  },
] as const;

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Eitrix',
  applicationCategory: 'ProductivityApplication',
  inLanguage: 'id',
  description:
    'Eitrix membantumu memilah tugas dengan metode Eisenhower Matrix, melacak daily task, dan menyusun weekly task.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <nav className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-2 sm:px-6 md:px-12">
        <Link href="/" className="text-xl font-bold text-primary md:text-2xl">
          Eitrix
        </Link>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="#fitur"
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-ink transition-colors duration-150 hover:text-primary sm:px-3"
          >
            Fitur
          </Link>
          <Link
            href="#faq"
            className="inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-ink transition-colors duration-150 hover:text-primary sm:px-3"
          >
            FAQ
          </Link>
          <Link
            href="/auth/signin"
            className="ml-1 inline-flex h-11 items-center rounded-lg border-[1.5px] border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent"
          >
            Masuk
          </Link>
        </div>
      </nav>

      <main>
        <header className="relative overflow-hidden px-6 pb-20 pt-16 text-center md:px-12 md:pt-24">
          {/* Aksen halus di belakang heading: menandai satu titik fokus hero (DESIGN.md §6.1) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-soft blur-3xl"
          />
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] text-primary sm:text-5xl md:text-6xl">
            Prioritaskan yang penting.
          </h1>
          <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg text-ink-muted md:text-xl">
            Berhenti buang waktu untuk hal yang tidak penting. Susun kerjamu dengan metode Eisenhower
            Matrix yang jelas.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-base font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
          >
            Mulai Prioritaskan Hari Ini
          </Link>

          {/* Mockup matriks 2x2 dengan contoh task: memperlihatkan produk nyata, bukan ilustrasi generik */}
          <div className="mx-auto mt-14 grid w-full max-w-2xl grid-cols-2 gap-3 rounded-card border border-line bg-white p-4 text-left shadow-card">
            {HERO_QUADRANTS.map((q) => (
              <div key={q.label} className={`rounded-lg p-3 ${q.area}`}>
                <p className={`mb-2 text-xs font-bold tracking-wide ${q.header}`}>{q.label}</p>
                <ul className="flex flex-col gap-1.5">
                  {q.tasks.map((task) => (
                    <li
                      key={task}
                      className={`rounded-md border border-line bg-white px-2 py-1 text-xs leading-snug text-ink shadow-card ${
                        q.struck ? 'line-through text-ink-muted' : ''
                      }`}
                    >
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </header>

        {/* Cara kerjanya: timeline 4 langkah bernomor, bukan grid kartu seragam */}
        <section className="bg-white py-20 md:px-12">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-12 text-3xl font-bold text-primary">Cara kerjanya</h2>
            <ol className="relative flex flex-col gap-10 md:flex-row md:gap-6">
              {/* Garis penghubung langkah: vertikal di mobile, horizontal di desktop */}
              <span
                aria-hidden="true"
                className="absolute left-[17px] top-2 h-[calc(100%-2rem)] w-px bg-line md:left-2 md:top-[17px] md:h-px md:w-[calc(100%-1rem)]"
              />
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative md:flex-1">
                  <span className="relative z-10 mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mb-1 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Fitur lengkapnya: baris list, komposisinya sengaja beda dari timeline di atas */}
        <section id="fitur" className="scroll-mt-20 bg-accent-soft py-20 md:px-12">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-3 text-3xl font-bold text-primary">Fitur lengkapnya</h2>
            <p className="mb-10 text-ink-muted">
              Semua yang kamu butuh untuk menjaga prioritas tetap jalan tiap hari.
            </p>
            <ul className="divide-y divide-line">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex gap-4 py-6 first:pt-0">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-card"
                  >
                    <feature.icon size={20} />
                  </span>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-ink">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-primary py-16 px-6 md:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
              Siap mengurutkan prioritas hari ini?
            </h2>
            <Link
              href="/auth/signin"
              className="inline-flex h-12 items-center rounded-lg bg-white px-8 text-base font-semibold text-primary transition-colors duration-150 hover:bg-accent"
            >
              Mulai Prioritaskan Hari Ini
            </Link>
          </div>
        </section>

        {/* FAQ: detail/summary native, bisa dibuka-tutup dengan keyboard tanpa JS tambahan */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 md:px-12">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-primary">Pertanyaan umum</h2>
            <div className="divide-y divide-line border-y border-line">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className="flex-shrink-0 text-ink-muted transition-transform duration-150 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-ink-muted">Eitrix. Prioritas yang jelas, hari yang terkendali.</p>
          <div className="flex items-center gap-6">
            <Link href="#fitur" className="text-sm text-ink transition-colors duration-150 hover:text-primary">
              Fitur
            </Link>
            <Link href="#faq" className="text-sm text-ink transition-colors duration-150 hover:text-primary">
              FAQ
            </Link>
            <Link
              href="/auth/signin"
              className="text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary-hover"
            >
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
