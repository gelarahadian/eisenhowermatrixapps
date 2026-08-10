"use server";

import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { revalidatePath } from "next/cache";

export async function getTasks(userId: string) {
  try {
    await dbConnect();
    console.log("Fetching tasks for user:", userId);
    const tasks = await Task.find({ userId }).lean();
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

export async function updateTask(id: string, data: Partial<{ title: string; description: string; quadrant: string; completed: boolean }>) {
  await dbConnect();
  const task = await Task.findByIdAndUpdate(id, data, { new: true });
  revalidatePath("/");
  return JSON.parse(JSON.stringify(task));
}

export async function deleteTask(id: string) {
  await dbConnect();
  await Task.findByIdAndDelete(id);
  revalidatePath("/");
}
