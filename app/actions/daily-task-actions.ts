"use server";

import dbConnect from "@/lib/mongodb";
import DailyTask from "@/models/DailyTask";
import { revalidatePath } from "next/cache";
import { getWibTodayString } from "@/lib/dates";

function getTodayString(): string {
  return getWibTodayString();
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
    const tasks = await DailyTask.find({ userId, date: today }).sort({ order: 1, createdAt: 1 }).lean();
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

    const lastTask = await DailyTask.findOne({ userId: data.userId }).sort({ order: -1 });
    const nextOrder = lastTask && typeof lastTask.order === 'number' ? lastTask.order + 1 : 0;

    const task = await DailyTask.create({
      name: data.name,
      targetCount: data.targetCount,
      currentCount: 0,
      date: today,
      userId: data.userId,
      completed: false,
      completedAt: null,
      order: nextOrder,
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

export async function reorderDailyTasks(
  userId: string,
  orderedIds: string[]
): Promise<{ success: boolean }> {
  try {
    await dbConnect();

    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const owned = await DailyTask.findOne({ _id: id, userId });
      if (!owned) {
        return { success: false };
      }
      await DailyTask.findByIdAndUpdate(id, { order: index });
    }

    revalidatePath("/dashboard/daily-tasks");
    return { success: true };
  } catch (error) {
    console.error("Error reordering daily tasks:", error);
    return { success: false };
  }
}

export async function updateDailyTaskTarget(
  id: string,
  targetCount: number
): Promise<
  | { success: true; task: ReturnType<typeof JSON.parse> }
  | { success: false; error: string }
> {
  try {
    await dbConnect();

    if (!Number.isInteger(targetCount) || targetCount < 1) {
      return { success: false, error: "Target harus bilangan bulat minimal 1" };
    }

    const task = await DailyTask.findById(id);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const isComplete = task.currentCount >= targetCount;

    const updated = await DailyTask.findByIdAndUpdate(
      id,
      {
        targetCount,
        completed: isComplete,
        completedAt: isComplete ? (task.completedAt ?? new Date()) : null
      },
      { new: true }
    );

    revalidatePath("/dashboard/daily-tasks");
    return { success: true, task: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Error updating daily task target:", error);
    return { success: false, error: "Gagal menyimpan" };
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

export async function updateDailyTask(
  id: string,
  name: string
): Promise<
  | { success: true; task: ReturnType<typeof JSON.parse> }
  | { success: false; error: string }
> {
  try {
    await dbConnect();

    const task = await DailyTask.findById(id);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return { success: false, error: "Nama tidak boleh kosong" };
    }

    // Rename ke nama yang identik: no-op, dianggap sukses tanpa update DB.
    if (trimmed === task.name) {
      return { success: true, task: JSON.parse(JSON.stringify(task)) };
    }

    const duplicate = await DailyTask.findOne({
      userId: task.userId,
      date: task.date,
      name: trimmed,
      _id: { $ne: id }
    });
    if (duplicate) {
      return {
        success: false,
        error: "Nama sudah dipakai task lain hari ini"
      };
    }

    try {
      const updated = await DailyTask.findByIdAndUpdate(
        id,
        { name: trimmed },
        { new: true }
      );
      revalidatePath("/dashboard/daily-tasks");
      return { success: true, task: JSON.parse(JSON.stringify(updated)) };
    } catch (updateError: unknown) {
      // Race condition: duplikat lolos cek di atas karena write bersamaan (E11000).
      if (
        updateError &&
        typeof updateError === "object" &&
        (updateError as { code?: number }).code === 11000
      ) {
        return {
          success: false,
          error: "Nama sudah dipakai task lain hari ini"
        };
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating daily task:", error);
    return { success: false, error: "Gagal menyimpan" };
  }
}
