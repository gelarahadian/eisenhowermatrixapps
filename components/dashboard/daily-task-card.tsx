"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, GripVertical, MoreVertical } from 'lucide-react';
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

/* Tombol aksi kartu: full-width, kompak di mobile (h-9), desktop h-10 (DESIGN.md §6.4) */
const btnFullCompact =
  'inline-flex h-9 flex-1 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors duration-150 sm:h-10 sm:px-4';

const inputClass =
  'rounded-lg border border-line bg-white p-1.5 text-sm text-ink transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_var(--color-accent)] focus:outline-none';

export function DailyTaskCard({ task, isIncrementing, isDecrementing, isRenaming, isUpdatingTarget, onIncrement, onDecrement, onDelete, onRename, onUpdateTarget }: Props) {
  const taskId = task.id || (task as any)._id;
  const progress = Math.min((task.currentCount / task.targetCount) * 100, 100);
  /* Target 1: tanpa progress bar, satu tombol toggle "Selesai" (DESIGN.md §6.4) */
  const isSingle = task.targetCount === 1;
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [draftTarget, setDraftTarget] = useState<number>(1);
  const [targetError, setTargetError] = useState<string | null>(null);
  /* Menu titik-3 (Edit/Delete): pola sama dengan TaskCard — tutup klik luar & Escape */
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
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
    /* Tanpa zIndex statis: menu dropdown z-20 tidak boleh terjebak stacking context
       yang tertutup kartu tetangga (perbaikan sama seperti TaskCard) */
    zIndex: isDragging ? 10 : undefined,
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

  /* Mode target 1: toggle selesai ↔ batal (klik lagi mengurangi count) */
  const handleToggleDone = () => {
    if (isIncrementing || isDecrementing) return;
    if (task.completed) {
      onDecrement?.(taskId);
    } else {
      onIncrement?.(taskId);
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

  /* Tutup menu saat klik di luar atau Escape (pola TaskCard) */
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

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`p-3 sm:p-4 bg-white border border-line rounded-card shadow-card cursor-default transition-shadow hover:border-accent-strong hover:shadow-hover ${
        task.completed ? 'opacity-75' : ''
      } ${isDragging ? 'shadow-drag rotate-[1.5deg] opacity-95 cursor-grabbing border-accent-strong' : ''}`}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-3">
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
                className={`${inputClass} w-full text-base font-semibold sm:text-lg`}
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
            <h3 className={`flex items-center gap-1 text-base font-semibold text-ink sm:text-lg ${task.completed ? 'line-through text-ink-muted' : ''}`}>
              {task.completed && (
                <span className="text-primary" aria-label="Selesai">✓</span>
              )}
              {task.name}
            </h3>
          )}
        </div>
        {!isEditingName && (
          <div ref={menuRef} className="relative ml-2 shrink-0">
            <button
              ref={triggerRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(v => !v);
              }}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Menu aksi task"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-accent-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <MoreVertical size={18} aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label="Aksi task"
                className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-line bg-white py-1 shadow-hover"
              >
                {onRename && (
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      triggerRef.current?.focus();
                      handleStartEdit();
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-accent-soft"
                  >
                    Edit
                  </button>
                )}
                {onUpdateTarget && (
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      triggerRef.current?.focus();
                      handleStartTargetEdit();
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-accent-soft"
                  >
                    Edit target
                  </button>
                )}
                {onDelete && (
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      triggerRef.current?.focus();
                      handleDelete();
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-danger transition-colors duration-150 hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {(!isSingle || isEditingTarget) && (
      <div className="mb-2.5 sm:mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-ink-muted sr-only sm:not-sr-only">Progress</span>
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
        {/* Target 1: hanya form edit target yang tampil, tanpa progress bar */}
        {!isSingle && (
        <div className="h-1.5 sm:h-2 w-full rounded-full bg-accent">
          <div
            className="h-1.5 sm:h-2 rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        )}
      </div>
      )}

      {!isSingle ? (
      <div className="flex gap-2">
        <button
          onClick={handleDecrement}
          disabled={task.completed || task.currentCount === 0 || isDecrementing}
          aria-label="Kurangi satu"
          className={`${btnFullCompact} ${
            task.completed || task.currentCount === 0 || isDecrementing
              ? 'cursor-not-allowed bg-disabled-bg text-disabled-text'
              : 'bg-accent text-ink hover:bg-accent-strong'
          }`}
        >
          {isDecrementing ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <>
              <span className="sm:hidden" aria-hidden="true">−</span>
              <span className="hidden sm:inline">− Kurangi</span>
            </>
          )}
        </button>
        <button
          onClick={handleIncrement}
          disabled={task.completed || isIncrementing}
          aria-label="Tambah satu"
          className={`${btnFullCompact} ${
            task.completed || isIncrementing
              ? 'cursor-not-allowed bg-disabled-bg text-disabled-text'
              : 'bg-primary text-white hover:bg-primary-hover active:bg-primary-press'
          }`}
        >
          {isIncrementing ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : task.completed ? (
            <>
              <span className="font-bold" aria-hidden="true">✓</span>
              <span className="hidden sm:inline">Completed</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">+1</span>
              <span className="hidden sm:inline">+ Count One</span>
            </>
          )}
        </button>
      </div>
      ) : (
      /* Target 1: satu tombol toggle "Selesai" / "✓ Selesai" full-width (DESIGN.md §6.4) */
      <div className="flex">
        <button
          onClick={handleToggleDone}
          disabled={isIncrementing || isDecrementing}
          aria-label={task.completed ? 'Batalkan selesai' : 'Tandai selesai'}
          title={task.completed ? 'Klik untuk batalkan selesai' : 'Klik untuk tandai selesai'}
          className={`${btnFullCompact} ${
            task.completed
              ? 'bg-accent text-ink hover:bg-accent-strong'
              : 'bg-primary text-white hover:bg-primary-hover active:bg-primary-press'
          }`}
        >
          {(isIncrementing || isDecrementing) ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : task.completed ? (
            <>
              <span className="mr-1.5 font-bold" aria-hidden="true">✓</span>
              Selesai
            </>
          ) : (
            'Selesai'
          )}
        </button>
      </div>
      )}

      <div className="mt-2 border-t border-line pt-2 sm:mt-3 sm:pt-3">
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          aria-label={`Lihat riwayat detail ${task.name}`}
          className="w-full rounded-lg text-left focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="mb-1.5 flex items-center justify-between sm:mb-2">
            <span className="text-xs text-ink-muted sr-only sm:not-sr-only">7 hari terakhir</span>
            <span className="ml-auto text-xs font-semibold text-primary hover:underline">Lihat detail ▸</span>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {last7Days.map((dateStr) => {
              const done = isDoneForDay(dateStr);
              const count = countForDay(dateStr);
              const partial = !done && count !== null && count > 0;
              const dayNum = Number(dateStr.split('-')[2]);
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}${count !== null ? `, ${count} / ${task.targetCount}` : ''}`}
                  className={`flex aspect-square h-7 items-center justify-center rounded text-[10px] font-medium sm:h-auto sm:text-xs ${
                    done
                      ? 'bg-primary text-white'
                      : partial
                        ? 'bg-accent text-ink'
                        : 'bg-disabled-bg text-ink'
                  } ${dateStr === today ? 'ring-1 ring-primary sm:ring-2' : ''}`}
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
