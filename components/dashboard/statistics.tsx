"use client";
import React from 'react';
import { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
}

export function Statistics({ tasks }: Props) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const doCount = tasks.filter(t => t.quadrant === 'do').length;
  const scheduleCount = tasks.filter(t => t.quadrant === 'schedule').length;
  const delegateCount = tasks.filter(t => t.quadrant === 'delegate').length;
  const deleteCount = tasks.filter(t => t.quadrant === 'delete').length;

  return (
    <div className="mt-8 p-6 bg-white border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Statistics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-600">Total Tasks</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="p-4 bg-green-50 rounded">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl font-bold">{completed}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm">Do: {doCount} | Schedule: {scheduleCount}</p>
          <p className="text-sm">Delegate: {delegateCount} | Delete: {deleteCount}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Progress</p>
          <p className="text-2xl font-bold">{total > 0 ? Math.round((completed / total) * 100) : 0}%</p>
        </div>
      </div>
    </div>
  );
}
