import mongoose, { Schema, Document } from 'mongoose';

export interface IHistoryEntry {
  date: string;
  completedCount: number;
  completedAt: Date;
}

export interface IDailyTask extends Document {
  name: string;
  targetCount: number;
  currentCount: number;
  date: string;
  userId: mongoose.Types.ObjectId;
  completed: boolean;
  completedAt?: Date | null;
  history: IHistoryEntry[];
}

const DailyTaskSchema = new Schema<IDailyTask>({
  name: { type: String, required: true },
  targetCount: { type: Number, required: true, min: 1 },
  currentCount: { type: Number, default: 0 },
  date: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  history: [{
    date: { type: String, required: true },
    completedCount: { type: Number, required: true },
    completedAt: { type: Date, required: true }
  }]
}, { timestamps: true });

DailyTaskSchema.index({ userId: 1, date: 1, name: 1 }, { unique: true });

export default mongoose.models.DailyTask || mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);
