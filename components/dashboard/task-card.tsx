import React, { useState } from 'react';
import { Task } from '@/lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { completeTask, deleteTask } from '@/app/actions/task-actions';

interface Props {
  task: Task;
  onDelete?: () => void;
  onComplete?: () => void;
  onDueDateChange?: (taskId: string, dueDate: string) => void;
}

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const toInputValue = (value?: string | Date | null) => {
  if (!value) return '';
  const dt = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

export function TaskCard({ task, onDelete, onComplete, onDueDateChange }: Props) {
  // Pastikan ID yang digunakan sama dengan yang digunakan di key dan SortableContext
  const id = (task as any)._id || task.id;
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [draftDueDate, setDraftDueDate] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTask(id);
    if (onDelete) onDelete();
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask(id);
    if (onComplete) onComplete();
  };

  const handleEditDeadline = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftDueDate(toInputValue(task.dueDate));
    setIsEditingDeadline(true);
  };

  const handleSaveDeadline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDueDateChange) await onDueDateChange(id, draftDueDate);
    setIsEditingDeadline(false);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingDeadline(false);
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white border rounded-lg shadow-sm cursor-grab touch-none select-none"
    >
      <div className="flex justify-between items-start">
        <div {...attributes} {...listeners} className="flex-grow">
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-sm text-gray-500">{task.description}</p>
          {task.dueDate && (
            <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              Deadline: {formatDateTime(task.dueDate)}
            </p>
          )}
        </div>
        <div className="ml-2 flex gap-2">
          {onDueDateChange && (
            <button
              onClick={handleEditDeadline}
              className="text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          )}
          {onComplete && (
            <button
              onClick={handleComplete}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Selesai
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
      {isEditingDeadline && (
        <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
          <label className="block text-xs text-gray-600 mb-1">Deadline</label>
          <input
            type="datetime-local"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            className="w-full p-1 border rounded text-sm mb-2"
          />
          <div className="flex justify-end gap-2">
            <button onClick={handleCancelEdit} className="px-2 py-1 border rounded text-sm">
              Cancel
            </button>
            <button
              onClick={handleSaveDeadline}
              className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
