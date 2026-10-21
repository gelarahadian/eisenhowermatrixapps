import mongoose, { Schema, Document } from 'mongoose';

export interface IWeeklyHistoryEntry {
  weekStart: string;
  completedDays: number[];
  completedAt: Date;
}

export interface IWeeklyTask extends Document {
  name: string;
  daysOfWeek: number[];
  weekStart: string;
  doneDays: number[];
  userId: mongoose.Types.ObjectId;
  history: IWeeklyHistoryEntry[];
}

const WeeklyTaskSchema = new Schema<IWeeklyTask>({
  name: { type: String, required: true },
  daysOfWeek: {
    type: [Number],
    required: true,
    validate: {
      validator: (days: number[]) => days.length > 0 && days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
      message: 'daysOfWeek must be a non-empty array of integers 0-6',
    },
  },
  weekStart: { type: String, required: true },
  doneDays: { type: [Number], default: [] },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  history: [{
    weekStart: { type: String, required: true },
    completedDays: { type: [Number], required: true },
    completedAt: { type: Date, required: true }
  }]
}, { timestamps: true });

WeeklyTaskSchema.index({ userId: 1, weekStart: 1, name: 1 }, { unique: true });

export default mongoose.models.WeeklyTask || mongoose.model<IWeeklyTask>('WeeklyTask', WeeklyTaskSchema);
