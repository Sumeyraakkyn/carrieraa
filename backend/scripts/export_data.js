require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      evaluations: true,
      courses: {
        include: {
          course: true
        }
      }
    }
  });

  const validUsers = users.filter(u => u.profile);

  // 1. dataset.json (Geriye dönük uyumluluk ve ML Model eğitimi için)
  const mlDataset = validUsers.filter(u => u.evaluations.length > 0).map(u => {
    const evals = u.evaluations[0];
    const avgScore = (evals.kalite + evals.sorumluluk + evals.birligi + evals.zaman) / 4;
    
    let department = "Bilinmiyor";
    try {
      let exp = u.profile.experiences;
      if (typeof exp === 'string') exp = JSON.parse(exp);
      if (exp && exp.length > 0) department = exp[0].title || exp[0].position || "Bilinmiyor";
    } catch(e) {}

    // Model eğitiminin bozulmaması için seviyeleri temizleyip sadece beceri adlarını gönderiyoruz
    const cleanSkills = (u.profile.skills || []).map(s => s.split(':')[0]);

    return {
      userId: u.id,
      department: department,
      skills: cleanSkills,
      careerGoal: u.profile.careerGoal || "",
      performanceScore: avgScore
    };
  });

  // 2. IK_YBS_Egitim_Gecmisi
  const egitimGecmisi = [];
  validUsers.forEach(u => {
    try {
      let edus = u.profile.educations;
      if (typeof edus === 'string') edus = JSON.parse(edus);
      if (Array.isArray(edus)) {
        edus.forEach(edu => {
          if (edu.school || edu.department) {
            egitimGecmisi.push({
              Calisan_ID: u.id,
              Mezuniyet: edu.degree || "Lisans",
              "Universite Bolum": `${edu.school || ""} ${edu.department || ""}`.trim() || "Belirtilmemiş",
              "Mezuniyet Yili": parseInt(edu.graduationYear) || 2020
            });
          }
        });
      }
    } catch (e) {}
  });

  // 3. IK_YBS_Performans_Notlari
  const performansNotlari = [];
  validUsers.forEach(u => {
    u.evaluations.forEach(evals => {
      const avgScore = (evals.kalite + evals.sorumluluk + evals.birligi + evals.zaman) / 4;
      // 1-5 aralığındaki puanı 0-100 aralığına çekiyoruz
      const score100 = Math.round(avgScore * 20);
      
      // Tarihten dönemi tahmin etmeye çalışıyoruz, varsayılan 2024-Q1
      let donem = "2024-Q1";
      if (evals.tarih) {
        const parts = evals.tarih.split('.');
        const year = parts[2] || "2024";
        const month = parseInt(parts[1]) || 1;
        const q = Math.ceil(month / 3);
        donem = `${year}-Q${q}`;
      }

      performansNotlari.push({
        Calisan_ID: u.id,
        Donem: donem,
        Performans_Skoru: score100
      });
    });
  });

  // 4. IK_YBS_Kariyer_Anketi
  const kariyerAnketi = [];
  validUsers.forEach(u => {
    // Kariyer hedefine göre mantıklı bir gelişim alanı belirliyoruz
    let gelisimAlani = "Liderlik";
    const goal = (u.profile.careerGoal || "").toLowerCase();
    if (goal.includes("geliştirici") || goal.includes("mühendis")) {
      gelisimAlani = "Yazılım Mimarisi";
    } else if (goal.includes("veri") || goal.includes("analist")) {
      gelisimAlani = "Makine Öğrenmesi";
    } else if (goal.includes("ürün") || goal.includes("yönetici")) {
      gelisimAlani = "Ürün Stratejisi";
    } else if (goal.includes("tasarım") || goal.includes("ui")) {
      gelisimAlani = "Kullanıcı Araştırması";
    }

    kariyerAnketi.push({
      Calisan_ID: u.id,
      Kariyer_Hedefi: u.profile.careerGoal || "Belirtilmemiş",
      Gelisim_Alanlari: gelisimAlani
    });
  });

  // 5. IK_YBS_Beceri_Etiketleri
  const beceriEtiketleri = [];
  validUsers.forEach(u => {
    const skills = u.profile.skills || [];
    skills.forEach(s => {
      if (s) {
        const parts = s.split(':');
        const beceri = parts[0];
        const seviye = parts[1] || "Orta";
        beceriEtiketleri.push({
          Calisan_ID: u.id,
          Beceri: beceri,
          Seviye: seviye
        });
      }
    });
  });

  // 6. LMS_Verileri
  const lmsVerileri = [];
  validUsers.forEach(u => {
    u.courses.forEach(uc => {
      lmsVerileri.push({
        Calisan_ID: u.id,
        Kurs_Adi: uc.course.name || uc.courseId,
        Tamamlanan: "Tamamlandı",
        Harcanan_Sure: uc.timeSpent || "2 saat",
        Skor: uc.score || 85
      });
    });
  });

  // Dosya Yazma İşlemleri
  const aiServicePath = path.join(__dirname, '../../ai-service');
  
  fs.writeFileSync(path.join(aiServicePath, 'dataset.json'), JSON.stringify(mlDataset, null, 2));
  fs.writeFileSync(path.join(aiServicePath, 'IK_YBS_Egitim_Gecmisi.json'), JSON.stringify(egitimGecmisi, null, 2));
  fs.writeFileSync(path.join(aiServicePath, 'IK_YBS_Performans_Notlari.json'), JSON.stringify(performansNotlari, null, 2));
  fs.writeFileSync(path.join(aiServicePath, 'IK_YBS_Kariyer_Anketi.json'), JSON.stringify(kariyerAnketi, null, 2));
  fs.writeFileSync(path.join(aiServicePath, 'IK_YBS_Beceri_Etiketleri.json'), JSON.stringify(beceriEtiketleri, null, 2));
  fs.writeFileSync(path.join(aiServicePath, 'LMS_Verileri.json'), JSON.stringify(lmsVerileri, null, 2));

  console.log(`✅ Başarıyla 6 adet veri seti dışa aktarıldı:`);
  console.log(`  - dataset.json (${mlDataset.length} kayıt)`);
  console.log(`  - IK_YBS_Egitim_Gecmisi.json (${egitimGecmisi.length} kayıt)`);
  console.log(`  - IK_YBS_Performans_Notlari.json (${performansNotlari.length} kayıt)`);
  console.log(`  - IK_YBS_Kariyer_Anketi.json (${kariyerAnketi.length} kayıt)`);
  console.log(`  - IK_YBS_Beceri_Etiketleri.json (${beceriEtiketleri.length} kayıt)`);
  console.log(`  - LMS_Verileri.json (${lmsVerileri.length} kayıt)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
