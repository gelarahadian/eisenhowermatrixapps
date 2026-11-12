import React, { useEffect, useRef, useState } from 'react';
import { Task } from '@/lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, MoreVertical } from 'lucide-react';
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

/* Varian tombol kecil di dalam kartu (32px) sesuai DESIGN.md §5.1/§5.3 */
const btnPrimaryTiny =
  'inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover';
const btnSoftTiny =
  'inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong';

export function TaskCard({ task, onDelete, onComplete, onDueDateChange }: Props) {
  // Pastikan ID yang digunakan sama dengan yang digunakan di key dan SortableContext
  const id = (task as any)._id || task.id;
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [draftDueDate, setDraftDueDate] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

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
      className={`p-4 bg-white border rounded-card cursor-grab touch-none select-none ${
        isDragging
          ? 'border-accent-strong shadow-drag rotate-[1.5deg] opacity-95 cursor-grabbing'
          : 'border-line shadow-card hover:border-accent-strong hover:shadow-hover'
      }`}
    >
      <div className="flex justify-between items-start">
        <div {...attributes} {...listeners} className="flex-grow">
          <h3 className="font-semibold text-ink">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-ink-muted">{task.description}</p>
          )}
          {task.dueDate && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-danger' : 'text-ink-muted'}`}>
              {isOverdue && <AlertTriangle size={12} aria-hidden="true" />}
              <span>Deadline: {formatDateTime(task.dueDate)}</span>
            </p>
          )}
        </div>
        <div ref={menuRef} className="relative ml-2">
          <button
            ref={triggerRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(v => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Menu aksi tugas"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-accent-soft hover:text-primary"
          >
            <MoreVertical size={18} aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label="Aksi tugas"
              className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-line bg-white py-1 shadow-hover"
            >
              {onDueDateChange && (
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    triggerRef.current?.focus();
                    handleEditDeadline(e);
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-accent-soft"
                >
                  Edit
                </button>
              )}
              {onComplete && (
                <button
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    triggerRef.current?.focus();
                    handleComplete(e);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-accent-soft"
                >
                  <span aria-hidden="true">✓</span> Selesai
                </button>
              )}
              <button
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  triggerRef.current?.focus();
                  handleDelete(e);
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-danger transition-colors duration-150 hover:bg-danger-soft"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {isEditingDeadline && (
        <div className="mt-3 pt-3 border-t border-line" onClick={(e) => e.stopPropagation()}>
          <label htmlFor={`deadline-${id}`} className="mb-1 block text-xs font-medium text-ink">
            Deadline
          </label>
          <input
            id={`deadline-${id}`}
            type="datetime-local"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-white p-2 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={handleCancelEdit} className={btnSoftTiny}>
              Cancel
            </button>
            <button onClick={handleSaveDeadline} className={btnPrimaryTiny}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
