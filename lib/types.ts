export type Quadrant = "do" | "schedule" | "delegate" | "delete";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  category?: string;
  assignee?: string;
  quadrant: Quadrant | null;
  completed: boolean;
  createdAt: Date;
}
