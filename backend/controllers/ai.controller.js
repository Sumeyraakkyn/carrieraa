'use strict';
const prisma = require('../lib/prisma');

// ─── Sabitler ────────────────────────────────────────────────────────────────

const COURSE_CATEGORIES = {
  liderlik:  { name: 'Liderlik Gelişimi',      total: 3, weight: 0.25 },
  stratejik: { name: 'Stratejik Planlama',     total: 3, weight: 0.25 },
  butce:     { name: 'Bütçe Yönetimi',         total: 3, weight: 0.20 },
  cevik:     { name: 'Çeviklik & İnovasyon',   total: 4, weight: 0.30 },
};

// Geçmiş sürümlerde kaydedilmiş kurslar da bu katalogla değerlendirilir.
// Böylece kullanıcı bir kursu tamamladığı halde analiz puanı sıfır saymaz.
const LEGACY_COURSE_CATEGORY_MAP = {
  'zaman-yonetimi': 'stratejik',
  'python-giris': 'cevik',
  'react-temelleri': 'cevik',
  'veri-analizi-101': 'stratejik',
};

const KPI_WEIGHTS = {
  kalite:     0.30,
  sorumluluk: 0.25,
  birligi:    0.25,
  zaman:      0.20,
};

// Kariyer hedefi → ilgili kurs kategorileri eşleşmesi. Profil formundaki
// tüm seçenekler ve önceki sürümlerde saklanan hedef adları burada tanımlıdır.
const CAREER_COURSE_MAP = {
  'Yazılım Mühendisi':          ['cevik', 'stratejik'],
  'Yazılım Geliştirici':        ['cevik', 'stratejik'],
  'Veri Bilimcisi':             ['stratejik', 'cevik'],
  'Veri Analisti':              ['stratejik', 'cevik'],
  'Proje Yöneticisi':           ['liderlik', 'stratejik', 'butce'],
  'Ürün Yöneticisi':            ['liderlik', 'stratejik', 'cevik'],
  'UI/UX Tasarımcı':            ['cevik', 'liderlik'],
  'UX/UI Tasarımcı':            ['cevik', 'liderlik'],
  'Pazarlama Uzmanı':           ['stratejik', 'liderlik'],
  'İnsan Kaynakları Uzmanı':    ['liderlik', 'stratejik'],
  'Finans Analisti':            ['butce', 'stratejik'],
  'Finans Uzmanı':              ['butce', 'stratejik'],
  'Operasyon Yöneticisi':       ['liderlik', 'butce', 'cevik'],
  'Girişimci':                  ['liderlik', 'stratejik', 'butce'],
  'Müşteri Deneyimi Uzmanı':    ['liderlik', 'cevik'],
  'Danışman':                   ['stratejik', 'liderlik'],
  'İş Geliştirme Uzmanı':       ['stratejik', 'liderlik', 'butce'],
  'Lojistik Koordinatör':       ['butce', 'stratejik', 'cevik'],
  'Hukuk Uzmanı':               ['stratejik', 'liderlik'],
  'İş Analisti':                ['stratejik', 'butce', 'cevik'],
  'Sistem Yöneticisi':          ['cevik', 'stratejik'],
  'CTO':                        ['liderlik', 'stratejik', 'cevik'],
};

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────

/**
 * KPI puanlarından ağırlıklı skor hesaplar (0-100 arası)
 */
function calcKpiScore(kpi) {
  if (!kpi) return 0;
  const raw =
    (kpi.kalite     || 0) * KPI_WEIGHTS.kalite     +
    (kpi.sorumluluk || 0) * KPI_WEIGHTS.sorumluluk +
    (kpi.birligi    || 0) * KPI_WEIGHTS.birligi    +
    (kpi.zaman      || 0) * KPI_WEIGHTS.zaman;
  return Math.round((raw / 5) * 100); // 0-100
}

function getCourseCategory(courseId) {
  if (!courseId) return null;
  const directCategory = Object.keys(COURSE_CATEGORIES).find((category) => courseId.startsWith(category));
  return directCategory || LEGACY_COURSE_CATEGORY_MAP[courseId] || null;
}

/**
 * Tamamlanan kurslardan ağırlıklı eğitim skoru hesaplar (0-100 arası)
 */
function calcCourseScore(completedIds) {
  if (!completedIds || completedIds.length === 0) return 0;
  let score = 0;
  for (const [cat, info] of Object.entries(COURSE_CATEGORIES)) {
    const done = completedIds.filter(id => getCourseCategory(id) === cat).length;
    const pct  = Math.min(done / info.total, 1);
    score += pct * info.weight * 100;
  }
  return Math.round(score);
}

function buildKpiTrend(evaluations) {
  if (!evaluations || evaluations.length === 0) return null;

  const latest = evaluations[0];
  const fields = ['kalite', 'sorumluluk', 'birligi', 'zaman'];
  const currentScore = calcKpiScore(latest);
  if (evaluations.length === 1) {
    return { sampleSize: 1, currentScore, previousAverageScore: null, change: null, direction: 'not_enough_data', fields: {} };
  }

  const previous = evaluations.slice(1);
  const previousAverageScore = Math.round(previous.reduce((sum, item) => sum + calcKpiScore(item), 0) / previous.length);
  const fieldsTrend = Object.fromEntries(fields.map((field) => {
    const previousAverage = previous.reduce((sum, item) => sum + (item[field] || 0), 0) / previous.length;
    const change = Number(((latest[field] || 0) - previousAverage).toFixed(2));
    return [field, { current: latest[field] || 0, previousAverage: Number(previousAverage.toFixed(2)), change }];
  }));
  const change = currentScore - previousAverageScore;
  return {
    sampleSize: evaluations.length,
    currentScore,
    previousAverageScore,
    change,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    fields: fieldsTrend,
  };
}

// Tek bir anlık değerlendirme yerine son değerlendirmeyi geçmiş ortalamayla
// dengeler. Bu değer yalnızca öneri önceliklendirmesinde kullanılır; ekranda
// gösterilen güncel KPI puanı daima en son değerlendirmedir.
function getRecommendationKpi(evaluations) {
  const latest = evaluations?.[0];
  if (!latest || evaluations.length === 1) return latest || null;
  const older = evaluations.slice(1);
  const fields = ['kalite', 'sorumluluk', 'birligi', 'zaman'];
  return Object.fromEntries(fields.map((field) => {
    const olderAverage = older.reduce((sum, item) => sum + (item[field] || 0), 0) / older.length;
    return [field, Number((((latest[field] || 0) * 0.7) + (olderAverage * 0.3)).toFixed(2))];
  }));
}

/**
 * Potansiyel quiz cevaplarından liderlik/analitik/yaratıcı/uyum skorları çıkarır
 */
