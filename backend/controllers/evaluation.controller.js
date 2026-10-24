'use strict';
const prisma = require('../lib/prisma');

const createEvaluation = async (req, res) => {
  try {
    const { userId, username, kalite, sorumluluk, birligi, zaman, yorumlar } = req.body;
    let targetUserId = userId;

    if (!targetUserId && username) {
      const u = await prisma.user.findUnique({ where: { username } });
      if (u) targetUserId = u.id;
    }
    if (!targetUserId) return res.status(400).json({ error: 'Degerlendirilecek kullanici bulunamadi.' });

    const now = new Date();
    const evaluation = await prisma.evaluation.create({
      data: {
        userId: targetUserId,
        kalite: parseFloat(kalite || 0),
        sorumluluk: parseFloat(sorumluluk || 0),
        birligi: parseFloat(birligi || 0),
        zaman: parseFloat(zaman || 0),
        yorumlar: yorumlar || '',
        tarih: now.toLocaleDateString('tr-TR'),
        saat: now.toLocaleTimeString('tr-TR'),
        yonetici: req.user.username,
      },
    });
    // Kullanıcıya bildirim oluştur
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: 'Yeni Değerlendirme',
        message: `${req.user.username} tarafından yeni bir performans değerlendirmesi yapıldı.`,
      },
    });

    // Gerçek zamanlı bildirim gönder
    const emitNotification = req.app.get('emitNotification');
    if (emitNotification) emitNotification(targetUserId, notification);

    res.status(201).json({ message: 'Degerlendirme basariyla eklendi!', evaluation });
  } catch (err) {
    console.error('createEvaluation:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const getMyEvaluations = async (req, res) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(evaluations);
  } catch (err) {
    console.error('getMyEvaluations:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { createEvaluation, getMyEvaluations };
