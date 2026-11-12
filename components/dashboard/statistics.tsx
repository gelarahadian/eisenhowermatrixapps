"use client";
import React from 'react';
import { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
}

/*
 * Statistics sesuai DESIGN.md §6.3: angka 28px/700 teal, label 12px muted.
 */
export function Statistics({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const doCount = tasks.filter(t => t.quadrant === 'do').length;
  const scheduleCount = tasks.filter(t => t.quadrant === 'schedule').length;
  const delegateCount = tasks.filter(t => t.quadrant === 'delegate').length;
  const deleteCount = tasks.filter(t => t.quadrant === 'delete').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mt-8 rounded-card border border-line bg-white p-6 shadow-card">
      <h2 className="mb-4 text-xl font-semibold text-primary">Statistics</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-card bg-accent-soft p-4">
          <p className="text-xs font-medium text-ink-muted">Total Tasks</p>
          <p className="text-[28px] font-bold leading-tight text-primary">{total}</p>
        </div>
        <div className="rounded-card bg-accent-soft p-4">
          <p className="text-xs font-medium text-ink-muted">Completed</p>
          <p className="text-[28px] font-bold leading-tight text-primary">{completed}</p>
        </div>
        <div className="rounded-card border border-line p-4">
          <p className="text-xs font-medium text-ink-muted">Per kuadran</p>
          <p className="mt-1 text-sm font-medium text-ink">
            Do: {doCount} | Schedule: {scheduleCount}
            <br />
            Delegate: {delegateCount} | Delete: {deleteCount}
          </p>
        </div>
        <div className="rounded-card border border-line p-4">
          <p className="text-xs font-medium text-ink-muted">Progress</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[28px] font-bold leading-tight text-primary">{progressPercent}%</p>
        </div>
      </div>
    </div>
  );
}
