"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DailyTask, Task } from '@/lib/types';
import { DailyTaskCard } from './daily-task-card';
import { TaskCard } from './task-card';
import { createDailyTask, incrementDailyTask, decrementDailyTask, deleteDailyTask, updateDailyTask, updateDailyTaskTarget, reorderDailyTasks } from '@/app/actions/daily-task-actions';
import { completeTask, updateTask, deleteTask } from '@/app/actions/task-actions';
import { X, Loader2 } from 'lucide-react';

interface Props {
  initialTasks: DailyTask[];
  doTasks?: Task[];
}

const inputClass =
  'h-10 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none';

export function DailyTaskList({ initialTasks, doTasks = [] }: Props) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [pendingDecrementTaskId, setPendingDecrementTaskId] = useState<string | null>(null);
  const [pendingRenameTaskId, setPendingRenameTaskId] = useState<string | null>(null);
  const [pendingTargetTaskId, setPendingTargetTaskId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState<number>(10);
  const [isMounted, setIsMounted] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const panelRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handlers for DO tasks (Eisenhower tasks) - TaskCard handles server actions internally
  const handleDoComplete = () => {};
  const handleDoDelete = () => {};
  const handleDoDueDateChange = () => {};

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => ((t as any)._id || t.id) === active.id);
    const newIndex = tasks.findIndex(t => ((t as any)._id || t.id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousTasks = tasks;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);
    setIsReordering(true);

    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const orderedIds = reordered.map(t => ((t as any)._id || t.id) as string);
    const res = await reorderDailyTasks(userId, orderedIds);
    setIsReordering(false);
    if (!res.success) {
      setTasks(previousTasks);
    }
  };

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
    setPendingDecrementTaskId(taskId);
    try {
      const updated = await decrementDailyTask(taskId);
      setTasks(prev =>
        prev.map(t =>
          ((t as any)._id || t.id) === taskId
            ? { ...t, currentCount: updated.currentCount, completed: updated.completed, completedAt: updated.completedAt }
            : t
        )
      );
    } finally {
      setPendingDecrementTaskId(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteDailyTask(taskId);
    setTasks(prev => prev.filter(t => ((t as any)._id || t.id) !== taskId));
  };

  const handleUpdateTarget = async (taskId: string, newTarget: number): Promise<{ success: boolean; error?: string }> => {
    setPendingTargetTaskId(taskId);
    try {
      const res = await updateDailyTaskTarget(taskId, newTarget);
      if (res.success && 'task' in res && res.task) {
        setTasks(prev =>
          prev.map(t =>
            ((t as any)._id || t.id) === taskId
              ? { ...t, targetCount: res.task.targetCount, completed: res.task.completed, completedAt: res.task.completedAt }
              : t
          )
        );
      }
      return res;
    } catch {
      return { success: false, error: 'Gagal menyimpan' };
    } finally {
      setPendingTargetTaskId(null);
    }
  };

  const handleRename = async (taskId: string, newName: string): Promise<{ success: boolean; error?: string }> => {
    setPendingRenameTaskId(taskId);
    try {
      const res = await updateDailyTask(taskId, newName);
      if (res.success && 'task' in res && res.task) {
        setTasks(prev =>
          prev.map(t =>
            ((t as any)._id || t.id) === taskId
              ? { ...t, name: res.task.name }
              : t
          )
        );
      }
      return res;
    } catch {
      return { success: false, error: 'Gagal menyimpan' };
    } finally {
      setPendingRenameTaskId(null);
    }
  };

  const cardProps = (task: DailyTask) => ({
    task,
    isIncrementing: pendingTaskId === ((task as any)._id || task.id),
    isDecrementing: pendingDecrementTaskId === ((task as any)._id || task.id),
    isRenaming: pendingRenameTaskId === ((task as any)._id || task.id),
    isUpdatingTarget: pendingTargetTaskId === ((task as any)._id || task.id),
    onIncrement: handleIncrement,
    onDecrement: handleDecrement,
    onDelete: handleDelete,
    onRename: handleRename,
    onUpdateTarget: handleUpdateTarget,
  });

  return (
    <div>
      <div className="mb-6 mt-8 flex items-center gap-3">
        <button
          ref={triggerRef}
          onClick={() => setIsAddOpen(true)}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
        >
          + Add Daily Task
        </button>
        {/* Indikator ringan saat urutan disimpan (DESIGN.md §6.4) */}
        {isReordering && (
          <span className="flex items-center gap-1.5 text-sm text-ink-muted" role="status">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            Menyimpan…
          </span>
        )}
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
            aria-labelledby="add-daily-title"
            onSubmit={handleAddTask}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-dialog bg-white p-6 shadow-modal max-sm:rounded-b-none"
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 id="add-daily-title" className="text-xl font-semibold text-primary">
                Add Daily Task
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
            <label htmlFor="daily-name" className="mb-1 block text-sm font-medium text-ink">
              Nama task
            </label>
            <input
              id="daily-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Minum air putih"
              className={`${inputClass} mb-3`}
              required
            />
            <label htmlFor="daily-target" className="mb-1 block text-sm font-medium text-ink">
              Target count (per hari)
            </label>
            <input
              id="daily-target"
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(parseInt(e.target.value) || 1)}
              className={`${inputClass} mb-6`}
              required
            />
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
                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DO Tasks Section - Eisenhower Matrix "Do Now" */}
      {doTasks.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
              ⚡ Do Now (Eisenhower)
              <span className="inline-flex h-5 items-center rounded-full bg-accent px-2 text-xs font-semibold text-ink">
                Eisenhower
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doTasks.map((task) => (
              <TaskCard
                key={(task as any)._id || task.id}
                task={task}
                source="eisenhower"
                onComplete={handleDoComplete}
                onDelete={handleDoDelete}
                onDueDateChange={handleDoDueDateChange}
              />
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-accent-soft py-12 text-center">
          <p className="text-ink-muted italic">Belum ada daily task. Klik "+ Add Daily Task" untuk mulai.</p>
        </div>
      ) : isMounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => ((t as any)._id || t.id) as string)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <DailyTaskCard key={(task as any)._id || task.id} {...cardProps(task)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <DailyTaskCard key={(task as any)._id || task.id} {...cardProps(task)} />
          ))}
        </div>
      )}
    </div>
  );
}
