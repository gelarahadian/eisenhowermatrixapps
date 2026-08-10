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
      if (!session?.user?.id) return;

      const newTask = await createTask({
        title: title.trim(),
        userId: session.user.id
      });

      onAddTask(newTask);
      setTitle('');
    }
  };

  return (
    <input
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Add a task and press Enter..."
      className="w-full p-2 border rounded mb-4"
    />
  );
}
