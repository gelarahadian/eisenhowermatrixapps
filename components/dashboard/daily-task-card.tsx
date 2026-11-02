"use client";
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DailyTask } from '@/lib/types';

interface Props {
  task: DailyTask;
  isIncrementing?: boolean;
  isDecrementing?: boolean;
  isRenaming?: boolean;
  onIncrement?: (taskId: string) => void;
  onDecrement?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onRename?: (taskId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
}

export function DailyTaskCard({ task, isIncrementing, isDecrementing, isRenaming, onIncrement, onDecrement, onDelete, onRename }: Props) {
  const taskId = task.id || (task as any)._id;
  const progress = Math.min((task.currentCount / task.targetCount) * 100, 100);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const historyEntries = task.history || [];

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

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const formatHistoryDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${task.completed ? 'opacity-75' : ''}`}>
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
          <span className="font-medium">
            {task.currentCount} / {task.targetCount}
          </span>
        </div>
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

      {historyEntries.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <button
            onClick={handleToggleHistory}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-2 px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition"
          >
            {showHistory ? '▲' : '▼'} Lihat Riwayat ({historyEntries.length})
          </button>
          {showHistory && (
            <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
              {historyEntries.map((entry, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{formatHistoryDate(entry.date)}</span>
                  <span className="font-medium text-gray-900">
                    {entry.completedCount} selesai
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
