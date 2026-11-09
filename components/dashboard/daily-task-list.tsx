"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DailyTask } from '@/lib/types';
import { DailyTaskCard } from './daily-task-card';
import { createDailyTask, incrementDailyTask, decrementDailyTask, deleteDailyTask, updateDailyTask, updateDailyTaskTarget, reorderDailyTasks } from '@/app/actions/daily-task-actions';

interface Props {
  initialTasks: DailyTask[];
}

export function DailyTaskList({ initialTasks }: Props) {
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => ((t as any)._id || t.id) === active.id);
    const newIndex = tasks.findIndex(t => ((t as any)._id || t.id) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousTasks = tasks;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered);

    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const orderedIds = reordered.map(t => ((t as any)._id || t.id) as string);
    const res = await reorderDailyTasks(userId, orderedIds);
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
      ) : isMounted ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tasks.map(t => ((t as any)._id || t.id) as string)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <DailyTaskCard
                  key={(task as any)._id || task.id}
                  task={task}
                  isIncrementing={pendingTaskId === ((task as any)._id || task.id)}
                  isDecrementing={pendingDecrementTaskId === ((task as any)._id || task.id)}
                  isRenaming={pendingRenameTaskId === ((task as any)._id || task.id)}
                  isUpdatingTarget={pendingTargetTaskId === ((task as any)._id || task.id)}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onUpdateTarget={handleUpdateTarget}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <DailyTaskCard
              key={(task as any)._id || task.id}
              task={task}
              isIncrementing={pendingTaskId === ((task as any)._id || task.id)}
              isDecrementing={pendingDecrementTaskId === ((task as any)._id || task.id)}
              isRenaming={pendingRenameTaskId === ((task as any)._id || task.id)}
              isUpdatingTarget={pendingTargetTaskId === ((task as any)._id || task.id)}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onDelete={handleDelete}
              onRename={handleRename}
              onUpdateTarget={handleUpdateTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
