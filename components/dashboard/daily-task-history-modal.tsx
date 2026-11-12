"use client";
import React, { useEffect, useRef, useState } from 'react';
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
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Escape menutup; fokus kembali ke pemicu (DESIGN.md §5.4)
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
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
        ? 'bg-primary text-white'
        : partial
          ? 'bg-accent text-ink'
          : 'bg-disabled-bg text-disabled-text'
    } ${isToday ? 'ring-2 ring-primary' : ''} ${extra}`;
  };

  const TABS: [Tab, string][] = [
    ['week', '7 Hari'],
    ['month', '1 Bulan'],
    ['year', '1 Tahun'],
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(11,58,66,0.45)] p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] rounded-dialog bg-white p-6 shadow-modal max-sm:rounded-b-none"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 id="history-title" className="text-xl font-semibold text-primary">
              Riwayat: {task.name}
            </h2>
            <p className="text-sm text-ink-muted">Target harian: {task.targetCount}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup riwayat"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors duration-150 hover:bg-accent-soft"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Tab pill: container accent-soft, aktif teal (DESIGN.md §5.7) */}
        <div className="mb-4 inline-flex gap-1 rounded-full bg-accent-soft p-1" role="tablist" aria-label="Rentang riwayat">
          {TABS.map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                tab === value ? 'bg-primary text-white' : 'text-primary hover:bg-accent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'week' && (
          <div className="space-y-1" role="tabpanel">
            {last7Days.map((dateStr) => {
              const count = countForDay(dateStr);
              return (
                <div key={dateStr} className="flex justify-between items-center rounded-lg bg-accent-soft px-2 py-1.5">
                  <span className="text-sm text-ink">{formatDay(dateStr)}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {count !== null ? `${count} / ${task.targetCount}` : '-'}
                    </span>
                    <span className={cellClass(dateStr, 'h-6 w-6')}>
                      {isDoneForDay(dateStr) ? '✓' : ''}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'month' && (
          <div role="tabpanel">
            <p className="mb-2 text-sm text-ink-muted">{formatMonthLabel(todayYear, todayMonth - 1)}</p>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAY_LETTERS_MON_FIRST.map((letter, i) => (
                <div key={i} className="text-center text-xs font-medium text-ink-muted">
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
          <div className="space-y-1" role="tabpanel">
            {yearMonths.map(({ label, done, total }) => (
              <div key={label} className="flex justify-between items-center rounded-lg bg-accent-soft px-2 py-1.5">
                <span className="text-sm capitalize text-ink">{label}</span>
                <span className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm font-medium text-ink">
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
