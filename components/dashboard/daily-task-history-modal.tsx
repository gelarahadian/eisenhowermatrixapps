"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DailyTask } from '@/lib/types';
import { getWibTodayString } from '@/lib/dates';

interface Props {
  task: DailyTask;
  open: boolean;
  onClose: () => void;
}

type Tab = 'week' | 'month' | 'year';

const DAY_MS = 86400000;
const WEEKDAY_LETTERS_MON_FIRST = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

const pad = (n: number) => String(n).padStart(2, '0');

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d) + days * DAY_MS);
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function formatDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatMonthLabel(year: number, monthIndex: number): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    year: 'numeric'
  });
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function DailyTaskHistoryModal({ task, open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('week');
  const today = getWibTodayString();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const countForDay = (dateStr: string): number | null => {
    if (dateStr === today) return task.currentCount;
    const entry = task.history.find(h => h.date === dateStr);
    return entry ? entry.completedCount : null;
  };

  const isDoneForDay = (dateStr: string): boolean => {
    const count = countForDay(dateStr);
    return count !== null && count >= task.targetCount;
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));

  const [todayYear, todayMonth] = today.split('-').map(Number);
  const monthDays = Array.from({ length: daysInMonth(todayYear, todayMonth - 1) }, (_, i) => {
    const day = i + 1;
    return {
      day,
      dateStr: `${todayYear}-${pad(todayMonth)}-${pad(day)}`
    };
  });
  const firstWeekdayOffset = (new Date(Date.UTC(todayYear, todayMonth - 1, 1)).getUTCDay() + 6) % 7;

  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    const monthIndex = todayMonth - 1 - i;
    const year = todayYear + Math.floor(monthIndex / 12);
    const normalizedMonth = ((monthIndex % 12) + 12) % 12;
    const total = daysInMonth(year, normalizedMonth);
    const done = Array.from({ length: total }, (_, j) => {
      const dateStr = `${year}-${pad(normalizedMonth + 1)}-${pad(j + 1)}`;
      return isDoneForDay(dateStr);
    }).filter(Boolean).length;
    return { year, month: normalizedMonth, label: formatMonthLabel(year, normalizedMonth), done, total };
  });

  const cellClass = (dateStr: string, extra = '') => {
    const done = isDoneForDay(dateStr);
    const count = countForDay(dateStr);
    const partial = !done && count !== null && count > 0;
    const isToday = dateStr === today;
    return `flex items-center justify-center rounded text-xs font-medium ${
      done
        ? 'bg-green-500 text-white'
        : partial
          ? 'bg-blue-200 text-blue-900'
          : 'bg-gray-100 text-gray-400'
    } ${isToday ? 'ring-2 ring-blue-400' : ''} ${extra}`;
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Riwayat: {task.name}</h2>
            <p className="text-sm text-gray-500">Target harian: {task.targetCount}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {([
            ['week', '7 Hari'],
            ['month', '1 Bulan'],
            ['year', '1 Tahun']
          ] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                tab === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'week' && (
          <div className="space-y-1">
            {last7Days.map((dateStr) => {
              const count = countForDay(dateStr);
              return (
                <div key={dateStr} className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-50">
                  <span className="text-sm text-gray-700">{formatDay(dateStr)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {count !== null ? `${count} / ${task.targetCount}` : '-'}
                    </span>
                    <span className={cellClass(dateStr, 'w-6 h-6')}>
                      {isDoneForDay(dateStr) ? '✓' : ''}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'month' && (
          <div>
            <p className="text-sm text-gray-600 mb-2">{formatMonthLabel(todayYear, todayMonth - 1)}</p>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LETTERS_MON_FIRST.map((letter, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-medium">
                  {letter}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekdayOffset }, (_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {monthDays.map(({ day, dateStr }) => (
                <div
                  key={dateStr}
                  title={`${formatDay(dateStr)}${countForDay(dateStr) !== null ? ` — ${countForDay(dateStr)} / ${task.targetCount}` : ''}`}
                  className={cellClass(dateStr, 'aspect-square')}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'year' && (
          <div className="space-y-1">
            {yearMonths.map(({ label, done, total }) => (
              <div key={label} className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-50">
                <span className="text-sm text-gray-700 capitalize">{label}</span>
                <span className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">
                    {done} / {total} hari
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
