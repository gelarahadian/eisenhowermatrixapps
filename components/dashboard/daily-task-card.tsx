"use client";
import React, { useState } from 'react';
import { Loader2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DailyTask } from '@/lib/types';
import { getWibTodayString, addDays } from '@/lib/dates';
import { DailyTaskHistoryModal } from './daily-task-history-modal';

interface Props {
  task: DailyTask;
  isIncrementing?: boolean;
  isDecrementing?: boolean;
  isRenaming?: boolean;
  isUpdatingTarget?: boolean;
  onIncrement?: (taskId: string) => void;
  onDecrement?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onRename?: (taskId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateTarget?: (taskId: string, newTarget: number) => Promise<{ success: boolean; error?: string }>;
}

/* Varian tombol kecil di dalam kartu (DESIGN.md §5.1, §6.4) */
const btnSoft =
  'inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-accent px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong';
const btnDangerSmall =
  'inline-flex h-8 items-center rounded-lg border border-danger bg-white px-2.5 text-sm font-semibold text-danger transition-colors duration-150 hover:bg-danger-soft';
const btnGhostIcon =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition-colors duration-150 hover:bg-accent-soft';
const btnPrimary =
  'inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-primary-hover active:bg-primary-press';
const btnSoftLarge =
  'inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong';
const disabledSoft =
  'inline-flex h-10 items-center justify-center rounded-lg bg-disabled-bg px-4 text-sm font-semibold text-disabled-text';

const inputClass =
  'rounded-lg border border-line bg-white p-1.5 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none';

export function DailyTaskCard({ task, isIncrementing, isDecrementing, isRenaming, isUpdatingTarget, onIncrement, onDecrement, onDelete, onRename, onUpdateTarget }: Props) {
  const taskId = task.id || (task as any)._id;
  const progress = Math.min((task.currentCount / task.targetCount) * 100, 100);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState<number>(1);
  const [targetError, setTargetError] = useState<string | null>(null);
  const historyEntries = task.history || [];
  const today = getWibTodayString();
  const last7Days = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));

  const countForDay = (dateStr: string): number | null => {
    if (dateStr === today) return task.currentCount;
    const entry = historyEntries.find(h => h.date === dateStr);
    return entry ? entry.completedCount : null;
  };

  const isDoneForDay = (dateStr: string): boolean => {
    const count = countForDay(dateStr);
    return count !== null && count >= task.targetCount;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: taskId });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const handleIncrement = () => {
    if (!task.completed && onIncrement) {
      onIncrement(taskId);
    }
  };

  const handleDecrement = () => {
    if (!task.completed && task.currentCount > 0 && onDecrement) {
      onDecrement(taskId);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(taskId);
    }
  };

  const handleStartEdit = () => {
    setDraftName(task.name);
    setEditError(null);
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setDraftName(task.name);
    setEditError(null);
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!onRename || isRenaming || draftName.trim().length === 0) return;
    const res = await onRename(taskId, draftName);
    if (res.success) {
      setEditError(null);
      setIsEditingName(false);
    } else {
      setEditError(res.error || 'Gagal menyimpan');
    }
  };

  const handleStartTargetEdit = () => {
    setDraftTarget(task.targetCount);
    setTargetError(null);
    setIsEditingTarget(true);
  };

  const handleCancelTargetEdit = () => {
    setDraftTarget(task.targetCount);
    setTargetError(null);
    setIsEditingTarget(false);
  };

  const handleSaveTarget = async () => {
    if (!onUpdateTarget || isUpdatingTarget || draftTarget < 1) return;
    const res = await onUpdateTarget(taskId, draftTarget);
    if (res.success) {
      setTargetError(null);
      setIsEditingTarget(false);
    } else {
      setTargetError(res.error || 'Gagal menyimpan');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`p-4 bg-white border border-line rounded-card shadow-card cursor-default transition-shadow hover:border-accent-strong hover:shadow-hover ${
        task.completed ? 'opacity-75' : ''
      } ${isDragging ? 'shadow-drag rotate-[1.5deg] opacity-95 cursor-grabbing border-accent-strong' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${task.name}`}
          className="-ml-1 mr-1 mt-0.5 touch-none select-none cursor-grab rounded p-1 text-ink-muted transition-colors duration-150 hover:text-ink active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>
        <div className="flex-grow">
          {isEditingName ? (
            <div>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className={`${inputClass} w-full text-lg font-semibold`}
                autoFocus
              />
              {editError && (
                <p className="mb-1 text-sm text-danger" role="alert">{editError}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isRenaming}
                  className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-accent-strong disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={isRenaming || draftName.trim().length === 0}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 ${
                    isRenaming || draftName.trim().length === 0
                      ? 'bg-disabled-bg text-disabled-text'
                      : 'bg-primary text-white hover:bg-primary-hover'
                  }`}
                >
                  {isRenaming && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {isRenaming ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <h3 className={`flex items-center gap-1 text-lg font-semibold text-ink ${task.completed ? 'line-through text-ink-muted' : ''}`}>
              {task.completed && (
                <span className="text-primary" aria-label="Selesai">✓</span>
              )}
              {task.name}
            </h3>
          )}
        </div>
        {!isEditingName && (
          <div className="flex gap-2 ml-2">
            {onRename && (
              <button
                onClick={handleStartEdit}
                aria-label={`Edit nama ${task.name}`}
                className={btnGhostIcon}
              >
                {/* Ikon pensil: relevan untuk aksi edit teks */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
            )}
            <button onClick={handleDelete} className={btnDangerSmall}>
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-ink-muted">Progress</span>
          {isEditingTarget ? (
            <div className="flex items-center gap-1">
              <label htmlFor={`target-${taskId}`} className="sr-only">Target per hari</label>
              <input
                id={`target-${taskId}`}
                type="number"
                min={1}
                value={draftTarget}
                onChange={(e) => setDraftTarget(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTarget();
                  if (e.key === 'Escape') handleCancelTargetEdit();
                }}
                className={`${inputClass} w-16`}
                autoFocus
              />
              <button
                onClick={handleSaveTarget}
                disabled={isUpdatingTarget || draftTarget < 1}
                aria-label="Simpan target"
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors duration-150 ${
                  isUpdatingTarget || draftTarget < 1
                    ? 'bg-disabled-bg text-disabled-text'
                    : 'bg-primary text-white hover:bg-primary-hover'
                }`}
              >
                {isUpdatingTarget ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : '✓'}
              </button>
              <button
                onClick={handleCancelTargetEdit}
                disabled={isUpdatingTarget}
                aria-label="Batal ubah target"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors duration-150 hover:bg-accent-soft disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1">
              <span className="font-medium text-ink">
                {task.currentCount} / {task.targetCount}
              </span>
              {onUpdateTarget && (
                <button
                  onClick={handleStartTargetEdit}
                  aria-label="Edit target"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-primary transition-colors duration-150 hover:bg-accent-soft"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              )}
            </span>
          )}
        </div>
        {isEditingTarget && targetError && (
          <p className="mb-1 text-xs text-danger" role="alert">{targetError}</p>
        )}
        {/* Track aksen, fill teal, transisi 300ms (DESIGN.md §5.5) */}
        <div className="h-2 w-full rounded-full bg-accent">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDecrement}
          disabled={task.completed || task.currentCount === 0 || isDecrementing}
          aria-label="Kurangi satu"
          className={task.completed || task.currentCount === 0 || isDecrementing ? disabledSoft : btnSoftLarge}
        >
          {isDecrementing ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading...
            </>
          ) : (
            '− Kurangi'
          )}
        </button>
        <button
          onClick={handleIncrement}
          disabled={task.completed || isIncrementing}
          aria-label="Tambah satu"
          className={task.completed || isIncrementing ? disabledSoft : btnPrimary}
        >
          {isIncrementing ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading...
            </>
          ) : task.completed ? (
            <>
              <span className="font-bold" aria-hidden="true">✓</span> Completed
            </>
          ) : (
            '+ Count One'
          )}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-line">
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          aria-label={`Lihat riwayat detail ${task.name}`}
          className="w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-ink-muted">7 hari terakhir</span>
            <span className="text-xs font-semibold text-primary hover:underline">Lihat detail ▸</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {last7Days.map((dateStr) => {
              const done = isDoneForDay(dateStr);
              const count = countForDay(dateStr);
              const partial = !done && count !== null && count > 0;
              const dayNum = Number(dateStr.split('-')[2]);
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}${count !== null ? ` — ${count} / ${task.targetCount}` : ''}`}
                  className={`flex aspect-square items-center justify-center rounded text-xs font-medium ${
                    done
                      ? 'bg-primary text-white'
                      : partial
                        ? 'bg-accent text-ink'
                        : 'bg-disabled-bg text-disabled-text'
                  } ${dateStr === today ? 'ring-2 ring-primary' : ''}`}
                >
                  {done ? '✓' : dayNum}
                </div>
              );
            })}
          </div>
        </button>
      </div>

      <DailyTaskHistoryModal
        task={task}
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}
