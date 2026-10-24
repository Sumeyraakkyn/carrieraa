'use strict';
const prisma = require('../lib/prisma');

const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        courses: { select: { courseId: true, completedAt: true } },
        evaluations: { orderBy: { createdAt: 'desc' } },
        profile: { select: { avatarUrl: true, fullName: true, careerGoal: true } },
      },
    });
    res.json(users);
  } catch (err) {
    console.error('listUsers:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { listUsers };
