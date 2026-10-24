'use strict';

const prisma = require('../lib/prisma');

const POINTS_PER_COURSE = 50;

function calculatePoints(courseCount, cvCount) {
  // Sunucu tarafındaki ödüller: herkes için aynı, doğrulanabilir aksiyonlar.
  // Ziyaret başarısı tarayıcıda takip edilir; liderlik sırasını manipüle etmez.
  const achievementCp =
    (courseCount >= 1 ? 50 : 0) +
    (cvCount >= 1 ? 75 : 0) +
    (courseCount >= 5 ? 200 : 0) +
    (cvCount >= 5 ? 250 : 0);
  return courseCount * POINTS_PER_COURSE + achievementCp;
}

async function getRewardsOverview(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        username: true,
        courses: { select: { id: true } },
        documents: { where: { type: 'CV' }, select: { id: true } },
        profile: { select: { fullName: true, avatarUrl: true } },
      },
    });

    const leaderboard = users
      .map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.profile?.fullName || user.username,
        avatarUrl: user.profile?.avatarUrl || null,
        courseCount: user.courses.length,
        cvCount: user.documents.length,
        points: calculatePoints(user.courses.length, user.documents.length),
      }))
      .sort((a, b) => b.points - a.points || b.courseCount - a.courseCount || a.username.localeCompare(b.username));

    const me = leaderboard.find((user) => user.id === req.user.id);
    if (!me) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    res.json({
      me: { courseCount: me.courseCount, cvCount: me.cvCount, points: me.points },
      leaderboard: leaderboard.slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('getRewardsOverview:', err);
    res.status(500).json({ error: 'Ödül verileri alınamadı.' });
  }
}

module.exports = { getRewardsOverview };
