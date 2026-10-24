require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = ["Yazılım Geliştirme", "İnsan Kaynakları", "Veri Analizi", "Ürün Yönetimi", "Satış & Pazarlama"];
const SKILLS_LIST = ["Python", "JavaScript", "React", "Node.js", "Makine Öğrenmesi", "Veri Analizi", "Proje Yönetimi", "SQL", "İletişim", "Liderlik", "Yapay Zeka"];
const CAREER_GOALS = ["Kıdemli Geliştirici", "Veri Bilimci", "Ürün Yöneticisi", "Takım Lideri", "CTO"];
const FIRST_NAMES = ["Ahmet", "Ayşe", "Mehmet", "Fatma", "Ali", "Zeynep", "Can", "Elif", "Burak", "Ceren", "Öykü", "Enes"];
const LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan"];
const LEVELS = ["Başlangıç", "Orta", "İleri"];

const MOCK_COURSES = [
  { id: "zaman-yonetimi", category: "Kişisel Gelişim", name: "Zaman Yönetimi" },
  { id: "liderlik-1", category: "Liderlik", name: "Etkili Liderlik Becerileri" },
  { id: "python-giris", category: "Yazılım", name: "Python ile Programlamaya Giriş" },
  { id: "react-temelleri", category: "Yazılım", name: "React ve Modern Web Geliştirme" },
  { id: "veri-analizi-101", category: "Veri Bilimi", name: "SQL ve Veri Analizi Temelleri" }
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
  return array[getRandomInt(0, array.length - 1)];
}

function getRandomSkillsWithLevels(count) {
  const shuffled = SKILLS_LIST.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(s => `${s}:${getRandomItem(LEVELS)}`);
}

async function main() {
  console.log("Mevcut veriler temizleniyor...");
  await prisma.userCourse.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.cvAnalysis.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.course.deleteMany({});
  
  console.log("Mock dersler oluşturuluyor...");
  for (const c of MOCK_COURSES) {
    await prisma.course.create({ data: c });
  }

  console.log("Mock (Sahte) veri seti oluşturuluyor... (Hedef: 100 Çalışan)");
  
  // Şifre: password123
  const passwordHash = await bcrypt.hash('password123', 10);

  for (let i = 1; i <= 100; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const username = `mockuser_${i}_${Math.random().toString(36).substring(7)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@sirket.com`;
    const department = getRandomItem(DEPARTMENTS);
    const careerGoal = getRandomItem(CAREER_GOALS);
    const skills = getRandomSkillsWithLevels(getRandomInt(2, 6)); // Herkese seviyeli 2-6 arası yetkinlik
    
    // Rastgele geçmiş performans puanları (1.0 ile 5.0 arası)
    const kalite = getRandomInt(20, 50) / 10;
    const sorumluluk = getRandomInt(20, 50) / 10;
    const birligi = getRandomInt(20, 50) / 10;
    const zaman = getRandomInt(20, 50) / 10;

    // Rastgele ders tamamlama verileri (1-3 ders)
    const courseCount = getRandomInt(1, 3);
    const shuffledCourses = [...MOCK_COURSES].sort(() => 0.5 - Math.random());
    const userCourses = [];
    for (let j = 0; j < courseCount; j++) {
      userCourses.push({
        courseId: shuffledCourses[j].id,
        score: getRandomInt(70, 100),
        timeSpent: `${getRandomInt(1, 6)} saat`,
        completedAt: new Date(Date.now() - getRandomInt(1, 30) * 24 * 60 * 60 * 1000)
      });
    }

    // Veritabanına kayıt işlemi (İç içe ilişkiler - Profile, Evaluation ve UserCourse)
    await prisma.user.create({
      data: {
        username: username,
        passwordHash: passwordHash,
        role: "USER",
        profile: {
          create: {
            fullName: fullName,
            email: email,
            city: "İstanbul",
            careerGoal: careerGoal,
            skills: skills,
            experiences: [{ company: "Mevcut Şirket", title: department, years: getRandomInt(1, 10) }],
            educations: [{ school: "Ankara Üniversitesi", department: "İktisat", degree: "Lisans", startYear: "2016", graduationYear: "2020" }]
          }
        },
        evaluations: {
          create: [
            {
              kalite: kalite,
              sorumluluk: sorumluluk,
              birligi: birligi,
              zaman: zaman,
              tarih: "01.01.2024",
              saat: "10:00:00",
              yonetici: "Sistem Yöneticisi",
              yorumlar: "Yapay zeka analizleri için otomatik oluşturulmuş mock performans verisi."
            }
          ]
        },
        courses: {
          create: userCourses
        }
      }
    });

    if (i % 10 === 0) {
      console.log(`${i}/100 kullanıcı oluşturuldu.`);
    }
  }

  // Standta her zaman bilinen hesaplarla hızlı demo yapılabilsin diye sabit iki hesap.
  const standPasswordHash = await bcrypt.hash('Carriera2026!', 10);
  await prisma.user.create({
    data: {
      username: 'stand.kullanici',
      passwordHash: standPasswordHash,
      role: 'USER',
      profile: {
        create: {
          fullName: 'Stand Demo Kullanıcısı',
          email: 'stand.kullanici@carriera.local',
          city: 'Mersin',
          careerGoal: 'Kıdemli Geliştirici',
          skills: ['Python:Orta', 'React:Başlangıç', 'İletişim:İleri'],
        },
      },
      courses: { create: [{ courseId: 'python-giris', score: 92, timeSpent: '3 saat' }] },
    },
  });
  await prisma.user.create({
    data: {
      username: 'stand.yonetici',
      passwordHash: standPasswordHash,
      role: 'ADMIN',
      profile: { create: { fullName: 'Stand Demo Yöneticisi', email: 'stand.yonetici@carriera.local', skills: [] } },
    },
  });

  console.log("✅ Başarılı: 100 mock çalışan ile stand demo hesapları oluşturuldu!");
  console.log("   Kullanıcı: stand.kullanici / Carriera2026!");
  console.log("   Yönetici: stand.yonetici / Carriera2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
