import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getWeeklyTasks } from "@/app/actions/weekly-task-actions";
import { getWibDayOfWeek } from "@/lib/dates";
import { WeeklyTaskList } from "@/components/dashboard/weekly-task-list";

export default async function WeeklyTasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const userId = (session.user as any)?.id;
  const tasks = await getWeeklyTasks(userId);
  const todayWibDay = getWibDayOfWeek();

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Weekly Tasks</h1>
          <p className="text-gray-600 mt-1">Tugas mingguan sesuai jadwal. Reset otomatis setiap Senin.</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <WeeklyTaskList initialTasks={tasks} todayWibDay={todayWibDay} />
    </main>
  );
}
