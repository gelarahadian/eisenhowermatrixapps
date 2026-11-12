import Link from 'next/link';
import { Move, Crosshair, UserRoundMinus, ChartColumn } from 'lucide-react';

/*
 * Landing sesuai DESIGN.md §6.1.
 * Identitas: satu keluarga warna teal (60/30/10), putih dominan.
 * Icon dipilih relevan dengan fiturnya (drag, fokus, delegasi, statistik).
 */

const QUADRANT_PREVIEW = [
  { label: 'DO', header: 'bg-primary text-white', area: 'bg-accent-soft border-2 border-primary' },
  { label: 'SCHEDULE', header: 'text-primary', area: 'bg-white border-2 border-primary' },
  { label: 'DELEGATE', header: 'text-ink', area: 'bg-white border-2 border-accent' },
  { label: 'DELETE', header: 'text-ink-muted', area: 'border-2 border-dashed border-accent' },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-white px-6 py-4 md:px-12">
        <Link href="/" className="text-xl font-bold text-primary md:text-2xl">
          Eisenhower Todo
        </Link>
        <Link
          href="/auth/signin"
          className="inline-flex h-10 items-center rounded-lg border-[1.5px] border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent"
        >
          Login
        </Link>
      </nav>

      <header className="relative overflow-hidden px-6 py-24 text-center md:px-12">
        {/* Aksen halus di belakang heading: menandai satu titik fokus hero (DESIGN.md §6.1) */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-soft blur-3xl" />
        <h2 className="mx-auto max-w-3xl text-5xl font-bold leading-[1.1] text-primary md:text-6xl">
          Prioritize what <span className="text-ink">matters</span>.
        </h2>
        <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg text-ink-muted md:text-xl">
          Stop wasting time on unimportant tasks. Organize your work effectively using the proven Eisenhower Matrix methodology.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-base font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
        >
          Start Prioritizing Today
        </Link>

        {/* Mockup matriks 2x2: memperlihatkan produk nyata, bukan ilustrasi generik */}
        <div className="mx-auto mt-16 grid w-full max-w-2xl grid-cols-2 gap-3 rounded-card border border-line bg-white p-4 shadow-card">
          {QUADRANT_PREVIEW.map((q) => (
            <div key={q.label} className="rounded-card border border-line p-3">
              <p className={`mb-2 text-center text-xs font-bold uppercase tracking-wide ${q.header}`}>{q.label}</p>
              <div className={`h-16 rounded-lg ${q.area}`} />
            </div>
          ))}
        </div>
      </header>

      <section className="bg-accent-soft py-20 md:px-12">
        <div className="mx-auto max-w-6xl px-6">
          <h3 className="mb-12 text-3xl font-bold text-primary">How it works</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Move size={24} aria-hidden="true" />}
              title="Categorize Instantly"
              description="Drag and drop tasks into Urgent/Important quadrants."
            />
            <FeatureCard
              icon={<Crosshair size={24} aria-hidden="true" />}
              title="Stay Focused"
              description="Identify what needs immediate action and what can be scheduled."
            />
            <FeatureCard
              icon={<UserRoundMinus size={24} aria-hidden="true" />}
              title="Delegate & Delete"
              description="Clear your plate by delegating tasks or deleting distractions."
            />
            <FeatureCard
              icon={<ChartColumn size={24} aria-hidden="true" />}
              title="Track Progress"
              description="Monitor your efficiency with built-in statistics."
            />
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 px-6 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="mb-6 text-2xl font-bold text-white md:text-3xl">
            Siap mengurutkan prioritas hari ini?
          </h3>
          <Link
            href="/auth/signin"
            className="inline-flex h-12 items-center rounded-lg bg-white px-8 text-base font-semibold text-primary transition-colors duration-150 hover:bg-accent"
          >
            Start Prioritizing Today
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-white px-6 py-8 md:px-12">
        <p className="text-center text-sm text-ink-muted">
          Eisenhower Todo. Prioritas yang jelas, hari yang terkendali.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-card shadow-card">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
        {icon}
      </div>
      <h4 className="mb-2 text-xl font-semibold text-ink">{title}</h4>
      <p className="text-ink-muted">{description}</p>
    </div>
  );
}
