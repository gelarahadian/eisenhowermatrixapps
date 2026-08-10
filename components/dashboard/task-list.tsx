"use client";
import React from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface Props {
  tasks: Task[];
}

export function TaskList({ tasks }: Props) {
  const quadrants: ('do' | 'schedule' | 'delegate' | 'delete' | null)[] = ['do', 'schedule', 'delegate', 'delete'];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">My Todo List</h2>
      
      {quadrants.map(q => (
        <div key={q || 'inbox'} className="mb-6">
          <h3 className="font-semibold text-lg capitalize mb-2">{q}</h3>
          <ul className="space-y-2">
            {tasks.filter(t => t.quadrant === q).map(task => {
              const taskId = (task as any)._id || task.id;
              return (
                <li key={taskId} className="p-3 border rounded shadow-sm bg-white">
                  {task.title}
                </li>
              );
            })}
            {tasks.filter(t => t.quadrant === q).length === 0 && (
              <li key="no-tasks" className="p-3 border rounded shadow-sm text-sm text-gray-400 italic">No tasks in {q}</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
