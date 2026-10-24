'use strict';
const prisma = require('../lib/prisma');

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ message: 'Bildirimler okundu olarak isaretlendi.' });
  } catch (err) {
    console.error('markAsRead:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { getNotifications, markAsRead };
