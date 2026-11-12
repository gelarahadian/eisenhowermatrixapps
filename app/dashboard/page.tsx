import { getServerSession } from "next-auth";
import { EisenhowerMatrix } from '@/components/dashboard/eisenhower-matrix';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="px-4 pb-12 pt-8 md:px-8">
        <EisenhowerMatrix />
      </main>
    </div>
  );
}
