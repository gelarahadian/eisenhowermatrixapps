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
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Daily Tasks</h1>
          <p className="text-gray-600 mt-1">Track your daily task quotas. Reset otomatis setiap hari.</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <DailyTaskList initialTasks={tasks} />
    </main>
  );
}
