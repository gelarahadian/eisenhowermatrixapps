"use client";
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { WeeklyTask } from '@/lib/types';

interface Props {
  task: WeeklyTask;
  todayWibDay: number;
  isToggling?: { id: string; day: number } | null;
  onToggle?: (taskId: string, day: number) => void;
  onDelete?: (taskId: string) => void;
}

const DAY_LABELS: Record<number, string> = {
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab',
  0: 'Min',
};

export function WeeklyTaskCard({ task, todayWibDay, isToggling, onToggle, onDelete }: Props) {
  const taskId = task.id || (task as any)._id;
  const scheduledDays = [...task.daysOfWeek].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const doneCount = task.doneDays.filter((d) => task.daysOfWeek.includes(d)).length;
  const progress = Math.min((doneCount / task.daysOfWeek.length) * 100, 100);
  const [showHistory, setShowHistory] = useState(false);
  const historyEntries = task.history || [];
  const isBusy = isToggling !== null && isToggling !== undefined;

  const handleToggle = (day: number) => {
    if (day <= todayWibDay && onToggle && !isBusy) {
      onToggle(taskId, day);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(taskId);
    }
  };

  const formatWeekStart = (weekStart: string) => {
    const date = new Date(`${weekStart}T00:00:00`);
    if (isNaN(date.getTime())) {
      return weekStart;
    }
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow">
          <h3 className="font-semibold text-lg">
            {task.name}
            {task.daysOfWeek.includes(todayWibDay) && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full align-middle">
                Hari ini
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          Delete
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Minggu ini</span>
          <span className="text-sm font-medium">
            {doneCount} / {task.daysOfWeek.length} hari
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all bg-indigo-600"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {scheduledDays.map((day) => {
          const isDone = task.doneDays.includes(day);
          const isPast = day < todayWibDay;
          const isToday = day === todayWibDay;
          const isTogglingThis = isToggling?.id === taskId && isToggling?.day === day;
          const clickable = day <= todayWibDay && !isBusy;

          return (
            <button
              key={day}
              onClick={() => handleToggle(day)}
              disabled={!clickable}
              title={isPast ? 'Hari sudah lewat' : isToday ? 'Hari ini' : 'Belum waktunya'}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition flex items-center gap-1.5 ${
                isDone
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : isToday
                    ? 'bg-white text-indigo-700 border-indigo-400 ring-1 ring-indigo-400'
                    : isPast
                      ? 'bg-white text-gray-400 border-gray-200'
                      : 'bg-white text-gray-500 border-gray-300'
              } ${clickable && !isDone ? 'hover:border-indigo-500 hover:text-indigo-600' : ''} ${
                !clickable ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
              }`}
            >
              {isTogglingThis ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isDone ? (
                '✓'
              ) : null}
              {DAY_LABELS[day]}
            </button>
          );
        })}
      </div>

      {historyEntries.length > 0 && (
        <div className="pt-3 border-t">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mb-2 px-2 py-1 bg-indigo-50 rounded hover:bg-indigo-100 transition"
          >
            {showHistory ? '▲' : '▼'} Lihat Riwayat ({historyEntries.length})
          </button>
          {showHistory && (
            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
              {historyEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">Minggu {formatWeekStart(entry.weekStart)}</span>
                  <span className="font-medium text-gray-900">
                    {entry.completedDays.length} hari selesai
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
