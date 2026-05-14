require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const uri = process.env.MONGODB_URI;
const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@zyvex.local';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
const adminName = process.env.SEED_ADMIN_NAME || 'Zyvex Admin';

async function run() {
  if (!uri) {
    console.error('Set MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log('Updated user to admin:', adminEmail);
    } else {
      console.log('Admin already exists:', adminEmail);
    }
    await mongoose.disconnect();
    return;
  }
  await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });
  console.log('Created admin:', adminEmail, '/', adminPassword);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
