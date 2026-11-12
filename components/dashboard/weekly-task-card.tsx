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

/*
 * Kartu weekly task sesuai DESIGN.md §6.5 + chip §5.6:
 * selesai = teal + ✓ putih; hari ini = ring teal; lewat = abu;
 * masa depan = abu + not-allowed. Status dibedakan via ikon/label, bukan warna saja.
 */
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
    <div className="p-4 bg-white border border-line rounded-card shadow-card transition-shadow hover:border-accent-strong hover:shadow-hover">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
            {task.name}
            {task.daysOfWeek.includes(todayWibDay) && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                Hari ini
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="inline-flex h-8 items-center rounded-lg border border-danger bg-white px-2.5 text-sm font-semibold text-danger transition-colors duration-150 hover:bg-danger-soft"
        >
          Delete
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-ink-muted">Minggu ini</span>
          <span className="text-sm font-medium text-ink">
            {doneCount} / {task.daysOfWeek.length} hari
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-accent">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {scheduledDays.map((day) => {
          const isDone = task.doneDays.includes(day);
          const isPast = day < todayWibDay;
          const isToday = day === todayWibDay;
          const isTogglingThis = isToggling?.id === taskId && isToggling?.day === day;
          const clickable = day <= todayWibDay && !isBusy;

          const chipClass = isDone
            ? 'bg-primary text-white border-primary'
            : isToday
              ? 'bg-white text-primary border-primary ring-2 ring-primary'
              : isPast
                ? 'bg-disabled-bg text-disabled-text border-line'
                : 'bg-disabled-bg text-disabled-text border-line';

          return (
            <button
              key={day}
              onClick={() => handleToggle(day)}
              disabled={!clickable}
              aria-pressed={isDone}
              aria-label={`${DAY_LABELS[day]}${isDone ? ', selesai' : isPast ? ', belum selesai' : isToday ? ', hari ini' : ', belum waktunya'}`}
              title={isPast ? 'Hari sudah lewat' : isToday ? 'Hari ini' : 'Belum bisa diselesaikan'}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors duration-150 ${
                clickable && !isDone ? 'hover:border-primary hover:text-primary' : ''
              } ${!clickable ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} ${chipClass}`}
            >
              {isTogglingThis ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : isDone ? (
                <span aria-hidden="true">✓</span>
              ) : null}
              {DAY_LABELS[day]}
            </button>
          );
        })}
      </div>

      {historyEntries.length > 0 && (
        <div className="pt-3 border-t border-line">
          <button
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            className="mb-2 inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-primary transition-colors duration-150 hover:bg-accent"
          >
            <span aria-hidden="true">{showHistory ? '▲' : '▼'}</span> Lihat Riwayat ({historyEntries.length})
          </button>
          {showHistory && (
            <div className="rounded-lg bg-accent-soft p-2 text-xs space-y-1">
              {historyEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-ink-muted">Minggu {formatWeekStart(entry.weekStart)}</span>
                  <span className="font-medium text-ink">
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
