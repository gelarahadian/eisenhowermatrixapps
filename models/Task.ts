import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate?: Date | null;
  quadrant: 'do' | 'schedule' | 'delegate' | 'delete' | null;
  order: number;
  completed: boolean;
  completedAt?: Date | null;
  userId: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, default: null },
  quadrant: { type: String, enum: ['do', 'schedule', 'delegate', 'delete', null], default: null },
  order: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
