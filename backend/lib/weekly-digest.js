'use strict';

/**
 * Haftalık YZ Özeti
 * Her Pazartesi sabah tüm kullanıcılara kişiselleştirilmiş
 * "Bu hafta şunu yap" bildirimi gönderir.
 */

const COURSE_CATEGORIES = {
  liderlik:  { name: 'Liderlik Gelişimi',    total: 3, weight: 0.25 },
  stratejik: { name: 'Stratejik Planlama',   total: 3, weight: 0.25 },
  butce:     { name: 'Bütçe Yönetimi',       total: 3, weight: 0.20 },
  cevik:     { name: 'Çeviklik & İnovasyon', total: 4, weight: 0.30 },
};

const ALL_COURSES = {
  'liderlik-1': 'Modern Liderlik & Çatışma Yönetimi',
  'liderlik-2': 'Çevik (Agile) Dönüşüm ve Ekip Yönetimi',
  'liderlik-3': 'Etkili İletişim ve Motivasyon Teknikleri',
  'stratejik-1': 'Stratejik Düşünme ve Planlama',
  'stratejik-2': 'Veri Odaklı Karar Verme Sanatı',
  'stratejik-3': 'Risk Yönetimi ve Senaryo Analizi',
  'butce-1': 'Temel Bütçe Planlama ve Kontrol',
  'butce-2': 'Finansal Analiz ve Raporlama',
  'butce-3': 'Maliyet Optimizasyonu Stratejileri',
  'cevik-1': 'Agile ve Scrum Temelleri',
  'cevik-2': 'İnovasyon ve Yaratıcı Düşünme',
  'cevik-3': 'Kanban ve Sürekli İyileştirme',
  'cevik-4': 'Dijital Dönüşüm ve Değişim Yönetimi',
};

function calcKpiScore(kpi) {
  if (!kpi) return 0;
  const raw = (kpi.kalite || 0) * 0.30 + (kpi.sorumluluk || 0) * 0.25 +
              (kpi.birligi || 0) * 0.25 + (kpi.zaman || 0) * 0.20;
  return Math.round((raw / 5) * 100);
}

function calcCourseScore(completedIds) {
  if (!completedIds || completedIds.length === 0) return 0;
  let score = 0;
  for (const [cat, info] of Object.entries(COURSE_CATEGORIES)) {
    const done = completedIds.filter(id => id.startsWith(cat)).length;
    score += Math.min(done / info.total, 1) * info.weight * 100;
  }
  return Math.round(score);
}

function calcOverallScore(kpiScore, courseScore) {
  return Math.round(Math.min(kpiScore * 0.55 + courseScore * 0.45, 100));
}

/**
 * Kullanıcı için haftalık özet mesajı üretir
 */
function buildWeeklyMessage(user, completedIds, latestEval, careerGoal) {
  const kpiScore    = calcKpiScore(latestEval);
  const courseScore = calcCourseScore(completedIds);
  const overall     = calcOverallScore(kpiScore, courseScore);
  const name        = user.profile?.fullName || user.username;

  // Tamamlanmamış kurslardan en öncelikli birini bul
  const notDone = Object.entries(ALL_COURSES).filter(([id]) => !completedIds.includes(id));

  // Kariyer hedefine göre öncelikli kategori
  const CAREER_COURSE_MAP = {
    'Yazılım Mühendisi': ['cevik', 'stratejik'],
    'Proje Yöneticisi':  ['liderlik', 'stratejik'],
    'Ürün Yöneticisi':   ['liderlik', 'cevik'],
    'Veri Bilimcisi':    ['stratejik', 'butce'],
  };
  const priorityCats = CAREER_COURSE_MAP[careerGoal] || ['cevik'];
  const priorityCourse = notDone.find(([id]) => priorityCats.some(cat => id.startsWith(cat)));
  const nextCourse = priorityCourse || notDone[0];

  // Zayıf KPI alanı
  let weakArea = null;
  if (latestEval) {
    const fields = [
      { key: 'kalite', label: 'iş kalitesi' },
      { key: 'sorumluluk', label: 'sorumluluk' },
      { key: 'birligi', label: 'iş birliği' },
      { key: 'zaman', label: 'zaman yönetimi' },
    ];
    const weakest = fields.sort((a, b) => (latestEval[a.key] || 0) - (latestEval[b.key] || 0))[0];
    if ((latestEval[weakest.key] || 0) < 3.5) weakArea = weakest.label;
  }

  // Mesaj oluştur
  let message = `Merhaba ${name}! Bu hafta için YZ önerilerin: `;

  if (nextCourse) {
    message += `📚 "${nextCourse[1]}" kursunu tamamla (genel skorun %${overall}). `;
  }

  if (weakArea) {
    message += `💡 ${weakArea} alanında gelişim fırsatın var. `;
  }

  if (overall >= 70) {
    message += `🎯 Harika gidiyorsun! Bir üst seviyeye çok az kaldı.`;
  } else if (overall >= 50) {
    message += `📈 Orta seviyedesin, düzenli çalışmayla hızla ilerleyebilirsin.`;
  } else {
    message += `🚀 Kariyer yolculuğunun başındasın, her adım önemli!`;
  }

  return message;
}

/**
 * Tüm kullanıcılara haftalık özet bildirimi gönderir
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {Function|null} emitNotification - Socket.io emit fonksiyonu
 */
async function analyzeUserForCron(prisma, emitNotification) {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    include: {
      courses: true,
      evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
      profile: { select: { fullName: true, careerGoal: true } },
      notifications: {
        where: { title: 'Haftalık YZ Özeti' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  let sent = 0;
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  for (const user of users) {
    // Geçen hafta zaten gönderildiyse atla
    const lastDigest = user.notifications[0];
    if (lastDigest && (Date.now() - new Date(lastDigest.createdAt).getTime()) < ONE_WEEK) {
      continue;
    }

    const completedIds = user.courses.map(c => c.courseId);
    const latestEval   = user.evaluations[0] || null;
    const careerGoal   = user.profile?.careerGoal || null;

    const message = buildWeeklyMessage(user, completedIds, latestEval, careerGoal);

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Haftalık YZ Özeti',
        message,
      },
    });

    // Gerçek zamanlı gönder
    if (emitNotification) {
      emitNotification(user.id, notification);
    }

    sent++;
  }

  console.log(`[weekly-digest] ${sent} kullanıcıya haftalık özet gönderildi.`);
  return sent;
}

module.exports = { analyzeUserForCron };
