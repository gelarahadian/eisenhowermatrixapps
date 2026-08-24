"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, pointerWithin, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Quadrant } from './quadrant';
import { Task, Quadrant as QuadrantType } from '@/lib/types';
import { AddTaskDialog } from './add-task-dialog';
import { TaskList } from './task-list';
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
  const [isLoading, setIsLoading] = useState(true);

  // Setup sensors untuk dnd-kit agar lebih responsif
  const sensors = useSensors(
    useSensor(PointerSensor),
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

  const handleCopySummary = () => {
    const summary = generateSummary();
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
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
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
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

  if (isLoading) return <div>Loading...</div>;

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="mb-4 flex gap-2">
            <AddTaskDialog onAddTask={handleAddTask} />
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Copy Summary
            </button>
          </div>

          <div className="grid grid-cols-[80px_1fr_1fr] gap-4 mb-4">
            <div />
            <div className="text-center font-bold text-lg">URGENT</div>
            <div className="text-center font-bold text-lg">NOT URGENT</div>
          </div>

          <div className="grid grid-cols-[80px_1fr_1fr] gap-4">
            <div className="flex flex-col justify-between font-bold text-lg text-center">
                <div className="h-[200px] flex items-center justify-center [writing-mode:vertical-rl] rotate-180">IMPORTANT</div>
                <div className="h-[200px] flex items-center justify-center [writing-mode:vertical-rl] rotate-180">NOT IMPORTANT</div>
            </div>

            <div className="grid grid-cols-2 gap-4 col-span-2">
              <Quadrant id="do" title="DO" tasks={tasks.filter(t => !t.completed && t.quadrant === 'do')} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="schedule" title="SCHEDULE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'schedule')} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="delegate" title="DELEGATE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'delegate')} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
              <Quadrant id="delete" title="DELETE" tasks={tasks.filter(t => !t.completed && t.quadrant === 'delete')} onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
            </div>
          </div>
          <Statistics tasks={tasks} />
          <CompletedTasks tasks={tasks} />
        </div>

        <div className="rounded-lg">
          <div className="flex flex-col gap-4 mb-4">
            <h2 className="text-xl font-bold">Inbox</h2>
            <QuickTaskInput onAddTask={handleAddTask} />
          </div>
          <Quadrant id="inbox" title="" tasks={tasks.filter(t => !t.completed && t.quadrant === null)} className="h-auto" onDeleteTask={handleDeleteTask} onCompleteTask={handleCompleteTask} onDueDateChange={handleDueDateChange} />
        </div>
        
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </div>
      
      <TaskList tasks={tasks} />
    </DndContext>
  );
}
