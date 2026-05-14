const Notification = require('../models/Notification');

async function notifyUser(userId, title, message = '', link = '') {
  if (!userId) return;
  await Notification.create({ user: userId, title, message, link });
}

async function notifyUsers(userIds, title, message = '', link = '') {
  const unique = [...new Set(userIds.map(String))];
  await Promise.all(unique.map((id) => notifyUser(id, title, message, link)));
}

module.exports = { notifyUser, notifyUsers };
