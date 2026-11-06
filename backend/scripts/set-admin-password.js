const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    throw new Error('Usage: npm run set-admin-password -- email@example.com your-new-password');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    { password: hashedPassword, role: 'admin' },
    { new: true }
  );

  if (!user) {
    throw new Error(`No application user found with email ${email}`);
  }

  console.log(`Admin password updated for ${email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
