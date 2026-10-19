"use server";

import dbConnect from "@/lib/mongodb";
import DailyTask from "@/models/DailyTask";
import { revalidatePath } from "next/cache";

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function resetDailyCounts(userId: string) {
  try {
    await dbConnect();
    const today = getTodayString();

    const staleTasks = await DailyTask.find({
      userId,
      date: { $ne: today }
    });

    for (const task of staleTasks) {
      await DailyTask.findByIdAndUpdate(task._id, {
        $push: {
          history: {
            date: task.date,
            completedCount: task.currentCount,
            completedAt: new Date()
          }
        },
        currentCount: 0,
        date: today,
        completed: false,
        completedAt: null
      });
    }

    return { success: true, resetCount: staleTasks.length };
  } catch (error) {
    console.error("Error resetting daily counts:", error);
    return { success: false, resetCount: 0 };
  }
}

export async function getDailyTasks(userId: string) {
  try {
    await dbConnect();
    await resetDailyCounts(userId);

    const today = getTodayString();
    const tasks = await DailyTask.find({ userId, date: today }).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Error fetching daily tasks:", error);
    return [];
  }
}

export async function createDailyTask(data: {
  name: string;
  targetCount: number;
  userId: string;
}) {
  try {
    await dbConnect();
    const today = getTodayString();

    const task = await DailyTask.create({
      name: data.name,
      targetCount: data.targetCount,
      currentCount: 0,
      date: today,
      userId: data.userId,
      completed: false,
      completedAt: null,
      history: []
    });

    revalidatePath("/dashboard/daily-tasks");
    return JSON.parse(JSON.stringify(task));
  } catch (error) {
    console.error("Error creating daily task:", error);
    throw error;
  }
}

export async function incrementDailyTask(id: string) {
  try {
    await dbConnect();

    const task = await DailyTask.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.completed) {
      return JSON.parse(JSON.stringify(task));
    }

    const newCount = task.currentCount + 1;
    const isComplete = newCount >= task.targetCount;

    const updated = await DailyTask.findByIdAndUpdate(
      id,
      {
        currentCount: newCount,
        completed: isComplete,
        ...(isComplete && { completedAt: new Date() })
      },
      { new: true }
    );

    revalidatePath("/dashboard/daily-tasks");
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    console.error("Error incrementing daily task:", error);
    throw error;
  }
}

export async function decrementDailyTask(id: string) {
  try {
    await dbConnect();

    const task = await DailyTask.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.completed) {
      return JSON.parse(JSON.stringify(task));
    }

    const newCount = Math.max(task.currentCount - 1, 0);

    const updated = await DailyTask.findByIdAndUpdate(
      id,
      {
        currentCount: newCount,
        completed: false,
        completedAt: null
      },
      { new: true }
    );

    revalidatePath("/dashboard/daily-tasks");
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    console.error("Error decrementing daily task:", error);
    throw error;
  }
}

export async function deleteDailyTask(id: string) {
  try {
    await dbConnect();
    await DailyTask.findByIdAndDelete(id);
    revalidatePath("/dashboard/daily-tasks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting daily task:", error);
    throw error;
  }
}
