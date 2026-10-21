"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { DailyTask } from '@/lib/types';
import { DailyTaskCard } from './daily-task-card';
import { createDailyTask, incrementDailyTask, decrementDailyTask, deleteDailyTask } from '@/app/actions/daily-task-actions';

interface Props {
  initialTasks: DailyTask[];
}

export function DailyTaskList({ initialTasks }: Props) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState<number>(10);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !(session.user as any)?.id) return;

    const newTask = await createDailyTask({
      name: newName,
      targetCount: newTarget,
      userId: (session.user as any).id
    });

    setTasks(prev => [...prev, newTask]);
    setNewName('');
    setNewTarget(10);
    setIsAddOpen(false);
  };

  const handleIncrement = async (taskId: string) => {
    setPendingTaskId(taskId);
    try {
      const updated = await incrementDailyTask(taskId);
      setTasks(prev =>
        prev.map(t =>
          ((t as any)._id || t.id) === taskId
            ? { ...t, currentCount: updated.currentCount, completed: updated.completed, completedAt: updated.completedAt }
            : t
        )
      );
    } finally {
      setPendingTaskId(null);
    }
  };

  const handleDecrement = async (taskId: string) => {
    const updated = await decrementDailyTask(taskId);
    setTasks(prev =>
      prev.map(t =>
        ((t as any)._id || t.id) === taskId
          ? { ...t, currentCount: updated.currentCount, completed: updated.completed, completedAt: updated.completedAt }
          : t
      )
    );
  };

  const handleDelete = async (taskId: string) => {
    await deleteDailyTask(taskId);
    setTasks(prev => prev.filter(t => ((t as any)._id || t.id) !== taskId));
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Daily Task
        </button>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleAddTask} className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Daily Task</h2>
            <label className="block text-sm text-gray-600 mb-1">Task Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Ajukan Proposal"
              className="w-full p-2 border rounded mb-4"
              required
            />
            <label className="block text-sm text-gray-600 mb-1">Target Count (per hari)</label>
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded mb-4"
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 italic">Belum ada daily task. Klik "+ Add Daily Task" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <DailyTaskCard
              key={(task as any)._id || task.id}
              task={task}
              isIncrementing={pendingTaskId === ((task as any)._id || task.id)}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
