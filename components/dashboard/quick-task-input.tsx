"use client";
import React, { useState } from 'react';
import { createTask } from '@/app/actions/task-actions';
import { useSession } from 'next-auth/react';
import { Task } from '@/lib/types';

interface Props {
  onAddTask: (task: Task) => void;
}

export function QuickTaskInput({ onAddTask }: Props) {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
      if (!session || !(session.user as any)?.id) return;

      const newTask = await createTask({
        title: title.trim(),
        userId: (session.user as any).id
      });

      onAddTask(newTask);
      setTitle('');
    }
  };

  return (
    <div>
      <label htmlFor="quick-task-input" className="mb-1 block text-sm font-medium text-ink">
        Tambah cepat
      </label>
      <input
        id="quick-task-input"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ketik tugas lalu tekan Enter…"
        className="h-10 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none"
      />
    </div>
  );
}
