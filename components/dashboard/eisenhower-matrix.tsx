"use client";
import React, { useState, useEffect, useRef } from 'react';
import { DndContext, pointerWithin, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Quadrant } from './quadrant';
import { Task, Quadrant as QuadrantType } from '@/lib/types';
import { AddTaskDialog } from './add-task-dialog';
import { Statistics } from './statistics';
import { CompletedTasks } from './completed-tasks';
import { TaskCard } from './task-card';
import { QuickTaskInput } from './quick-task-input';
import { getTasks, updateTask, completeTask, bulkUpdateTasksOrder } from '@/app/actions/task-actions';
import { useSession } from 'next-auth/react';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export function EisenhowerMatrix() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Setup sensors untuk dnd-kit: drag aktif setelah geser 8px,
  // supaya tap/scroll di mobile tidak langsung memicu drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadTasks() {
      if (session && (session.user as any)?.id) {
        const fetchedTasks = await getTasks((session.user as any).id);
        setTasks(fetchedTasks);
      }
      setIsLoading(false);
    }
    loadTasks();
  }, [session]);

  // Toast otomatis hilang 3 detik (DESIGN.md §7)
  useEffect(() => {
    if (!toast) return;
    toastTimer.current = setTimeout(() => setToast(null), 3000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const generateSummary = () => {
    const quadrants = ['do', 'schedule', 'delegate', 'delete'] as const;
    let text = '';
    quadrants.forEach(q => {
      text += `${q.toUpperCase()}\n`;
      const qTasks = tasks.filter(t => t.quadrant === q);
      qTasks.forEach(t => {
        text += `- ${t.title}\n`;
      });
      text += '\n';
    });
    return text;
  };

  const handleCopySummary = async () => {
    const summary = generateSummary();
    try {
      await navigator.clipboard.writeText(summary);
      setToast('Tersalin ✓');
    } catch {
      setToast('Gagal menyalin');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => ((t as any)._id || t.id) !== taskId));
  };

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
    setTasks(prev =>
      prev.map(t =>
        ((t as any)._id || t.id) === taskId
          ? { ...t, completed: true, completedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleDueDateChange = async (taskId: string, dueDate: string) => {
    await updateTask(taskId, { dueDate: dueDate || null });
    setTasks(prev =>
      prev.map(t =>
        ((t as any)._id || t.id) === taskId
          ? { ...t, dueDate: dueDate ? new Date(dueDate).toISOString() : null }
          : t
      )
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeTask = tasks.find(t => ((t as any)._id || t.id) === active.id);
    setActiveTask(activeTask || null);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setIsDragging(false);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => ((t as any)._id || t.id) === activeId);
    const overTask = tasks.find(t => ((t as any)._id || t.id) === overId);

    if (!activeTask) return;

    // 1. Cek apakah drop di dalam kuadran yang sama (Sorting)
    if (overTask && activeTask.quadrant === overTask.quadrant) {
      const quadrantTasks = tasks.filter(t => t.quadrant === activeTask.quadrant);
      const oldIndex = quadrantTasks.findIndex(t => ((t as any)._id || t.id) === activeId);
      const newIndex = quadrantTasks.findIndex(t => ((t as any)._id || t.id) === overId);

      const newQuadrantTasks = arrayMove(quadrantTasks, oldIndex, newIndex);

      setTasks(prev => {
        const otherTasks = prev.filter(t => t.quadrant !== activeTask.quadrant);
        return [...otherTasks, ...newQuadrantTasks];
      });

      // Persist to DB
      const updatedTasksOrder = newQuadrantTasks.map((t, index) => ({
        id: ((t as any)._id || t.id) as string,
        order: index
      }));
      await bulkUpdateTasksOrder(updatedTasksOrder);

      return;
    }

    // 2. Drop pindah kuadran (Termasuk ke Inbox/null)
    const validQuadrants = ['do', 'schedule', 'delegate', 'delete'];
    const newQuadrant = validQuadrants.includes(overId) ? (overId as QuadrantType) : (overId === 'inbox' ? null : (overTask ? overTask.quadrant : null));

    setTasks((prev) =>
      prev.map((task) =>
        ((task as any)._id || task.id) === activeId ? { ...task, quadrant: newQuadrant } : task
      )
    );

    if ((session?.user as any)?.id) {
        await updateTask(activeId, { quadrant: newQuadrant || undefined });
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-4 flex gap-2">
              <AddTaskDialog onAddTask={handleAddTask} />
              <button
                onClick={handleCopySummary}
                className="inline-flex h-10 items-center rounded-lg border-[1.5px] border-primary bg-white px-4 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent"
              >
                Copy Summary
              </button>
            </div>

            {/* Sumbu label desktop */}
            <div className="mb-4 hidden grid-cols-[80px_1fr_1fr] gap-4 md:grid">
              <div />
              <div className="text-center text-lg font-bold text-primary">URGENT</div>
              <div className="text-center text-lg font-bold text-ink-muted">NOT URGENT</div>
            </div>

            {/* Satu set kuadran saja: grid 1 kolom di mobile (urutan DOM:
                DO → SCHEDULE → DELEGATE → DELETE, DESIGN.md §9) dan 3 kolom
                dengan label vertikal di md+. ID droppable tidak boleh diduplikasi
                atau dnd-kit rusak. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[80px_1fr_1fr]">
              <div className="hidden flex-col justify-between text-lg font-bold text-center text-primary md:flex">
                  <div className="flex h-[240px] items-center justify-center [writing-mode:vertical-rl] rotate-180">IMPORTANT</div>
                  <div className="flex h-[240px] items-center justify-center [writing-mode:vertical-rl] rotate-180">NOT IMPORTANT</div>
              </div>

              <Quadrant id="do" title="DO" tasks={tasks.filter(t => !t.completed && t.quadrant === 'do')} dragActive={isDragging} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="schedule" title="SCHEDULE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'schedule')} dragActive={isDragging} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="delegate" className="md:col-start-2" title="DELEGATE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'delegate')} dragActive={isDragging} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="delete" className="md:col-start-3" title="DELETE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'delete')} dragActive={isDragging} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
            </div>

            <Statistics tasks={tasks} />
            <CompletedTasks tasks={tasks} />
          </div>

          <aside className="rounded-card">
            <div className="mb-4 flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-primary">Inbox</h2>
              <QuickTaskInput onAddTask={handleAddTask} />
            </div>
            <Quadrant id="inbox" title="" tasks={tasks.filter(t => !t.completed && t.quadrant === null)} dragActive={isDragging} className="h-auto" onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
          </aside>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} hideHandle /> : null}
        </DragOverlay>

        {/* Toast feedback Copy Summary (DESIGN.md §7) */}
        {toast && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-modal"
          >
            {toast}
          </div>
        )}
      </div>
    </DndContext>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center md:px-8" role="status" aria-live="polite">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-primary" aria-hidden="true" />
      <p className="text-sm text-ink-muted">Memuat tugas…</p>
    </div>
  );
}
