export type Quadrant = "do" | "schedule" | "delegate" | "delete";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | Date | null;
  category?: string;
  assignee?: string;
  quadrant: Quadrant | null;
  completed: boolean;
  completedAt?: string | Date | null;
  createdAt: Date;
}

export interface DailyHistoryEntry {
  date: string;
  completedCount: number;
  completedAt: string;
}

export interface DailyTask {
  id: string;
  name: string;
  targetCount: number;
  currentCount: number;
  date: string;
  userId: string;
  completed: boolean;
  completedAt?: string | null;
  history: DailyHistoryEntry[];
}
