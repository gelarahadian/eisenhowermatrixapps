"use client";
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface Props {
  id: string;
  title: string;
  tasks: Task[];
  className?: string;
  onDeleteTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
  onDueDateChange?: (taskId: string, dueDate: string) => void;
}

export function Quadrant({ id, title, tasks, className = "h-full", onDeleteTask, onCompleteTask, onDueDateChange }: Props) {
  // Jadikan seluruh div container sebagai droppable area
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border p-4 rounded-lg ${className} transition-colors ${isOver ? 'bg-blue-100 border-blue-400' : 'bg-gray-50'}`}
    >
      <h2 className="font-bold text-lg mb-4">{title}</h2>
      {/* Tambahkan gap-2 pada div wrapper tasks */}
      <div className="min-h-[200px] flex flex-col gap-2">
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
          <p key="empty-state" className="text-sm text-gray-400 italic">No tasks here. Drag a task here to prioritize it.</p>
        )}
      </div>
    </div>
  );
}
