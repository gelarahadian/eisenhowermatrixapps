import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('FAIL: no MONGODB_URI'); process.exit(1); }
await mongoose.connect(uri);
console.log('CONNECTED');

const db = mongoose.connection.db;
const users = db.collection('users');
const sessions = db.collection('sessions');

// Inspect existing schema shape first
const sampleUser = await users.findOne({});
console.log('USER_KEYS:', sampleUser ? Object.keys(sampleUser).join(',') : 'EMPTY');
const sampleSession = await sessions.findOne({});
console.log('SESSION_KEYS:', sampleSession ? Object.keys(sampleSession).join(',') : 'EMPTY');

// Create dedicated QA user (isolated from real users)
const qaEmail = 'qa-bot@eisenhower-qa.local';
const existing = await users.findOne({ email: qaEmail });
if (existing) {
  console.log('QA_USER_EXISTS:', existing._id.toString());
} else {
  const now = new Date();
  const res = await users.insertOne({
    name: 'QA Bot',
    email: qaEmail,
    emailVerified: null,
    image: null,
    createdAt: now,
    updatedAt: now
  });
  console.log('QA_USER_CREATED:', res.insertedId.toString());
}

const qaUser = await users.findOne({ email: qaEmail });
const userId = qaUser._id;

// Create a database session valid for 1 day
const crypto = await import('crypto');
const sessionToken = crypto.randomBytes(32).toString('hex');
const expires = new Date(Date.now() + 24 * 3600 * 1000);
const now = new Date();
await sessions.deleteMany({ userId });
await sessions.insertOne({ sessionToken, userId, expires, createdAt: now, updatedAt: now });
console.log('SESSION_TOKEN:', sessionToken);
console.log('USER_ID:', userId.toString());

await mongoose.disconnect();
console.log('DONE');
