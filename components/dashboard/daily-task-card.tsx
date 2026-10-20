"use client";
import React, { useState } from 'react';
import { DailyTask } from '@/lib/types';

interface Props {
  task: DailyTask;
  onIncrement?: (taskId: string) => void;
  onDecrement?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export function DailyTaskCard({ task, onIncrement, onDecrement, onDelete }: Props) {
  const taskId = task.id || (task as any)._id;
  const progress = Math.min((task.currentCount / task.targetCount) * 100, 100);
  const [showHistory, setShowHistory] = useState(false);
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
          <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.completed && (
              <span className="text-green-600 mr-1">✓</span>
            )}
            {task.name}
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 ml-2"
        >
          Delete
        </button>
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
          disabled={task.completed || task.currentCount === 0}
          className={`w-1/2 py-2 rounded font-medium ${
            task.completed || task.currentCount === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          − Kurangi
        </button>
        <button
          onClick={handleIncrement}
          disabled={task.completed}
          className={`w-1/2 py-2 rounded font-medium ${
            task.completed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {task.completed ? '✓ Completed' : '+ Count One'}
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
