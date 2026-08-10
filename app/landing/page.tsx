import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex justify-between items-center py-6 px-12 border-b">
        <h1 className="text-2xl font-bold text-blue-600">Eisenhower Todo</h1>
        <div className="flex gap-4">
          <Link href="/auth/signin" className="px-4 py-2 text-gray-600 hover:text-blue-600">Login</Link>
          <Link href="/auth/signin" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get Started</Link>
        </div>
      </nav>

      <header className="py-24 px-12 text-center">
        <h2 className="text-6xl font-extrabold text-gray-900 mb-6">
          Prioritize what <span className="text-blue-600">matters</span>.
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Stop wasting time on unimportant tasks. Organize your work effectively using the proven Eisenhower Matrix methodology.
        </p>
        <Link href="/auth/signin" className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition">
          Start Prioritizing Today
        </Link>
      </header>

      <section className="py-20 bg-gray-50 px-12">
        <h3 className="text-3xl font-bold text-center mb-12">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <FeatureCard title="Categorize Instantly" description="Drag and drop tasks into Urgent/Important quadrants." />
          <FeatureCard title="Stay Focused" description="Identify what needs immediate action and what can be scheduled." />
          <FeatureCard title="Delegate & Delete" description="Clear your plate by delegating tasks or deleting distractions." />
          <FeatureCard title="Track Progress" description="Monitor your efficiency with built-in statistics." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