function calcPotentialScores(answers) {
  if (!answers || !Array.isArray(answers)) return null;
  const counts = { A: 0, B: 0, C: 0, D: 0 };
  // answers dizisi: her eleman seçilen option index'i (0=A,1=B,2=C,3=D)
  answers.forEach(idx => {
    const key = ['A', 'B', 'C', 'D'][idx];
    if (key) counts[key]++;
  });
  const total = answers.length || 1;
  return {
    liderlik:   Math.round((counts.A / total) * 100),
    analitik:   Math.round((counts.B / total) * 100),
    yaratici:   Math.round((counts.C / total) * 100),
    uyumlu:     Math.round((counts.D / total) * 100),
  };
}

/**
 * Tüm girdileri birleştirerek 0-100 genel yetkinlik skoru üretir
 */
function calcOverallScore(kpiScore, courseScore, potentialScores) {
  let score = kpiScore * 0.50 + courseScore * 0.35;
  if (potentialScores && typeof potentialScores === 'object') {
    const fields = ['liderlik', 'analitik', 'iletisim', 'yaratici', 'uyumlu'];
    let sum = 0;
    let count = 0;
    fields.forEach(field => {
      const val = potentialScores[field];
      if (typeof val === 'number') {
        const normalizedVal = val <= 40 ? (val / 40) * 100 : val;
        sum += normalizedVal;
        count++;
      }
    });
    if (count > 0) {
      const potAvg = sum / count;
      score += potAvg * 0.15;
    } else {
      score = kpiScore * 0.55 + courseScore * 0.45;
    }
  } else {
    // Potansiyel quiz yapılmamışsa KPI + kurs ağırlığını yeniden dağıt
    score = kpiScore * 0.55 + courseScore * 0.45;
  }
  return Math.round(Math.min(score, 100));
}

/**
 * Skora göre seviye etiketi
 */
function getLevel(score) {
  if (score >= 85) return { label: 'Uzman',           color: '#10b981', icon: 'fa-crown' };
  if (score >= 70) return { label: 'İleri Seviye',    color: '#3b82f6', icon: 'fa-trophy' };
  if (score >= 50) return { label: 'Orta Seviye',     color: '#f59e0b', icon: 'fa-chart-line' };
  if (score >= 30) return { label: 'Gelişmekte',      color: '#f97316', icon: 'fa-seedling' };
  return               { label: 'Başlangıç',          color: '#6b7280', icon: 'fa-flag' };
}

/**
 * KPI puanlarına göre güçlü yönler listesi üretir
 */
function buildStrengths(kpi, courseScore, potentialScores) {
  const list = [];
  if (!kpi) return list;

  if (kpi.kalite >= 4)
    list.push({ icon: 'fa-star', text: 'İş kalitesi ve problem çözme kabiliyetiniz üst düzeyde.' });
  if (kpi.sorumluluk >= 4)
    list.push({ icon: 'fa-shield-halved', text: 'Sorumluluk bilinciniz ve güvenilirliğiniz çok yüksek.' });
  if (kpi.birligi >= 4)
    list.push({ icon: 'fa-people-group', text: 'Ekip içi iş birliği ve iletişim becerileriniz güçlü.' });
  if (kpi.zaman >= 4)
    list.push({ icon: 'fa-clock', text: 'Zaman yönetimi ve önceliklendirme konusunda başarılısınız.' });
  if (courseScore >= 70)
    list.push({ icon: 'fa-graduation-cap', text: 'Eğitim tamamlama oranınız yüksek, öğrenmeye açıksınız.' });
  const getNormScore = (field) => {
    if (!potentialScores || typeof potentialScores[field] !== 'number') return 0;
    const val = potentialScores[field];
    return val <= 40 ? (val / 40) * 100 : val;
  };

  if (getNormScore('liderlik') >= 50)
    list.push({ icon: 'fa-user-tie', text: 'Liderlik potansiyeliniz ön plana çıkıyor.' });
  if (getNormScore('analitik') >= 50)
    list.push({ icon: 'fa-magnifying-glass-chart', text: 'Analitik düşünme ve veri odaklı karar verme güçlü yönünüz.' });

  return list;
}

/**
 * Düşük puanlı alanlara göre gelişim önerileri üretir
 */
function buildImprovements(kpi, catProgress) {
  const list = [];
  if (!kpi) return list;

  if (kpi.kalite < 3)
    list.push({ icon: 'fa-arrow-trend-up', text: 'İş kalitesini artırmak için süreç takibi ve geri bildirim alışkanlığı geliştirin.' });
  if (kpi.sorumluluk < 3)
    list.push({ icon: 'fa-arrow-trend-up', text: 'Sorumluluk bilincini güçlendirmek için hedef belirleme tekniklerini öğrenin.' });
  if (kpi.birligi < 3)
    list.push({ icon: 'fa-arrow-trend-up', text: 'Ekip içi iletişimi geliştirmek için aktif dinleme ve empati becerilerine odaklanın.' });
  if (kpi.zaman < 3)
    list.push({ icon: 'fa-arrow-trend-up', text: 'Zaman yönetimi için Pomodoro veya GTD gibi metodolojileri deneyin.' });

  // Kurs bazlı öneriler
  for (const [cat, info] of Object.entries(COURSE_CATEGORIES)) {
    const pct = catProgress[cat] || 0;
    if (pct < 50)
      list.push({ icon: 'fa-book-open', text: `${info.name} eğitimlerini tamamlama oranınız düşük (%${pct}). Bu alana odaklanın.` });
  }

  return list;
}

/**
 * Zayıf alanlara + kariyer hedefine göre eğitim önerileri
 */
function buildCourseRecommendations(kpi, catProgress, careerGoal) {
  const recs = new Set();

  if (kpi) {
    if (kpi.kalite < 3)     recs.add('Kalite Yönetimi ve Süreç İyileştirme');
    if (kpi.sorumluluk < 3) recs.add('Profesyonel Sorumluluk ve İş Etiği');
    if (kpi.birligi < 3)    recs.add('Etkili Takım Çalışması ve İletişim');
    if (kpi.zaman < 3)      recs.add('Zaman Yönetimi ve Önceliklendirme');
  }

  // Kariyer hedefine göre ek öneriler
  const relatedCats = CAREER_COURSE_MAP[careerGoal] || [];
  relatedCats.forEach(cat => {
    const pct = catProgress[cat] || 0;
    if (pct < 100 && COURSE_CATEGORIES[cat])
      recs.add(`${COURSE_CATEGORIES[cat].name} — Kariyer hedefiniz için kritik`);
  });

  // Tamamlanmamış kategoriler
  for (const [cat, info] of Object.entries(COURSE_CATEGORIES)) {
    const pct = catProgress[cat] || 0;
    if (pct < 100) recs.add(`${info.name} eğitimlerini tamamlayın (%${pct} tamamlandı)`);
  }

  return Array.from(recs).slice(0, 5);
}

