'use strict';
const prisma = require('../lib/prisma');

const getAllCVs = async (req, res) => {
  try {
    // adminMiddleware zaten ADMIN rolü kontrolü yapıyor — burada tekrar gerekmiyor
    const cvDocs = await prisma.document.findMany({
      where: { type: { in: ['CV', 'CV_FORM'] } },
      include: {
        user: {
          include: { profile: true }
        },
        cvAnalysis: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedList = cvDocs.map(doc => ({
      id: doc.id,
      username: doc.user.username,
      fullName: doc.user.profile?.fullName || doc.user.username,
      status: doc.status || 'pending',
      submittedAt: doc.createdAt,
      type: doc.type === 'CV_FORM' ? 'form' : 'uploaded',
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      avatarUrl: doc.user.profile?.avatarUrl
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${doc.user.profile.avatarUrl}`
        : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(doc.user.username)}`,
      aiScore: doc.cvAnalysis?.alignmentScore ?? null,
      skillGapSummary: doc.cvAnalysis?.skillGap?.slice(0, 3) ?? [],
      cvData: doc.user.profile,
    }));

    res.json(formattedList);
  } catch (err) {
    console.error('getAllCVs:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const updateCVStatus = async (req, res) => {
  try {
    const { documentId, status } = req.body;

    if (!documentId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Gecersiz istek!' });
    }

    const doc = await prisma.document.update({
      where: { id: parseInt(documentId) },
      data: { status }
    });

    // Kullaniciya bildirim olustur
    const notification = await prisma.notification.create({
      data: {
        userId: doc.userId,
        title: 'CV Durumu Güncellendi',
        message: `Yüklemiş olduğunuz ${doc.fileName} isimli CV'niz yönetici tarafından ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`
      }
    });

    // Gerçek zamanlı bildirim gönder (kullanıcı çevrimiçiyse)
    const emitNotification = req.app.get('emitNotification');
    if (emitNotification) {
      emitNotification(doc.userId, notification);
    }

    res.json({ message: 'CV durumu guncellendi!', document: doc });
  } catch (err) {
    console.error('updateCVStatus:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const getPendingCount = async (req, res) => {
  try {
    const count = await prisma.document.count({
      where: { type: { in: ['CV', 'CV_FORM'] }, status: 'pending' }
    });
    res.json({ pendingCount: count });
  } catch (err) {
    console.error('getPendingCount:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const pendingCount = await prisma.document.count({
      where: { type: { in: ['CV', 'CV_FORM'] }, status: 'pending' }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, role: true, createdAt: true, profile: { select: { avatarUrl: true } } }
    });

    res.json({
      pendingCount,
      recentUsers: recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: 'new_user',
        description: `${user.username} sisteme katıldı`,
        createdAt: user.createdAt,
        avatarUrl: user.profile?.avatarUrl || null,
      })),
    });
  } catch (err) {
    console.error('getDashboardStats:', err);
    res.status(500).json({ error: 'Sunucu hatasi!' });
  }
};

module.exports = { getAllCVs, updateCVStatus, getPendingCount, getDashboardStats };
