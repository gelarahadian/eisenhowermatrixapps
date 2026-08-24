"use client";
import React from 'react';
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

export function CompletedTasks({ tasks }: Props) {
  const completedTasks = tasks
    .filter(t => t.completed)
    .sort(
      (a, b) =>
        new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
    );

  return (
    <div className="mt-8 p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Tugas yang Selesai</h2>
      {completedTasks.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Belum ada tugas yang selesai.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {completedTasks.map(task => {
            const taskId = (task as any)._id || task.id;
            return (
              <li key={taskId} className="p-3 border rounded shadow-sm bg-white flex justify-between items-center gap-4">
                <span className="font-medium">{task.title}</span>
                <span className="text-sm text-gray-500 text-right whitespace-nowrap">
                  {task.quadrant ? <span className="capitalize mr-2">{task.quadrant}</span> : null}
                  Selesai pada {task.completedAt ? formatDateTime(task.completedAt) : '-'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