/**
 * Genel skora + kariyer hedefine göre kariyer yolu önerisi
 */
function buildCareerPath(overallScore, kpi, potentialScores, careerGoal) {
  const avg = kpi ? (kpi.kalite + kpi.sorumluluk + kpi.birligi + kpi.zaman) / 4 : 0;
  const lidScore = potentialScores?.liderlik ? (potentialScores.liderlik <= 40 ? (potentialScores.liderlik / 40) * 100 : potentialScores.liderlik) : 0;
  const isLeader = lidScore >= 50;

  let currentRole, targetRole, timeframe, advice;

  if (overallScore >= 85) {
    currentRole = 'Kıdemli Uzman';
    targetRole  = isLeader ? 'Takım Lideri / Yönetici' : 'Uzman / Danışman';
    timeframe   = '3-6 ay';
    advice      = 'Mükemmel performans! Liderlik veya uzmanlık rollerine geçiş için hazırsınız. Mentorluk programlarına katılmayı değerlendirin.';
  } else if (overallScore >= 70) {
    currentRole = 'Gelişen Uzman';
    targetRole  = 'Kıdemli Uzman';
    timeframe   = '6-12 ay';
    advice      = 'Güçlü bir ilerleme gösteriyorsunuz. Eksik eğitimleri tamamlayarak ve KPI puanlarınızı artırarak bir üst seviyeye ulaşabilirsiniz.';
  } else if (overallScore >= 50) {
    currentRole = 'Orta Seviye Çalışan';
    targetRole  = 'Gelişen Uzman';
    timeframe   = '12-18 ay';
    advice      = 'Temel yetkinliklerinizi geliştirmeye devam edin. Önerilen eğitimleri öncelikli olarak tamamlayın.';
  } else {
    currentRole = 'Başlangıç Seviyesi';
    targetRole  = 'Orta Seviye Çalışan';
    timeframe   = '18-24 ay';
    advice      = 'Kariyer yolculuğunuzun başındasınız. Tüm eğitim kategorilerini sistematik olarak tamamlayın ve yöneticinizden düzenli geri bildirim alın.';
  }

  if (careerGoal) {
    const focusAreas = (CAREER_COURSE_MAP[careerGoal] || [])
      .map((category) => COURSE_CATEGORIES[category]?.name)
      .filter(Boolean);

    advice += focusAreas.length > 0
      ? ` ${careerGoal} hedefi için ${focusAreas.join(', ')} alanlarına odaklanmanız önerilir.`
      : ` ${careerGoal} hedefiniz doğrultusunda teknik, iletişim ve liderlik yetkinliklerinizi dengeli biçimde geliştirmeye devam edin.`;
  }

  return { currentRole, targetRole, timeframe, advice };
}

// ─── Ana Analiz Fonksiyonu ───────────────────────────────────────────────────

/**
 * GET /api/ai/analyze
 * Kullanıcının tüm verilerini çekip YZ analizi döner
 */
const analyzeUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Tüm veriyi paralel çek
    const [evaluations, courses, profile] = await Promise.all([
      prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.userCourse.findMany({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);

    const latestEval = evaluations[0] || null;
    const completedIds = courses.map(c => c.courseId);

    // 2. Kategori bazlı ilerleme yüzdesi
    const catProgress = {};
    for (const [cat, info] of Object.entries(COURSE_CATEGORIES)) {
      const done = completedIds.filter(id => getCourseCategory(id) === cat).length;
      catProgress[cat] = Math.round((done / info.total) * 100);
    }

    // 3. Potansiyel quiz sonuçları
    const potentialRaw = profile?.potentialScore;
    const potentialScores = potentialRaw
      ? (typeof potentialRaw === 'string' ? JSON.parse(potentialRaw) : potentialRaw)
      : null;

    // 4. Skorları hesapla
    const kpiScore     = calcKpiScore(latestEval);
    const kpiTrend     = buildKpiTrend(evaluations);
    const courseScore  = calcCourseScore(completedIds);
    const overallScore = calcOverallScore(kpiScore, courseScore, potentialScores);
    const level        = getLevel(overallScore);

    // 5. Analiz bölümlerini üret
    const careerGoal = profile?.careerGoal || null;
    const strengths         = buildStrengths(latestEval, courseScore, potentialScores);
    const improvements      = buildImprovements(latestEval, catProgress);
    const courseRecs        = buildCourseRecommendations(latestEval, catProgress, careerGoal);
    const careerPath        = buildCareerPath(overallScore, latestEval, potentialScores, careerGoal);

    // 6. Radar chart verisi (frontend için)
    const radarData = {
      labels: ['İş Kalitesi', 'Sorumluluk', 'İş Birliği', 'Zaman Yönetimi',
               'Liderlik Eğitimi', 'Stratejik Eğitim', 'Bütçe Eğitimi', 'Çevik Eğitim'],
      values: [
        ((latestEval?.kalite     || 0) / 5) * 100,
        ((latestEval?.sorumluluk || 0) / 5) * 100,
        ((latestEval?.birligi    || 0) / 5) * 100,
        ((latestEval?.zaman      || 0) / 5) * 100,
        catProgress.liderlik  || 0,
        catProgress.stratejik || 0,
        catProgress.butce     || 0,
        catProgress.cevik     || 0,
      ],
    };

    res.json({
      overallScore,
      level,
      kpiScore,
      kpiTrend,
      courseScore,
      catProgress,
      hasEvaluation: !!latestEval,
      hasPotential:  !!potentialScores,
      evaluation: latestEval ? {
        kalite: latestEval.kalite,
        sorumluluk: latestEval.sorumluluk,
        birligi: latestEval.birligi,
        zaman: latestEval.zaman,
        yorumlar: latestEval.yorumlar,
        tarih: latestEval.tarih,
        yonetici: latestEval.yonetici,
      } : null,
      strengths,
      improvements,
      courseRecommendations: courseRecs,
      careerPath,
      radarData,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('analyzeUser:', err);
    res.status(500).json({ error: 'Analiz sırasında bir hata oluştu.' });
  }
};

// ─── Akıllı Eğitim Öneri Motoru ─────────────────────────────────────────────

// Kurs ID → kategori ve başlık eşleşmesi (frontend'deki courseData ile senkron)
const ALL_COURSES = {
  'liderlik-1': { cat: 'liderlik', title: 'Modern Liderlik & Çatışma Yönetimi' },
  'liderlik-2': { cat: 'liderlik', title: 'Çevik (Agile) Dönüşüm ve Ekip Yönetimi' },
  'liderlik-3': { cat: 'liderlik', title: 'Etkili İletişim ve Motivasyon Teknikleri' },
  'stratejik-1': { cat: 'stratejik', title: 'Stratejik Düşünme ve Planlama' },
  'stratejik-2': { cat: 'stratejik', title: 'Veri Odaklı Karar Verme Sanatı' },
  'stratejik-3': { cat: 'stratejik', title: 'Risk Yönetimi ve Senaryo Analizi' },
  'butce-1': { cat: 'butce', title: 'Temel Bütçe Planlama ve Kontrol' },
  'butce-2': { cat: 'butce', title: 'Finansal Analiz ve Raporlama' },
  'butce-3': { cat: 'butce', title: 'Maliyet Optimizasyonu Stratejileri' },
  'cevik-1': { cat: 'cevik', title: 'Agile ve Scrum Temelleri' },
  'cevik-2': { cat: 'cevik', title: 'İnovasyon ve Yaratıcı Düşünme' },
  'cevik-3': { cat: 'cevik', title: 'Kanban ve Sürekli İyileştirme' },
  'cevik-4': { cat: 'cevik', title: 'Dijital Dönüşüm ve Değişim Yönetimi' },
};

// KPI kriteri → ilgili kurs kategorisi
const KPI_COURSE_MAP = {
  kalite:     ['stratejik', 'cevik'],
  sorumluluk: ['liderlik', 'stratejik'],
  birligi:    ['liderlik'],
  zaman:      ['butce', 'cevik'],
};

/**
 * GET /api/ai/course-recommendations
 * Kullanıcıya özel kurs önerileri üretir
 */
async function getCourseRecommendations(req, res) {
  try {
    const userId = req.user.id;

    const [evaluations, courses, profile, cvAnalysis] = await Promise.all([
      prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.userCourse.findMany({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.cvAnalysis.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    ]);

    const latestEval = evaluations[0] || null;
    const recommendationKpi = getRecommendationKpi(evaluations);
    const completedIds = new Set(courses.map(c => c.courseId));
    const careerGoal = profile?.careerGoal || null;

    // Tüm tamamlanmamış kurslar
    const notCompleted = Object.entries(ALL_COURSES).filter(([id]) => !completedIds.has(id));
    if (notCompleted.length === 0) {
      return res.json({ recommendations: [], allCompleted: true });
    }

    // Her kursa puan ver
    const scored = notCompleted.map(([courseId, info]) => {
      let score = 0;
      const reasons = [];

      // 1. Kariyer hedefi uyumu
      const relatedCats = CAREER_COURSE_MAP[careerGoal] || [];
      if (relatedCats.includes(info.cat)) {
        score += 40;
        reasons.push(`${careerGoal || 'Kariyer hedefin'} için kritik`);
      }

      // 2. KPI düşük olan kriterlere göre
      if (recommendationKpi) {
        const weakKpis = Object.entries(KPI_COURSE_MAP).filter(([kpi]) => (recommendationKpi[kpi] || 0) < 3);
        weakKpis.forEach(([kpi, cats]) => {
          if (cats.includes(info.cat)) {
            score += 30;
            const kpiNames = { kalite: 'iş kalitesi', sorumluluk: 'sorumluluk', birligi: 'iş birliği', zaman: 'zaman yönetimi' };
            reasons.push(`Son KPI eğilimine göre ${kpiNames[kpi]} puanın düşük`);
          }
        });
      }

      // 3. CV'deki skill gap ile örtüşüyor mu?
      if (cvAnalysis?.skillGap && Array.isArray(cvAnalysis.skillGap)) {
        const catSkillMap = {
          liderlik: ['liderlik', 'iletişim', 'motivasyon', 'agile', 'scrum'],
          stratejik: ['stratejik', 'planlama', 'veri', 'risk', 'analiz'],
          butce: ['bütçe', 'finans', 'muhasebe', 'maliyet', 'excel'],
          cevik: ['agile', 'scrum', 'kanban', 'inovasyon', 'dijital', 'docker', 'typescript'],
        };
        const catKeywords = catSkillMap[info.cat] || [];
        const gapMatch = cvAnalysis.skillGap.some(gap =>
          catKeywords.some(kw => gap.toLowerCase().includes(kw))
        );
        if (gapMatch) {
          score += 20;
          reasons.push('CV\'nde bu alan eksik');
        }
      }

      // 4. Kategori tamamlanma oranı düşükse bonus
      const catDone = [...completedIds].filter(id => getCourseCategory(id) === info.cat).length;
      const catTotal = Object.values(ALL_COURSES).filter(c => c.cat === info.cat).length;
      const catPct = catTotal > 0 ? catDone / catTotal : 0;
      if (catPct === 0) {
        score += 15;
        reasons.push('Bu kategoriye hiç başlamadın');
      } else if (catPct < 0.5) {
        score += 8;
        reasons.push('Bu kategoride ilerleme düşük');
      }

      // 5. Sıradaki kurs bonusu (kategoride en az tamamlanan)
      const catCourseIds = Object.entries(ALL_COURSES)
        .filter(([, c]) => c.cat === info.cat)
        .map(([id]) => id);
      const firstNotDone = catCourseIds.find(id => !completedIds.has(id));
      if (firstNotDone === courseId) {
        score += 10;
        reasons.push('Kategorinin sıradaki kursu');
      }

      return {
        courseId,
        category: info.cat,
        title: info.title,
        score,
        reason: reasons.length > 0 ? reasons[0] : 'Genel gelişim için önerilir',
        allReasons: reasons,
      };
    });

    // En yüksek puanlı 3 kursu döndür
    const top3 = scored
      .sort((a, b) => b.score - a.score || a.courseId.localeCompare(b.courseId, 'tr'))
      .slice(0, 3);

    res.json({
      recommendations: top3,
      allCompleted: false,
      evaluationTrend: buildKpiTrend(evaluations),
    });
  } catch (err) {
    console.error('getCourseRecommendations:', err);
    res.status(500).json({ error: 'Öneri üretilirken hata oluştu.' });
  }
}

// ─── CV Analiz Sonucu Getir ──────────────────────────────────────────────────

/**
 * GET /api/ai/cv-analysis/:documentId
 * Kullanıcı kendi CV analizini, admin tüm analizleri görebilir
 */
async function getCvAnalysis(req, res) {
  try {
    const documentId = parseInt(req.params.documentId);
    if (isNaN(documentId)) return res.status(400).json({ error: 'Gecersiz documentId.' });

    // Önce Document kaydını kontrol et
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return res.status(404).json({ error: 'Belge bulunamadi.' });
    if (doc.type !== 'CV') return res.status(404).json({ error: 'Bu belge bir CV degil.' });

    // Yetki kontrolü: kullanıcı kendi CV'sine, admin hepsine erişebilir
    if (req.user.role !== 'ADMIN' && doc.userId !== req.user.id) {
      return res.status(403).json({ error: 'Bu analize erisim yetkiniz yok.' });
    }

    const analysis = await prisma.cvAnalysis.findUnique({ where: { documentId } });
    if (!analysis) return res.status(404).json({ error: 'Analiz henuz tamamlanmadi veya bulunamadi.' });

    res.json({
      documentId: analysis.documentId,
      alignmentScore: analysis.alignmentScore,
      detectedSkills: analysis.detectedSkills,
      skillGap: analysis.skillGap,
      analysisVersion: analysis.analysisVersion,
      updatedAt: analysis.updatedAt,
    });
  } catch (err) {
    console.error('getCvAnalysis:', err);
    res.status(500).json({ error: 'Sunucu hatasi.' });
  }
}

// ─── Yardımcı: Kullanıcı genel skoru hesapla ────────────────────────────────
async function getUserOverallScore(userId) {
  const [evals, courses] = await Promise.all([
    prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }),
    prisma.userCourse.findMany({ where: { userId } }),
  ]);
  const kpiScore = calcKpiScore(evals[0] || null);
  const courseScore = calcCourseScore(courses.map(c => c.courseId));
  return calcOverallScore(kpiScore, courseScore, null);
}

// ─── 1. Anomali Tespiti ──────────────────────────────────────────────────────
/**
 * GET /api/ai/admin/anomalies
 * Skoru düşen kullanıcıları, ekip ortalamalarını ve en çok gelişenleri döner
 */
async function getAnomalies(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        evaluations: { orderBy: { createdAt: 'desc' }, take: 2 },
        courses: true,
        profile: { select: { avatarUrl: true, fullName: true } },
      },
    });

    const ANOMALY_THRESHOLD = 15; // puan düşüşü eşiği

    const anomalies = [];
    const topGrowers = [];
    const kpiAverages = { kalite: [], sorumluluk: [], birligi: [], zaman: [] };

    for (const user of users) {
      const evals = user.evaluations;
      const completedIds = user.courses.map(c => c.courseId);
      const currentScore = calcOverallScore(
        calcKpiScore(evals[0] || null),
        calcCourseScore(completedIds),
        null
      );

      // KPI ortalamalarına ekle
      if (evals[0]) {
        kpiAverages.kalite.push(evals[0].kalite || 0);
        kpiAverages.sorumluluk.push(evals[0].sorumluluk || 0);
        kpiAverages.birligi.push(evals[0].birligi || 0);
        kpiAverages.zaman.push(evals[0].zaman || 0);
      }

      // Anomali: 2 değerlendirme varsa karşılaştır
      if (evals.length >= 2) {
        const prevScore = calcOverallScore(calcKpiScore(evals[1]), calcCourseScore(completedIds), null);
        const drop = prevScore - currentScore;
        if (drop >= ANOMALY_THRESHOLD) {
          anomalies.push({
            userId: user.id,
            username: user.username,
            fullName: user.profile?.fullName || user.username,
            avatarUrl: user.profile?.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.username)}`,
            prevScore,
            currentScore,
            drop,
            severity: drop >= 30 ? 'high' : 'medium',
          });
        }
      }

      topGrowers.push({ userId: user.id, username: user.username, fullName: user.profile?.fullName || user.username, avatarUrl: user.profile?.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.username)}`, currentScore });
    }

    // Ekip KPI ortalamaları
    const avg = (arr) => arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
    const teamKpiAvg = {
      kalite: avg(kpiAverages.kalite),
      sorumluluk: avg(kpiAverages.sorumluluk),
      birligi: avg(kpiAverages.birligi),
      zaman: avg(kpiAverages.zaman),
    };

    // Ekip ortalamasının 20 puan altındaki kriterler
    const weakTeamKpis = Object.entries(teamKpiAvg)
      .filter(([, v]) => v > 0 && v < 3)
      .map(([k, v]) => ({ kpi: k, avg: v }));

    // En çok gelişen 5 kullanıcı (en yüksek skor)
    const top5 = topGrowers.sort((a, b) => b.currentScore - a.currentScore).slice(0, 5);

    res.json({
      anomalies: anomalies.sort((a, b) => b.drop - a.drop),
      teamKpiAvg,
      weakTeamKpis,
      topGrowers: top5,
      analyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('getAnomalies:', err);
    res.status(500).json({ error: 'Anomali analizi sirasinda hata.' });
  }
}

// ─── 2. Çalışan Karşılaştırma ────────────────────────────────────────────────
/**
 * GET /api/ai/admin/compare/:userId
 * Bir çalışanı benzer profildeki çalışanlarla karşılaştırır
 */
async function compareEmployee(req, res) {
  try {
    const targetId = parseInt(req.params.userId);
    if (isNaN(targetId)) return res.status(400).json({ error: 'Gecersiz userId.' });

    const [targetUser, allUsers] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetId },
        include: {
          evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
          courses: true,
          profile: { select: { careerGoal: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: 'USER' },
        include: {
          evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
          courses: true,
          profile: { select: { careerGoal: true, fullName: true } },
        },
      }),
    ]);

    if (!targetUser) return res.status(404).json({ error: 'Kullanici bulunamadi.' });

    const targetEval = targetUser.evaluations[0] || null;
    const targetCourseIds = targetUser.courses.map(c => c.courseId);
    const targetKpiScore = calcKpiScore(targetEval);
    const targetCourseScore = calcCourseScore(targetCourseIds);
    const targetOverall = calcOverallScore(targetKpiScore, targetCourseScore, null);
    const targetGoal = targetUser.profile?.careerGoal || null;

    // Benzer kariyer hedefli kullanıcılar (kendisi hariç)
    const peers = allUsers
      .filter(u => u.id !== targetId && u.role === 'USER')
      .map(u => {
        const eval_ = u.evaluations[0] || null;
        const courseIds = u.courses.map(c => c.courseId);
        const kpi = calcKpiScore(eval_);
        const course = calcCourseScore(courseIds);
        const overall = calcOverallScore(kpi, course, null);
        return { userId: u.id, username: u.username, kpiScore: kpi, courseScore: course, overallScore: overall, careerGoal: u.profile?.careerGoal };
      });

    // Benzer profil: aynı kariyer hedefi varsa öncelikli, yoksa tüm kullanıcılar
    const similarPeers = peers.filter(p => p.careerGoal === targetGoal);
    const comparisonGroup = similarPeers.length >= 2 ? similarPeers : peers;

    if (comparisonGroup.length === 0) {
      return res.json({ comparison: null, message: 'Karsilastirilacak yeterli kullanici yok.' });
    }

    const avgOverall = comparisonGroup.reduce((s, p) => s + p.overallScore, 0) / comparisonGroup.length;
    const avgKpi = comparisonGroup.reduce((s, p) => s + p.kpiScore, 0) / comparisonGroup.length;
    const avgCourse = comparisonGroup.reduce((s, p) => s + p.courseScore, 0) / comparisonGroup.length;

    const rank = comparisonGroup.filter(p => p.overallScore > targetOverall).length + 1;
    const percentile = Math.round(((comparisonGroup.length - rank + 1) / (comparisonGroup.length + 1)) * 100);

    // KPI bazlı karşılaştırma
    const kpiComparison = {};
    if (targetEval) {
      const kpiFields = ['kalite', 'sorumluluk', 'birligi', 'zaman'];
      kpiFields.forEach(field => {
        const peerAvg = comparisonGroup
          .map(p => {
            const u = allUsers.find(u => u.id === p.userId);
            return u?.evaluations[0]?.[field] || 0;
          })
          .reduce((s, v, _, arr) => s + v / arr.length, 0);
        kpiComparison[field] = {
          target: targetEval[field] || 0,
          peerAvg: parseFloat(peerAvg.toFixed(2)),
          diff: parseFloat(((targetEval[field] || 0) - peerAvg).toFixed(2)),
        };
      });
    }

    res.json({
      target: {
        userId: targetId,
        username: targetUser.username,
        fullName: targetUser.profile?.fullName || targetUser.username,
        avatarUrl: targetUser.profile?.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${targetUser.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(targetUser.username)}`,
        overallScore: targetOverall,
        kpiScore: targetKpiScore,
        courseScore: targetCourseScore,
        careerGoal: targetGoal,
      },
      peerGroup: {
        size: comparisonGroup.length,
        type: similarPeers.length >= 2 ? 'same_career_goal' : 'all_users',
        avgOverall: Math.round(avgOverall),
        avgKpi: Math.round(avgKpi),
        avgCourse: Math.round(avgCourse),
      },
      rank,
      percentile,
      kpiComparison,
      insight: targetOverall > avgOverall
        ? `${targetUser.username} benzer profildeki calisanlarin %${percentile}'lik diliminde yer aliyor. Ortalamadan ${Math.round(targetOverall - avgOverall)} puan yukarda.`
        : `${targetUser.username} benzer profildeki calisanlarin ortalamasinin ${Math.round(avgOverall - targetOverall)} puan altinda. Gelisim alanlari belirlenmeli.`,
    });
  } catch (err) {
    console.error('compareEmployee:', err);
    res.status(500).json({ error: 'Karsilastirma sirasinda hata.' });
  }
}

