"use server";

import dbConnect from "@/lib/mongodb";
import WeeklyTask from "@/models/WeeklyTask";
import { revalidatePath } from "next/cache";
import { getWibDayOfWeek, getWibWeekStart } from "@/lib/dates";

export async function getWeeklyTasks(userId: string) {
  try {
    await dbConnect();
    const currentWeekStart = getWibWeekStart();

    const staleTasks = await WeeklyTask.find({
      userId,
      weekStart: { $ne: currentWeekStart }
    });

    for (const task of staleTasks) {
      await WeeklyTask.findByIdAndUpdate(task._id, {
        $push: {
          history: {
            weekStart: task.weekStart,
            completedDays: task.doneDays,
            completedAt: new Date()
          }
        },
        doneDays: [],
        weekStart: currentWeekStart
      });
    }

    const tasks = await WeeklyTask.find({ userId, weekStart: currentWeekStart }).sort({ createdAt: 1 }).lean();
    return JSON.parse(JSON.stringify(tasks));
  } catch (error) {
    console.error("Error fetching weekly tasks:", error);
    return [];
  }
}

export async function createWeeklyTask(data: {
  name: string;
  daysOfWeek: number[];
  userId: string;
}) {
  try {
    await dbConnect();

    const daysOfWeek = [...new Set(data.daysOfWeek)].filter(
      (d) => Number.isInteger(d) && d >= 0 && d <= 6
    );
    if (!data.name.trim() || daysOfWeek.length === 0) {
      throw new Error("Name and at least one valid day (0-6) are required");
    }

    const task = await WeeklyTask.create({
      name: data.name.trim(),
      daysOfWeek,
      weekStart: getWibWeekStart(),
      doneDays: [],
      userId: data.userId,
      history: []
    });

    revalidatePath("/dashboard/weekly-tasks");
    return JSON.parse(JSON.stringify(task));
  } catch (error) {
    console.error("Error creating weekly task:", error);
    throw error;
  }
}

export async function toggleDayCompletion(id: string, day: number) {
  try {
    await dbConnect();

    const task = await WeeklyTask.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.weekStart !== getWibWeekStart()) {
      return { success: false, reason: "stale-week" as const };
    }
    if (!task.daysOfWeek.includes(day)) {
      return { success: false, reason: "not-scheduled" as const };
    }
    if (day > getWibDayOfWeek()) {
      return { success: false, reason: "future-day" as const };
    }

    const isDone = task.doneDays.includes(day);
    const updated = await WeeklyTask.findByIdAndUpdate(
      id,
      isDone ? { $pull: { doneDays: day } } : { $addToSet: { doneDays: day } },
      { new: true }
    );

    revalidatePath("/dashboard/weekly-tasks");
    return JSON.parse(JSON.stringify({ success: true, task: updated }));
  } catch (error) {
    console.error("Error toggling day completion:", error);
    throw error;
  }
}

export async function deleteWeeklyTask(id: string) {
  try {
    await dbConnect();
    await WeeklyTask.findByIdAndDelete(id);
    revalidatePath("/dashboard/weekly-tasks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting weekly task:", error);
    throw error;
  }
}
