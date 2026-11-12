import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getDailyTasks } from "@/app/actions/daily-task-actions";
import { DailyTaskList } from "@/components/dashboard/daily-task-list";

export default async function DailyTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const userId = (session.user as any)?.id;
  const tasks = await getDailyTasks(userId);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Daily Tasks</h1>
            <p className="mt-1 text-ink-muted">Track your daily task quotas. Reset otomatis setiap hari.</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <DailyTaskList initialTasks={tasks} />
      </div>
    </main>
  );
}
