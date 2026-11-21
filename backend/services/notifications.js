const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendPortalEmail } = require('./mailNotifications');

async function notifyUser(userId, complaintId, type, message) {
  await Notification.create({ user: userId, complaint: complaintId, type, message });
  const user = await User.findById(userId).select('email').lean();
  return sendPortalEmail(user?.email, 'citizen');
}

async function notifyAdmins(complaintId, type, message) {
  const admins = await User.find({ role: 'admin' }).select('_id email').lean();
  if (!admins.length) return 'no-recipients';

  await Notification.insertMany(admins.map((admin) => ({
    user: admin._id,
    complaint: complaintId,
    type,
    message
  })));

  const results = await Promise.all(admins.map((admin) => sendPortalEmail(admin.email, 'admin')));
  if (results.every((result) => result === 'sent')) return 'sent';
  if (results.every((result) => result === 'not-configured')) return 'not-configured';
  if (results.some((result) => result === 'sent')) return 'partial';
  if (results.some((result) => result === 'misconfigured')) return 'misconfigured';
  return results.every((result) => result === 'no-recipient') ? 'no-recipient' : 'failed';
}

module.exports = { notifyUser, notifyAdmins };
