"use client";
import React, { useState } from 'react';
import { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
}

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

/*
 * Tugas yang selesai: section collapsible (DESIGN.md §6.3),
 * teks dicoret, opasitas 0.7, ikon ✓ teal.
 */
export function CompletedTasks({ tasks }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const completedTasks = tasks
    .filter(t => t.completed)
    .sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    );

  return (
    <div className="mt-8 rounded-card border border-line bg-white p-6 shadow-card">
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        className="mb-1 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent"
      >
        <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
        Tugas yang Selesai ({completedTasks.length})
      </button>

      {isOpen && (
        completedTasks.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted italic">Belum ada tugas yang selesai.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {completedTasks.map(task => {
              const taskId = (task as any)._id || task.id;
              return (
                <li
                  key={taskId}
                  className="flex items-center justify-between gap-4 rounded-card border border-line bg-white p-3 opacity-70"
                >
                  <span className="flex items-center gap-2 font-medium text-ink">
                    <span className="text-primary" aria-hidden="true">✓</span>
                    <span className="line-through">{task.title}</span>
                  </span>
                  <span className="whitespace-nowrap text-right text-sm text-ink-muted">
                    {task.quadrant ? <span className="mr-2 capitalize">{task.quadrant}</span> : null}
                    Selesai pada {task.completedAt ? formatDateTime(task.completedAt) : '-'}
                  </span>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
