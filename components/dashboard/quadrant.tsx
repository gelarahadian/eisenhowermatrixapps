"use client";
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

/*
 * Kuadran sesuai tabel §6.3: DO (header teal, area accent-soft),
 * SCHEDULE (header teal di putih), DELEGATE (header accent),
 * DELETE (dashed border, area #F6FAFB). Status juga dibedakan via
 * ikon/label, bukan hanya warna.
 */
const QUADRANT_STYLES: Record<string, { header: string; headerText: string; area: string; border: string; dragBorder: string; dragOver: string }> = {
  do: {
    header: 'bg-primary text-white',
    headerText: 'text-white',
    area: 'bg-accent-soft',
    border: 'border-2 border-solid border-primary',
    dragBorder: 'border-2 border-dashed border-accent-strong',
    dragOver: 'bg-accent/50 border-2 border-solid border-primary',
  },
  schedule: {
    header: 'bg-white',
    headerText: 'text-primary',
    area: 'bg-white',
    border: 'border-2 border-solid border-primary',
    dragBorder: 'border-2 border-dashed border-accent-strong',
    dragOver: 'bg-accent/50 border-2 border-solid border-primary',
  },
  delegate: {
    header: 'bg-accent',
    headerText: 'text-ink',
    area: 'bg-white',
    border: 'border-2 border-solid border-accent',
    dragBorder: 'border-2 border-dashed border-accent-strong',
    dragOver: 'bg-accent/50 border-2 border-solid border-primary',
  },
  delete: {
    header: 'bg-white',
    headerText: 'text-ink-muted',
    area: 'bg-[#F6FAFB]', // warna area DELETE sesuai DESIGN.md §6.3
    border: 'border-2 border-dashed border-accent',
    dragBorder: 'border-2 border-dashed border-accent-strong',
    dragOver: 'bg-accent/50 border-2 border-solid border-primary',
  },
  inbox: {
    header: 'bg-white',
    headerText: 'text-primary',
    area: 'bg-white',
    border: 'border border-solid border-line',
    dragBorder: 'border border-dashed border-accent-strong',
    dragOver: 'bg-accent/50 border-2 border-solid border-primary',
  },
};

interface Props {
  id: string;
  title: string;
  tasks: Task[];
  className?: string;
  dragActive?: boolean;
  onDeleteTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onDueDateChange?: (taskId: string, dueDate: string) => void;
}

export function Quadrant({ id, title, tasks, className = "h-full", dragActive = false, onDeleteTask, onCompleteTask, onDueDateChange }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const styles = QUADRANT_STYLES[id] ?? QUADRANT_STYLES.inbox;

  const containerClass = isOver
    ? `${styles.dragOver}`
    : dragActive
      ? styles.dragBorder
      : styles.border;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-card p-4 transition-colors duration-150 ${containerClass} ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-lg font-bold ${styles.headerText}`}>{title}</h2>
          <span
            className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-ink"
            aria-label={`${tasks.length} tugas`}
          >
            {tasks.length}
          </span>
        </div>
      )}
      <div className="min-h-[240px] flex flex-col gap-3">
        <SortableContext items={tasks.map(t => (t as any)._id || t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={(task as any)._id || task.id}
              task={task}
              onDelete={() => onDeleteTask?.((task as any)._id || task.id)}
              onComplete={() => onCompleteTask?.((task as any)._id || task.id)}
              onDueDateChange={onDueDateChange}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p key="empty-state" className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line px-3 text-center text-sm text-ink-muted italic">
            {title ? 'Tarik tugas ke sini' : 'Belum ada tugas'}
          </p>
        )}
      </div>
    </div>
  );
}
