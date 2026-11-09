"use client";
import React, { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
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
    opacity: isDragging ? 0.5 : 1,
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
      {...attributes}
      {...listeners}
      className={`p-4 bg-white border rounded-lg shadow-sm ${task.completed ? 'opacity-75' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
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
                className="w-full p-1 border rounded text-lg font-semibold mb-1"
                autoFocus
              />
              {editError && (
                <p className="text-sm text-red-600 mb-1">{editError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={isRenaming}
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={isRenaming || draftName.trim().length === 0}
                  className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                    isRenaming || draftName.trim().length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isRenaming && <Loader2 size={14} className="animate-spin" />}
                  {isRenaming ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.completed && (
                <span className="text-green-600 mr-1">✓</span>
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
                className="text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          {isEditingTarget ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={draftTarget}
                onChange={(e) => setDraftTarget(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTarget();
                  if (e.key === 'Escape') handleCancelTargetEdit();
                }}
                className="w-16 p-1 border rounded text-sm"
                autoFocus
              />
              <button
                onClick={handleSaveTarget}
                disabled={isUpdatingTarget || draftTarget < 1}
                className={`p-1 rounded flex items-center ${
                  isUpdatingTarget || draftTarget < 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Simpan target"
              >
                {isUpdatingTarget ? <Loader2 size={12} className="animate-spin" /> : '✓'}
              </button>
              <button
                onClick={handleCancelTargetEdit}
                disabled={isUpdatingTarget}
                className="p-1 border rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                title="Batal"
              >
                ✕
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1">
              <span className="font-medium">
                {task.currentCount} / {task.targetCount}
              </span>
              {onUpdateTarget && (
                <button
                  onClick={handleStartTargetEdit}
                  className="text-blue-600 hover:text-blue-700"
                  title="Edit target"
                >
                  <Pencil size={12} />
                </button>
              )}
            </span>
          )}
        </div>
        {isEditingTarget && targetError && (
          <p className="text-xs text-red-600 mb-1">{targetError}</p>
        )}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${task.completed ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDecrement}
          disabled={task.completed || task.currentCount === 0 || isDecrementing}
          className={`w-1/2 py-2 rounded font-medium flex items-center justify-center gap-2 ${
            task.completed || task.currentCount === 0 || isDecrementing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isDecrementing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </>
          ) : (
            '− Kurangi'
          )}
        </button>
        <button
          onClick={handleIncrement}
          disabled={task.completed || isIncrementing}
          className={`w-1/2 py-2 rounded font-medium flex items-center justify-center gap-2 ${
            task.completed || isIncrementing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isIncrementing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Loading...
            </>
          ) : task.completed ? (
            '✓ Completed'
          ) : (
            '+ Count One'
          )}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowHistoryModal(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setShowHistoryModal(true);
          }}
          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">7 hari terakhir</span>
            <span className="text-xs text-blue-600 hover:text-blue-700">Lihat detail ▸</span>
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
                  className={`flex items-center justify-center aspect-square rounded text-xs font-medium ${
                    done
                      ? 'bg-green-500 text-white'
                      : partial
                        ? 'bg-blue-200 text-blue-900'
                        : 'bg-gray-100 text-gray-400'
                  } ${dateStr === today ? 'ring-2 ring-blue-400' : ''}`}
                >
                  {done ? '✓' : dayNum}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DailyTaskHistoryModal
        task={task}
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}
