"use server";

import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { revalidatePath } from "next/cache";

export async function getTasks(userId: string) {
  try {
    await dbConnect();
    console.log("Fetching tasks for user:", userId);
    const tasks = await Task.find({ userId }).sort({ order: 1, createdAt: -1 }).lean();
    console.log("Tasks found:", tasks.length);
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export async function createTask(data: { title: string; description?: string; dueDate?: string | null; userId: string }) {
  await dbConnect();
  const task = await Task.create({
    title: data.title,
    description: data.description,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    quadrant: null,
    completed: false,
    userId: data.userId
  });
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}

export async function updateTask(id: string, data: Partial<{ title: string; description: string; dueDate: string | null; quadrant: string; order: number; completed: boolean }>) {
  await dbConnect();
  const { dueDate, ...rest } = data;
  const task = await Task.findByIdAndUpdate(
    id,
    {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
    },
    { new: true }
  );
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}

export async function completeTask(id: string) {
  await dbConnect();
  const task = await Task.findByIdAndUpdate(
    id,
    { completed: true, completedAt: new Date() },
    { new: true }
  );
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}

export async function bulkUpdateTasksOrder(tasks: { id: string; order: number }[]) {
  await dbConnect();
  await Promise.all(
    tasks.map(task =>
      Task.findByIdAndUpdate(task.id, { order: task.order })
    )
  );
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  await dbConnect();
  await Task.findByIdAndDelete(id);
  revalidatePath("/");
}
