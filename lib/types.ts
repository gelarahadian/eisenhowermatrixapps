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
