"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { WeeklyTask } from '@/lib/types';
import { WeeklyTaskCard } from './weekly-task-card';
import { createWeeklyTask, toggleDayCompletion, deleteWeeklyTask } from '@/app/actions/weekly-task-actions';
import { X } from 'lucide-react';

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

const inputClass =
  'h-10 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none';

export function WeeklyTaskList({ initialTasks, todayWibDay }: Props) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<WeeklyTask[]>(initialTasks);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; day: number } | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const panelRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape menutup + focus trap dialog (DESIGN.md §5.4)
  useEffect(() => {
    if (!isAddOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddOpen]);

  useEffect(() => {
    if (!isAddOpen) triggerRef.current?.focus();
  }, [isAddOpen]);

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
      <div className="mb-6 mt-8">
        <button
          ref={triggerRef}
          onClick={() => setIsAddOpen(true)}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
        >
          + Add Weekly Task
        </button>
      </div>

      {isAddOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(11,58,66,0.45)] p-4 sm:items-center"
          onClick={() => setIsAddOpen(false)}
        >
          <form
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-weekly-title"
            onSubmit={handleAddTask}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-dialog bg-white p-6 shadow-modal max-sm:rounded-b-none"
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 id="add-weekly-title" className="text-xl font-semibold text-primary">
                Add Weekly Task
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                aria-label="Tutup dialog"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors duration-150 hover:bg-accent-soft"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="weekly-name" className="mb-1 block text-sm font-medium text-ink">
              Nama task
            </label>
            <input
              id="weekly-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Rapat Tim"
              className={`${inputClass} mb-3`}
              required
            />
            <p className="mb-2 text-sm font-medium text-ink" id="weekly-days-label">
              Jadwal (pilih hari)
            </p>
            <div className="mb-3 flex flex-wrap gap-2" role="group" aria-labelledby="weekly-days-label">
              {DAY_OPTIONS.map(({ value, label }) => {
                const selected = selectedDays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDaySelection(value)}
                    aria-pressed={selected}
                    className={`h-8 rounded-full px-3 text-sm font-semibold transition-colors duration-150 ${
                      selected
                        ? 'bg-primary text-white'
                        : 'bg-accent text-ink hover:bg-accent-strong'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {selectedDays.length === 0 && (
              <p className="mb-2 text-xs text-danger" role="alert">Pilih minimal satu hari.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedDays.length === 0}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press disabled:bg-disabled-bg disabled:text-disabled-text"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-accent-soft py-12 text-center">
          <p className="text-ink-muted italic">Belum ada weekly task. Klik "+ Add Weekly Task" untuk mulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
