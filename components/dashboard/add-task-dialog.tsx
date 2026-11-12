"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createTask } from '@/app/actions/task-actions';
import { useSession } from 'next-auth/react';
import { Task } from '@/lib/types';
import { X } from 'lucide-react';

interface Props {
  onAddTask: (task: Task) => void;
}

const inputClass =
  'h-10 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none';

export function AddTaskDialog({ onAddTask }: Props) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const panelRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Escape menutup; fokus terkunci di dalam dialog (DESIGN.md §5.4)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
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
    // Fokus awal ke input judul
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Kembalikan fokus ke pemicu setelah dialog ditutup
  useEffect(() => {
    if (!isOpen) triggerRef.current?.focus();
  }, [isOpen]);

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
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press sm:w-auto"
      >
        + Add Task
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[rgba(11,58,66,0.45)] p-4 sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <form
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-dialog bg-white p-6 shadow-modal max-sm:rounded-b-none"
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 id="add-task-title" className="text-xl font-semibold text-primary">
                Add New Task
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup dialog"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors duration-150 hover:bg-accent-soft"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-ink">
              Judul tugas
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className={`${inputClass} mb-3`}
              required
            />
            <label htmlFor="task-desc" className="mb-1 block text-sm font-medium text-ink">
              Deskripsi
            </label>
            <textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="mb-3 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none"
            />
            <label htmlFor="task-due" className="mb-1 block text-sm font-medium text-ink">
              Deadline (opsional)
            </label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${inputClass} mb-6`}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
