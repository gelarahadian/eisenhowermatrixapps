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

export async function createTask(data: { title: string; description?: string; userId: string }) {
  await dbConnect();
  const task = await Task.create({ ...data, quadrant: null, completed: false });
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}

export async function updateTask(id: string, data: Partial<{ title: string; description: string; quadrant: string; order: number; completed: boolean }>) {
  await dbConnect();
  const task = await Task.findByIdAndUpdate(id, data, { new: true });
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
