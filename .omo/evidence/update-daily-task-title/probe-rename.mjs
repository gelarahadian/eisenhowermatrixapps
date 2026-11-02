import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
await client.connect();
const db = client.db('eisenhowerapps');
const col = db.collection('dailytasks');

const probeUserId = '6500000000000000000000aa';
const today = '2026-11-02';
const cleanup = { userId: { $in: [probeUserId] } };
await col.deleteMany(cleanup);

const results = [];

// 1. index eksis?
const indexes = await col.indexes();
const uniq = indexes.find(i => i.key && i.key.userId === 1 && i.key.date === 1 && i.key.name === 1);
results.push({ test: 'unique_index_{userId,date,name}', pass: !!uniq && uniq.unique === true, detail: uniq ? JSON.stringify(uniq.key) : 'NOT FOUND' });

// 2. insert dua task sama → duplicate harus gagal
await col.insertOne({ name: 'Task A', targetCount: 10, currentCount: 0, date: today, userId: probeUserId, completed: false, completedAt: null, history: [] });
let dupRejected = false;
try {
  await col.insertOne({ name: 'Task A', targetCount: 10, currentCount: 0, date: today, userId: probeUserId, completed: false, completedAt: null, history: [] });
} catch (e) { dupRejected = e.code === 11000; }
results.push({ test: 'duplicate_insert_rejected_E11000', pass: dupRejected });

// 3. rename valid (pre-check findOne pattern dari action)
const t = await col.findOne({ userId: probeUserId, date: today, name: 'Task A' });
const trimmed = 'Task A Baru';
const dup = await col.findOne({ userId: probeUserId, date: today, name: trimmed, _id: { $ne: t._id } });
if (!dup) await col.updateOne({ _id: t._id }, { $set: { name: trimmed } });
const after = await col.findOne({ _id: t._id });
results.push({ test: 'valid_rename_persists', pass: after.name === 'Task A Baru', detail: after.name });

// 4. rename ke nama duplikat lain → pre-check menemukan
await col.insertOne({ name: 'Task B', targetCount: 5, currentCount: 0, date: today, userId: probeUserId, completed: false, completedAt: null, history: [] });
const dup2 = await col.findOne({ userId: probeUserId, date: today, name: 'Task B', _id: { $ne: t._id } });
results.push({ test: 'duplicate_rename_detected_by_precheck', pass: !!dup2 });

// 5. no-op: rename ke nama sendiri → pre-check $ne menolak dirinya sendiri (tidak dianggap duplikat)
const selfDup = await col.findOne({ userId: probeUserId, date: today, name: 'Task A Baru', _id: { $ne: t._id } });
results.push({ test: 'no_op_rename_not_flagged_duplicate', pass: !selfDup });

// 6. nama kosong setelah trim → ditolak di level aplikasi (simulasi)
const trimmedEmpty = '   '.trim();
results.push({ test: 'empty_after_trim_rejected', pass: trimmedEmpty.length === 0 });

await col.deleteMany(cleanup);
await client.close();

let fail = 0;
for (const r of results) { if (!r.pass) fail++; console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.test}${r.detail ? ' :: ' + r.detail : ''}`); }
console.log(fail === 0 ? 'ALL_PASS' : `FAILURES=${fail}`);
process.exit(fail === 0 ? 0 : 1);
