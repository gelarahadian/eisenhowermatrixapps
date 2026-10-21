"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { WeeklyTask } from '@/lib/types';
import { WeeklyTaskCard } from './weekly-task-card';
import { createWeeklyTask, toggleDayCompletion, deleteWeeklyTask } from '@/app/actions/weekly-task-actions';

interface Props {
  initialTasks: WeeklyTask[];
  todayWibDay: number;
}

const DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

export function WeeklyTaskList({ initialTasks, todayWibDay }: Props) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<WeeklyTask[]>(initialTasks);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; day: number } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !(session.user as any)?.id || selectedDays.length === 0) return;

    const newTask = await createWeeklyTask({
      name: newName,
      daysOfWeek: selectedDays,
      userId: (session.user as any).id
    });

    setTasks(prev => [...prev, newTask]);
    setNewName('');
    setSelectedDays([]);
    setIsAddOpen(false);
  };

  const handleToggle = async (taskId: string, day: number) => {
    setPendingToggle({ id: taskId, day });
    try {
      const result = await toggleDayCompletion(taskId, day);
      if (result.success) {
        const updated = result.task;
        setTasks(prev =>
          prev.map(t =>
            ((t as any)._id || t.id) === taskId
              ? { ...t, doneDays: updated.doneDays }
              : t
          )
        );
      }
    } finally {
      setPendingToggle(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteWeeklyTask(taskId);
    setTasks(prev => prev.filter(t => ((t as any)._id || t.id) !== taskId));
  };

  const toggleDaySelection = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          + Add Weekly Task
        </button>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleAddTask} className="bg-white p-6 rounded-lg w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Weekly Task</h2>
            <label className="block text-sm text-gray-600 mb-1">Task Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Rapat Tim"
              className="w-full p-2 border rounded mb-4"
              required
            />
            <label className="block text-sm text-gray-600 mb-2">Jadwal (pilih hari)</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {DAY_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDaySelection(value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    selectedDays.includes(value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-red-500 mb-2">Pilih minimal satu hari.</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedDays.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <p className="text-gray-500 italic">Belum ada weekly task. Klik &quot;+ Add Weekly Task&quot; untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <WeeklyTaskCard
              key={(task as any)._id || task.id}
              task={task}
              todayWibDay={todayWibDay}
              isToggling={pendingToggle}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
