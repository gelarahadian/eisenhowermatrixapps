import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;
console.log('DB_NAME:', db.databaseName);

const sessions = db.collection('sessions');
const real = await sessions.findOne({ sessionToken: { $ne: '78e9616b1197b1d26afd3c50823f9ee7eb8b62953e2c4297e348c538ed330230' } });
if (real) {
  console.log('REAL_SESSION:', JSON.stringify({
    sessionToken: real.sessionToken?.slice(0, 8) + '...',
    userIdType: real.userId?.constructor?.name,
    userId: real.userId?.toString(),
    expiresType: real.expires?.constructor?.name,
    expires: real.expires
  }));
  const u = await db.collection('users').findOne({ _id: real.userId });
  console.log('REAL_USER_OF_SESSION:', u ? u.email : 'NOT_FOUND');
} else {
  console.log('NO_REAL_SESSIONS');
}
const mine = await sessions.findOne({ sessionToken: '78e9616b1197b1d26afd3c50823f9ee7eb8b62953e2c4297e348c538ed330230' });
console.log('MY_SESSION:', mine ? JSON.stringify({ userIdType: mine.userId?.constructor?.name, expires: mine.expires }) : 'MISSING');
await mongoose.disconnect();