// ─── 3. Haftalık Rapor ───────────────────────────────────────────────────────
/**
 * GET /api/ai/admin/weekly-report
 * Son 7 günün özet raporunu döner
 */
async function getWeeklyReport(req, res) {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [newUsers, newCourses, newEvals, newCVs] = await Promise.all([
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: oneWeekAgo } } }),
      prisma.userCourse.count({ where: { completedAt: { gte: oneWeekAgo } } }),
      prisma.evaluation.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.document.count({ where: { type: 'CV', createdAt: { gte: oneWeekAgo } } }),
    ]);

    // Bu hafta en çok kurs tamamlayan kullanıcılar
    const topLearners = await prisma.userCourse.groupBy({
      by: ['userId'],
      where: { completedAt: { gte: oneWeekAgo } },
      _count: { courseId: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: 3,
    });

    const topLearnersWithNames = await Promise.all(
      topLearners.map(async (tl) => {
        const user = await prisma.user.findUnique({ where: { id: tl.userId }, select: { username: true, profile: { select: { fullName: true, avatarUrl: true } } } });
        return {
          username: user?.username || 'Bilinmiyor',
          fullName: user?.profile?.fullName || user?.username || 'Bilinmiyor',
          avatarUrl: user?.profile?.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.username || 'user')}`,
          coursesCompleted: tl._count.courseId,
        };
      })
    );

    // Bekleyen CV sayısı
    const pendingCVs = await prisma.document.count({ where: { type: 'CV', status: 'pending' } });

    // Toplam kullanıcı sayısı
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });

    res.json({
      period: { from: oneWeekAgo.toISOString(), to: new Date().toISOString() },
      summary: {
        newUsers,
        newCoursesCompleted: newCourses,
        newEvaluations: newEvals,
        newCVsUploaded: newCVs,
        pendingCVs,
        totalUsers,
      },
      topLearners: topLearnersWithNames,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('getWeeklyReport:', err);
    res.status(500).json({ error: 'Haftalik rapor olusturulurken hata.' });
  }
}

// ─── 4. Akıllı Bildirim Sistemi ──────────────────────────────────────────────
/**
 * POST /api/ai/admin/send-smart-notifications
 * Tüm uygun kullanıcılara kişiselleştirilmiş bildirim gönderir
 */
async function sendSmartNotifications(req, res) {
  try {
    const INACTIVITY_DAYS = 30;
    const KPI_DROP_THRESHOLD = 10;
    const RESEND_DAYS = 7; // Aynı tetikleyici için minimum bekleme süresi

    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        courses: { orderBy: { completedAt: 'desc' }, take: 1 },
        evaluations: { orderBy: { createdAt: 'desc' }, take: 2 },
        profile: { select: { fullName: true, careerGoal: true } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    let sent = 0;
    const results = [];

    for (const user of users) {
      const name = user.profile?.fullName || user.username;
      const careerGoal = user.profile?.careerGoal || 'kariyer hedefiniz';
      const notifTitles = user.notifications.map(n => n.title);

      // ── Tetikleyici 1: 30 gün hareketsizlik ──
      const lastCourse = user.courses[0];
      const daysSinceLastCourse = lastCourse
        ? Math.floor((Date.now() - new Date(lastCourse.completedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const inactivityTitle = 'Eğitim Hatırlatması';
      const alreadySentInactivity = user.notifications.some(n =>
        n.title === inactivityTitle &&
        (Date.now() - new Date(n.createdAt).getTime()) < RESEND_DAYS * 24 * 60 * 60 * 1000
      );

      if (daysSinceLastCourse >= INACTIVITY_DAYS && !alreadySentInactivity) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: inactivityTitle,
            message: `Merhaba ${name}! ${daysSinceLastCourse} gündür eğitim tamamlamadınız. ${careerGoal} hedefinize ulaşmak için eğitim platformuna geri dönmenizi öneririz. Sizi bekleyen kurslar var!`,
          },
        });
        sent++;
        results.push({ userId: user.id, username: user.username, type: 'inactivity', days: daysSinceLastCourse });
      }

      // ── Tetikleyici 2: KPI düşüşü ──
      if (user.evaluations.length >= 2) {
        const current = user.evaluations[0];
        const prev = user.evaluations[1];
        const kpiFields = ['kalite', 'sorumluluk', 'birligi', 'zaman'];
        const kpiNames = { kalite: 'İş Kalitesi', sorumluluk: 'Sorumluluk', birligi: 'İş Birliği', zaman: 'Zaman Yönetimi' };
        const kpiCourseRec = { kalite: 'Kalite Yönetimi', sorumluluk: 'Profesyonel Sorumluluk', birligi: 'Etkili Takım Çalışması', zaman: 'Zaman Yönetimi ve Önceliklendirme' };

        for (const field of kpiFields) {
          const drop = ((prev[field] || 0) - (current[field] || 0)) * 20; // 1-5 skalasını 0-100'e çevir
          if (drop >= KPI_DROP_THRESHOLD) {
            const kpiTitle = `${kpiNames[field]} Uyarısı`;
            const alreadySent = user.notifications.some(n =>
              n.title === kpiTitle &&
              (Date.now() - new Date(n.createdAt).getTime()) < RESEND_DAYS * 24 * 60 * 60 * 1000
            );
            if (!alreadySent) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title: kpiTitle,
                  message: `Merhaba ${name}! Son değerlendirmede ${kpiNames[field]} puanınızda düşüş tespit edildi. "${kpiCourseRec[field]}" eğitimini tamamlamanızı öneririz. Gelişiminiz bizim için önemli!`,
                },
              });
              sent++;
              results.push({ userId: user.id, username: user.username, type: 'kpi_drop', field, drop });
              break; // Kullanıcıya aynı anda birden fazla KPI bildirimi gönderme
            }
          }
        }
      }

      // ── Tetikleyici 3: Genel skor düşük ──
      if (user.evaluations.length > 0) {
        const eval_ = user.evaluations[0];
        const kpiScore = calcKpiScore(eval_);
        const courseScore = calcCourseScore(user.courses.map(c => c.courseId));
        const overall = calcOverallScore(kpiScore, courseScore, null);

        if (overall < 50) {
          const lowScoreTitle = 'Gelişim Fırsatı';
          const alreadySent = user.notifications.some(n =>
            n.title === lowScoreTitle &&
            (Date.now() - new Date(n.createdAt).getTime()) < RESEND_DAYS * 24 * 60 * 60 * 1000
          );
          if (!alreadySent) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: lowScoreTitle,
                message: `Merhaba ${name}! Genel yetkinlik skorunuz %${overall} seviyesinde. ${careerGoal} hedefinize ulaşmak için eğitim ve değerlendirme süreçlerine aktif katılımınız büyük fark yaratacak. Hadi başlayalım!`,
              },
            });
            sent++;
            results.push({ userId: user.id, username: user.username, type: 'low_score', score: overall });
          }
        }
      }
    }

    res.json({
      message: `${sent} kullaniciya bildirim gonderildi.`,
      sent,
      details: results,
    });
  } catch (err) {
    console.error('sendSmartNotifications:', err);
    res.status(500).json({ error: 'Bildirim gonderimi sirasinda hata.' });
  }
}

// ─── 5. Kariyer Yolu Simülasyonu ─────────────────────────────────────────────
/**
 * POST /api/ai/simulate
 * "Eğer X kursu tamamlarsan ve KPI'ın Y olursa Z ayda W seviyeye ulaşırsın"
 * Body: { targetCourses: string[], targetKpi: { kalite, sorumluluk, birligi, zaman } }
 */
async function simulateCareerPath(req, res) {
  try {
    const userId = req.user.id;
    const { targetCourses = [], targetKpi = null } = req.body;

    const [evaluations, courses, profile] = await Promise.all([
      prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.userCourse.findMany({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
    ]);

    const latestEval = evaluations[0] || null;
    const completedIds = courses.map(c => c.courseId);

    // Mevcut skorlar
    const currentKpiScore    = calcKpiScore(latestEval);
    const currentCourseScore = calcCourseScore(completedIds);
    const currentOverall     = calcOverallScore(currentKpiScore, currentCourseScore, null);
    const currentLevel       = getLevel(currentOverall);

    // Simüle edilmiş kurs listesi (mevcut + hedef)
    const simulatedCourseIds = [...new Set([...completedIds, ...targetCourses])];
    const simulatedCourseScore = calcCourseScore(simulatedCourseIds);

    // Simüle edilmiş KPI (verilmişse kullan, yoksa mevcut)
    const simKpi = targetKpi || latestEval;
    const simulatedKpiScore = calcKpiScore(simKpi);

    const simulatedOverall = calcOverallScore(simulatedKpiScore, simulatedCourseScore, null);
    const simulatedLevel   = getLevel(simulatedOverall);

    const scoreDiff = simulatedOverall - currentOverall;

    // Tahmini süre hesapla
    function estimateMonths(scoreDiff, courseCount) {
      if (scoreDiff <= 0) return 0;
      // Her kurs ~2 hafta, her 10 puan KPI artışı ~1 ay
      const courseMonths = courseCount * 0.5;
      const kpiMonths = targetKpi ? Math.abs(simulatedKpiScore - currentKpiScore) / 10 : 0;
      return Math.max(1, Math.round(courseMonths + kpiMonths));
    }

    const newCourseCount = targetCourses.filter(id => !completedIds.includes(id)).length;
    const estimatedMonths = estimateMonths(scoreDiff, newCourseCount);

    // Hangi kursların yeni olduğunu bul
    const newCourses = targetCourses
      .filter(id => !completedIds.includes(id))
      .map(id => {
        const catMap = {
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
        return { id, title: catMap[id] || id };
      });

    // Seviye atladı mı?
    const levelUp = simulatedLevel.label !== currentLevel.label && scoreDiff > 0;

    res.json({
      current: {
        overallScore: currentOverall,
        kpiScore: currentKpiScore,
        courseScore: currentCourseScore,
        level: currentLevel,
        completedCourseCount: completedIds.length,
      },
      simulated: {
        overallScore: simulatedOverall,
        kpiScore: simulatedKpiScore,
        courseScore: simulatedCourseScore,
        level: simulatedLevel,
        completedCourseCount: simulatedCourseIds.length,
      },
      delta: {
        scoreDiff,
        levelUp,
        estimatedMonths,
        newCourses,
        newCourseCount,
      },
      message: scoreDiff > 0
        ? `${newCourseCount} kurs tamamlayıp KPI puanlarını iyileştirirsen yaklaşık ${estimatedMonths} ayda ${simulatedLevel.label} seviyesine ulaşabilirsin!`
        : 'Mevcut seçimler skoru değiştirmiyor. Farklı kurslar veya daha yüksek KPI hedefleri dene.',
    });
  } catch (err) {
    console.error('simulateCareerPath:', err);
    res.status(500).json({ error: 'Simülasyon sırasında hata oluştu.' });
  }
}

// ─── 6. Benchmark Raporu ─────────────────────────────────────────────────────
/**
 * GET /api/ai/benchmark
 * Kullanıcıyı benzer kariyer hedefli kullanıcılarla karşılaştırır
 */
async function getBenchmark(req, res) {
  try {
    const userId = req.user.id;

    const [myEvals, myCourses, myProfile, allUsers] = await Promise.all([
      prisma.evaluation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 1 }),
      prisma.userCourse.findMany({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.user.findMany({
        where: { role: 'USER' },
        include: {
          evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
          courses: true,
          profile: { select: { careerGoal: true } },
        },
      }),
    ]);

    const myKpi    = calcKpiScore(myEvals[0] || null);
    const myCourse = calcCourseScore(myCourses.map(c => c.courseId));
    const myScore  = calcOverallScore(myKpi, myCourse, null);
    const myGoal   = myProfile?.careerGoal || null;

    // Tüm kullanıcıların skorları
    const peers = allUsers
      .filter(u => u.id !== userId)
      .map(u => {
        const kpi    = calcKpiScore(u.evaluations[0] || null);
        const course = calcCourseScore(u.courses.map(c => c.courseId));
        const score  = calcOverallScore(kpi, course, null);
        return { score, careerGoal: u.profile?.careerGoal || null };
      });

    // Aynı kariyer hedefli grup
    const sameGoalPeers = peers.filter(p => p.careerGoal === myGoal);
    const compGroup = sameGoalPeers.length >= 3 ? sameGoalPeers : peers;
    const groupType = sameGoalPeers.length >= 3 ? 'same_career' : 'all_users';

    if (compGroup.length === 0) {
      return res.json({ available: false, message: 'Karşılaştırma için yeterli kullanıcı yok.' });
    }

    const scores = compGroup.map(p => p.score).sort((a, b) => a - b);
    const avg    = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    const median = scores[Math.floor(scores.length / 2)];
    const min    = scores[0];
    const max    = scores[scores.length - 1];

    // Yüzdelik dilim
    const below = scores.filter(s => s < myScore).length;
    const percentile = Math.round((below / scores.length) * 100);

    // Dağılım (histogram için 5 bucket)
    const buckets = [
      { range: '0-20',   count: scores.filter(s => s < 20).length },
      { range: '20-40',  count: scores.filter(s => s >= 20 && s < 40).length },
      { range: '40-60',  count: scores.filter(s => s >= 40 && s < 60).length },
      { range: '60-80',  count: scores.filter(s => s >= 60 && s < 80).length },
      { range: '80-100', count: scores.filter(s => s >= 80).length },
    ];

    // KPI karşılaştırması
    const kpiFields = ['kalite', 'sorumluluk', 'birligi', 'zaman'];
    const kpiLabels = { kalite: 'İş Kalitesi', sorumluluk: 'Sorumluluk', birligi: 'İş Birliği', zaman: 'Zaman Yönetimi' };
    const kpiComparison = {};

    for (const field of kpiFields) {
      const peerVals = allUsers
        .filter(u => u.id !== userId && u.evaluations[0])
        .map(u => u.evaluations[0][field] || 0);
      const peerAvg = peerVals.length > 0
        ? parseFloat((peerVals.reduce((s, v) => s + v, 0) / peerVals.length).toFixed(2))
        : 0;
      const myVal = myEvals[0]?.[field] || 0;
      kpiComparison[field] = {
        label: kpiLabels[field],
        mine: myVal,
        peerAvg,
        diff: parseFloat((myVal - peerAvg).toFixed(2)),
      };
    }

    res.json({
      available: true,
      myScore,
      groupType,
      groupSize: compGroup.length,
      careerGoal: myGoal,
      stats: { avg, median, min, max },
      percentile,
      distribution: buckets,
      kpiComparison,
      insight: percentile >= 75
        ? `Tebrikler! ${groupType === 'same_career' ? 'Aynı kariyer hedefindeki' : 'Tüm'} kullanıcıların %${percentile}'lik diliminde yer alıyorsun.`
        : percentile >= 50
        ? `${groupType === 'same_career' ? 'Aynı kariyer hedefindeki' : 'Tüm'} kullanıcıların ortalamasının üzerindesin (%${percentile}. dilim).`
        : `${groupType === 'same_career' ? 'Aynı kariyer hedefindeki' : 'Tüm'} kullanıcıların %${100 - percentile}'i senden yüksek skor alıyor. Gelişim için fırsat var!`,
    });
  } catch (err) {
    console.error('getBenchmark:', err);
    res.status(500).json({ error: 'Benchmark hesaplanırken hata oluştu.' });
  }
}

