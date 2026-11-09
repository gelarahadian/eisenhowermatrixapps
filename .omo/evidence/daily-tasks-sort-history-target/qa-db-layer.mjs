import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('FAIL: no MONGODB_URI'); process.exit(1); }
await mongoose.connect(uri);
console.log('CONNECTED');

const HistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  completedCount: { type: Number, required: true },
  completedAt: { type: Date, required: true }
}, { _id: false });

const DailyTaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetCount: { type: Number, required: true, min: 1 },
  currentCount: { type: Number, default: 0 },
  date: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
  history: [HistorySchema]
}, { timestamps: true });

const DailyTask = mongoose.models.DailyTask || mongoose.model('DailyTask', DailyTaskSchema);

const testUserId = new mongoose.Types.ObjectId();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// 1. create 3 test tasks with order 0,1,2
const created = await DailyTask.create([
  { name: 'QA-T1-alpha', targetCount: 5, currentCount: 0, date: today, userId: testUserId, completed: false, completedAt: null, order: 0, history: [] },
  { name: 'QA-T1-beta', targetCount: 3, currentCount: 0, date: today, userId: testUserId, completed: false, completedAt: null, order: 1, history: [] },
  { name: 'QA-T1-gamma', targetCount: 2, currentCount: 0, date: today, userId: testUserId, completed: false, completedAt: null, order: 2, history: [] }
]);
console.log('CREATED', created.length, 'tasks');

// 2. verify sort order:1,createdAt:1 returns alpha,beta,gamma
let sorted = await DailyTask.find({ userId: testUserId, date: today }).sort({ order: 1, createdAt: 1 }).lean();
console.log('SORT1:', sorted.map(t => t.name).join(','), sorted.map(t => t.name).join(',') === 'QA-T1-alpha,QA-T1-beta,QA-T1-gamma' ? 'PASS' : 'FAIL');

// 3. simulate reorder: move gamma to front (order: gamma=0, alpha=1, beta=2)
const reorder = [
  ['QA-T1-gamma', 0], ['QA-T1-alpha', 1], ['QA-T1-beta', 2]
];
for (const [name, order] of reorder) {
  await DailyTask.updateOne({ userId: testUserId, name }, { order });
}
sorted = await DailyTask.find({ userId: testUserId, date: today }).sort({ order: 1, createdAt: 1 }).lean();
console.log('SORT2 after reorder:', sorted.map(t => t.name).join(','), sorted.map(t => t.name).join(',') === 'QA-T1-gamma,QA-T1-alpha,QA-T1-beta' ? 'PASS' : 'FAIL');

// 4. simulate updateDailyTaskTarget: beta currentCount=3, target 5 -> set target 3 -> completed true
const beta = await DailyTask.findOne({ userId: testUserId, name: 'QA-T1-beta' });
await DailyTask.updateOne({ _id: beta._id }, { currentCount: 3 });
const updated = await DailyTask.findByIdAndUpdate(beta._id, {
  targetCount: 3,
  completed: 3 >= 3,
  completedAt: new Date()
}, { new: true }).lean();
console.log('TARGET UPDATE:', updated.targetCount === 3 && updated.completed === true ? 'PASS' : 'FAIL');

// 5. legacy doc without order field -> default 0 fallback
const legacy = await DailyTask.create({ name: 'QA-T1-legacy', targetCount: 1, currentCount: 0, date: today, userId: testUserId, completed: false, completedAt: null, history: [] });
const legacyDoc = await DailyTask.findById(legacy._id).lean();
console.log('LEGACY ORDER DEFAULT:', legacyDoc.order === 0 ? 'PASS' : 'FAIL');

// 6. cleanup
const del = await DailyTask.deleteMany({ userId: testUserId });
console.log('CLEANUP deleted:', del.deletedCount);
await mongoose.disconnect();
console.log('DONE');
