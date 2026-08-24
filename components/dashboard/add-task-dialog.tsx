"use client";
import React, { useState } from 'react';
import { createTask } from '@/app/actions/task-actions';
import { useSession } from 'next-auth/react';
import { Task } from '@/lib/types';

interface Props {
  onAddTask: (task: Task) => void;
}

export function AddTaskDialog({ onAddTask }: Props) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !(session.user as any)?.id) return;

    const newTask = await createTask({
      title,
      description,
      dueDate: dueDate || null,
      userId: (session.user as any).id
    });

    onAddTask(newTask);
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsOpen(false);
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full"
      >
        + Add Task
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className="w-full p-2 border rounded mb-2"
              required
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full p-2 border rounded mb-4"
            />
            <label className="block text-sm text-gray-600 mb-1">Deadline (opsional)</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Task</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
