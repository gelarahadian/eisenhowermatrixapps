import React from 'react';
import { Task } from '@/lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteTask } from '@/app/actions/task-actions';

interface Props {
  task: Task;
  onDelete?: () => void;
}

export function TaskCard({ task, onDelete }: Props) {
  // Pastikan ID yang digunakan sama dengan yang digunakan di key dan SortableContext
  const id = (task as any)._id || task.id;

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white border rounded-lg shadow-sm cursor-grab touch-none select-none flex justify-between items-start"
    >
      <div {...attributes} {...listeners} className="flex-grow">
        <h3 className="font-semibold">{task.title}</h3>
        <p className="text-sm text-gray-500">{task.description}</p>
      </div>
      <button
        onClick={handleDelete}
        className="ml-2 text-red-500 hover:text-red-700"
      >
        Delete
      </button>
    </div>
  );
}