// ─── 7. Doğal Dil Kariyer Hedefi Eşleştirme ─────────────────────────────────
/**
 * POST /api/ai/match-career
 * Serbest metin girişinden kariyer hedefi eşleştirir
 * Body: { text: string }
 */
async function matchCareerGoal(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 2) {
      return res.status(400).json({ error: 'Metin çok kısa.' });
    }

    const { resolveCareerGoal, CAREER_SKILL_MAP } = require('../lib/cv-analyzer');

    // Önce direkt eşleştir
    const direct = resolveCareerGoal(text.trim());

    // Tüm kariyer hedeflerine benzerlik skoru ver
    const lower = text.toLowerCase();
    const allGoals = Object.keys(CAREER_SKILL_MAP);

    // Kelime bazlı benzerlik
    const scored = allGoals.map(goal => {
      const goalLower = goal.toLowerCase();
      const goalWords = goalLower.split(/\s+/);
      const inputWords = lower.split(/\s+/);

      let score = 0;
      // Tam eşleşme
      if (goalLower === lower) score += 100;
      // Kısmi eşleşme
      goalWords.forEach(gw => {
        if (lower.includes(gw) && gw.length > 2) score += 20;
      });
      inputWords.forEach(iw => {
        if (goalLower.includes(iw) && iw.length > 2) score += 15;
      });

      return { goal, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    const suggestions = scored.slice(0, 5).map(s => s.goal);
    const bestMatch = direct || (scored[0]?.score >= 15 ? scored[0].goal : null);

    res.json({
      input: text,
      bestMatch,
      suggestions,
      confidence: bestMatch ? (direct ? 'high' : 'medium') : 'low',
      message: bestMatch
        ? `"${text}" için en uygun kariyer hedefi: ${bestMatch}`
        : 'Eşleşme bulunamadı. Lütfen listeden bir kariyer hedefi seçin.',
    });
  } catch (err) {
    console.error('matchCareerGoal:', err);
    res.status(500).json({ error: 'Kariyer hedefi eşleştirme hatası.' });
  }
}

module.exports = {
  analyzeUser,
  getCvAnalysis,
  getCourseRecommendations,
  getAnomalies,
  compareEmployee,
  getWeeklyReport,
  sendSmartNotifications,
  simulateCareerPath,
  getBenchmark,
  matchCareerGoal,
};
