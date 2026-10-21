"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Eisenhower Todo Dashboard</h1>
      <div className="flex gap-3">
        <Link 
          href="/dashboard/daily-tasks"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Daily Tasks
        </Link>
        <Link 
          href="/dashboard/weekly-tasks"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Weekly Tasks
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
