import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('FAIL: no MONGODB_URI'); process.exit(1); }
await mongoose.connect(uri);
const db = mongoose.connection.db;

const qaEmail = 'qa-bot@eisenhower-qa.local';
const qaUser = await db.collection('users').findOne({ email: qaEmail });
if (!qaUser) {
  console.log('QA_USER_NOT_FOUND (already clean)');
} else {
  const tasks = await db.collection('dailytasks').deleteMany({ userId: qaUser._id });
  const sessions = await db.collection('sessions').deleteMany({ userId: qaUser._id });
  const accounts = await db.collection('accounts').deleteMany({ userId: qaUser._id });
  const user = await db.collection('users').deleteOne({ _id: qaUser._id });
  console.log(`CLEANUP: tasks=${tasks.deletedCount} sessions=${sessions.deletedCount} accounts=${accounts.deletedCount} users=${user.deletedCount}`);
}

await mongoose.disconnect();
console.log('DONE');
