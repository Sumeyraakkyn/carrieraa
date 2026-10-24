# YBS Bitirme Projesi — Vize Ödevi 2025–2026 Bahar
## Carriera: Yapay Zeka Destekli Kariyer Gelişim Platformu
### Backend & Veri Seti Raporu

---

## 1. Proje Özeti

Carriera, kurumsal çalışanların kariyer gelişimini takip etmek, yöneticilerin performans değerlendirmesi yapmasını sağlamak ve yapay zeka destekli kişiselleştirilmiş öneriler sunmak amacıyla geliştirilmiş bir web platformudur. Hedef kitle; orta ve büyük ölçekli şirketlerdeki İK departmanları, yöneticiler ve çalışanlardır.

Platform üç temel sorunu çözmektedir: (1) Çalışan performansının nesnel ve sistematik biçimde ölçülememesi, (2) Kariyer gelişim süreçlerinin kişiselleştirilememesi, (3) CV ile kariyer hedefi arasındaki uyumsuzlukların tespit edilememesi. Carriera bu sorunlara kural tabanlı bir yapay zeka motoru, KPI değerlendirme sistemi ve CV analiz modülü ile yanıt vermektedir.

---

## 2. Ekip Rolü ve Görev Dağılımı

**Rol:** Backend Geliştirici & Veri Seti Sorumlusu

**Sprint Özeti:**

| Sprint | Süre | Tamamlanan Görevler |
|--------|------|---------------------|
| Sprint 1 | 2 hafta | Prisma şeması, kimlik doğrulama (JWT), temel CRUD endpoint'leri |
| Sprint 2 | 2 hafta | Dosya yükleme (Multer), profil yönetimi, bildirim sistemi |
| Sprint 3 | 2 hafta | YZ motoru (ai.controller.js), CV analiz modülü (cv-analyzer.js) |
| Sprint 4 | 2 hafta | Admin analitik endpoint'leri, anomali tespiti, haftalık rapor |

**Kullanılan Araçlar:** Git/GitHub (versiyon kontrolü), Prisma Studio (veritabanı yönetimi), Postman (API testi)

---

## 3. Teknik İlerleme

### 3.1 ER Diyagramı ve Tablo İlişkileri

Veritabanı PostgreSQL üzerinde Prisma ORM ile yönetilmektedir. Toplam 9 tablo bulunmaktadır:

```
USER (1) ──────────── (1) PROFILE
  │                        (userId FK, @unique)
  │
  ├── (1:N) EVALUATION      (userId FK)
  │         kalite, sorumluluk, birligi, zaman (Float)
  │         yonetici (String), tarih, saat
  │
  ├── (1:N) USER_COURSE      (userId FK, courseId FK)
  │         @@unique([userId, courseId])
  │         completedAt (DateTime)
  │
  ├── (1:N) DOCUMENT         (userId FK)
  │         type: CV | CERTIFICATE | AVATAR
  │         status: pending | approved | rejected
  │    └── (1:1) CV_ANALYSIS (documentId FK @unique)
  │               alignmentScore (Int, 0-100)
  │               detectedSkills (Json)
  │               skillGap (String[])
  │
  ├── (1:N) NOTIFICATION     (userId FK)
  │         title, message, read (Boolean)
  │
  ├── (1:N) PASSWORD_RESET   (userId FK)
  │         code (String), expiresAt, used (Boolean)
  │
  └── (1:N) CV_ANALYSIS      (userId FK)

COURSE (1) ──── (N) USER_COURSE
  id: String (örn: "liderlik-1")
  category, name, description

ENUM Role: USER | ADMIN
```

**Tablo İlişkileri:**

| İlişki | Tür | Açıklama |
|--------|-----|----------|
| User → Profile | 1:1 | Her kullanıcının en fazla 1 profili |
| User → Evaluation | 1:N | Birden fazla KPI değerlendirmesi alabilir |
| User → UserCourse | 1:N | Birden fazla kurs tamamlayabilir |
| User → Document | 1:N | Birden fazla belge yükleyebilir |
| User → Notification | 1:N | Birden fazla bildirimi olabilir |
| Document → CvAnalysis | 1:1 | Her CV belgesi için tek analiz kaydı |
| Course → UserCourse | 1:N | N:M köprü tablosu (userId+courseId UNIQUE) |

---

### 3.2 API Endpoint Listesi (Giriş/Çıkış)

#### Kimlik Doğrulama — `/api/auth`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| POST | `/register` | `{ username, password, isAdmin? }` | `{ message, user: {id, username, role} }` | Herkese açık |
| POST | `/login` | `{ username, password }` | `{ message, token, user }` | Herkese açık |
| GET | `/me` | Bearer token | `{ id, username, role }` | Token gerekli |
| POST | `/forgot-password` | `{ username }` | `{ message, devCode? }` | Herkese açık |
| POST | `/verify-code` | `{ username, code }` | `{ message, resetToken }` | Herkese açık |
| POST | `/reset-password` | `{ resetToken, newPassword }` | `{ message }` | Herkese açık |
| POST | `/change-password` | `{ currentPassword, newPassword }` | `{ message }` | Token gerekli |

#### Profil — `/api/profile`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| GET | `/me` | — | `{ fullName, email, skills[], experiences, careerGoal, avatarUrl, ... }` | Token gerekli |
| POST | `/` | `{ fullName, email, phone, city, careerGoal, skills[], experiences, educations, ... }` | `{ message, profile }` | Token gerekli |

#### Kurslar — `/api/courses`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| POST | `/complete` | `{ courseId }` | `{ message, completedCourse }` | Token gerekli |
| GET | `/me` | — | `[ { courseId, completedAt } ]` | Token gerekli |

#### Değerlendirme — `/api/evaluations`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| POST | `/` | `{ userId, kalite, sorumluluk, birligi, zaman, yorumlar }` | `{ message, evaluation }` | ADMIN |
| GET | `/me` | — | `[ { kalite, sorumluluk, birligi, zaman, tarih, yonetici } ]` | Token gerekli |

#### Dosya Yükleme — `/api/upload` ve `/api/documents`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| POST | `/api/upload` | `multipart: document (file), type` | `{ message, document: {id, fileUrl, fileName} }` | Token gerekli |
| GET | `/api/documents/me` | — | `[ { id, type, fileName, fileUrl, status } ]` | Token gerekli |

#### Yapay Zeka — `/api/ai`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| GET | `/analyze` | — | `{ overallScore, level, kpiScore, courseScore, strengths[], improvements[], careerPath, radarData }` | Token gerekli |
| GET | `/cv-analysis/:documentId` | — | `{ alignmentScore, detectedSkills, skillGap[], analysisVersion }` | Token gerekli |
| GET | `/course-recommendations` | — | `{ recommendations: [{courseId, title, reason, score}] }` | Token gerekli |
| GET | `/admin/anomalies` | — | `{ anomalies[], topGrowers[], teamKpiAvg, weakTeamKpis[] }` | ADMIN |
| GET | `/admin/compare/:userId` | — | `{ target, peerGroup, rank, percentile, kpiComparison, insight }` | ADMIN |
| GET | `/admin/weekly-report` | — | `{ summary, topLearners[], period }` | ADMIN |
| POST | `/admin/send-smart-notifications` | — | `{ sent, details[] }` | ADMIN |

#### Admin — `/api/admin`

| Method | Endpoint | Giriş | Çıkış | Yetki |
|--------|----------|-------|-------|-------|
| GET | `/cvs` | — | `[ { id, username, fullName, status, aiScore, skillGapSummary[] } ]` | ADMIN |
| POST | `/cvs/status` | `{ documentId, status }` | `{ message, document }` | ADMIN |
| GET | `/dashboard-stats` | — | `{ pendingCount, recentUsers[] }` | ADMIN |

---

### 3.3 Güvenlik Yaklaşımı

**JWT Kimlik Doğrulama:** Kullanıcı giriş yaptığında `id`, `username` ve `role` bilgilerini içeren 24 saatlik JWT token üretilir. Her korumalı endpoint `authMiddleware` üzerinden geçer.

**Şifre Güvenliği:** Kullanıcı şifreleri `bcryptjs` ile `saltRounds: 10` kullanılarak hash'lenir. Düz metin şifre hiçbir zaman veritabanında saklanmaz.

**Rol Tabanlı Yetkilendirme:** İki katmanlı middleware zinciri kullanılır:
- `authMiddleware`: Token geçerliliğini doğrular
- `adminMiddleware`: `role === 'ADMIN'` kontrolü yapar

Admin endpoint'leri her zaman `authMiddleware → adminMiddleware` zincirinden geçer.

**Şifre Sıfırlama:** 6 haneli tek kullanımlık kod, 15 dakika geçerlilik süresi, kullanıldıktan sonra `used: true` işaretlenir. Reset token ayrıca 10 dakika geçerli JWT olarak üretilir.

**Dosya Yükleme Güvenliği:** Multer ile MIME type kontrolü (PDF, JPEG, PNG, DOCX), maksimum 5 MB sınırı, dosya adları `timestamp + random` ile yeniden adlandırılır.

**CORS:** Production ortamında yalnızca `FRONTEND_URL` env değişkeninde tanımlı origin'e izin verilir.

---

### 3.4 Çalışan Kod Örneği

**Örnek 1: JWT ile Giriş ve Token Üretimi**

```javascript
// backend/controllers/auth.controller.js
const login = async (req, res) => {
  const { username, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: 'Kullanici bulunamadi!' });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(400).json({ error: 'Gecersiz sifre!' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ message: 'Giris basarili!', token, user: { id: user.id, username: user.username, role: user.role } });
};
```

**Örnek 2: CV Analiz Motoru — Beceri Tespiti ve Uyum Skoru**

```javascript
// backend/lib/cv-analyzer.js
function calculateAlignmentScore(detectedSkills, careerGoal) {
  const resolved = resolveCareerGoal(careerGoal); // fuzzy matching
  const required = resolved ? CAREER_SKILL_MAP[resolved] : null;
  if (!required) return 0;

  const allDetected = [
    ...(detectedSkills.technical || []),
    ...(detectedSkills.languages || []),
    ...(detectedSkills.certificates || []),
  ].map(s => s.toLowerCase());

  const matchedCount = required.filter(req =>
    allDetected.includes(req.toLowerCase())
  ).length;

  let score = Math.round((matchedCount / required.length) * 100);
  
  // Sertifika bonusu: +5 puan (max 100)
  if ((detectedSkills.certificates || []).length > 0) {
    score = Math.min(100, score + 5);
  }
  return score;
}
```

**Örnek 3: YZ Genel Skor Hesaplama**

```javascript
// backend/controllers/ai.controller.js
function calcOverallScore(kpiScore, courseScore, potentialScores) {
  // KPI: %55, Eğitim: %45 (quiz yoksa)
  // KPI: %50, Eğitim: %35, Potansiyel: %15 (quiz varsa)
  if (potentialScores) {
    const potAvg = (potentialScores.liderlik + potentialScores.analitik +
                    potentialScores.yaratici + potentialScores.uyumlu) / 4;
    return Math.round(Math.min(kpiScore * 0.50 + courseScore * 0.35 + potAvg * 0.15, 100));
  }
  return Math.round(Math.min(kpiScore * 0.55 + courseScore * 0.45, 100));
}
```

---

## 4. Veri Seti

### 4.1 Veri Kaynağı ve Toplama Süreci

Carriera platformunda iki tür veri kaynağı kullanılmaktadır:

**A. Sistem İçi Üretilen Veriler (Birincil Kaynak)**

Platform kullanıcıları tarafından doğrudan üretilen verilerdir:

| Veri Türü | Kaynak | Açıklama |
|-----------|--------|----------|
| KPI Değerlendirmeleri | Yönetici girişi | kalite, sorumluluk, birliği, zaman (1-5 skala) |
| Kurs Tamamlama Kayıtları | Kullanıcı etkileşimi | 13 kurs, 4 kategori |
| CV Dosyaları | Kullanıcı yüklemesi | PDF/DOCX formatında |
| Profil Bilgileri | Kullanıcı girişi | Kariyer hedefi, beceriler, deneyim |
| Potansiyel Quiz Cevapları | Kullanıcı etkileşimi | 12 soruluk test, A/B/C/D cevapları |

**B. Kural Tabanlı YZ Veri Sözlükleri (İkincil Kaynak)**

CV analiz motoru için manuel olarak derlenen sözlükler:

- `TECHNICAL_SKILLS`: 120+ teknik beceri (programlama dilleri, framework'ler, araçlar)
- `LANGUAGE_SKILLS`: 32 dil (Türkçe ve İngilizce karşılıklarıyla)
- `CERTIFICATE_KEYWORDS`: 40+ sertifika adı ve anahtar kelime
- `CAREER_SKILL_MAP`: 15 kariyer hedefi için gerekli beceri listeleri

Bu sözlükler, sektör standartları ve iş ilanı analizleri referans alınarak oluşturulmuştur.

---

### 4.2 Veri Temizleme Adımları

**CV Metin Çıkarma ve Temizleme:**

PDF dosyalarından metin çıkarılırken encoding sorunları yaşanmaktadır. `pdf-parse` kütüphanesi bazı PDF fontlarını yanlış yorumlamakta, bu durum anlamsız karakter dizileri üretmektedir.

**Önce (ham metin):**
```
cgorvergi  ┼Şahin  <%^a  Murat  ─▒l─▒m
```

**Sonra (temizlenmiş metin):**
```
Murat Sahin yazilim muhendisi
```

Uygulanan temizleme adımları:

```javascript
function cleanText(raw) {
  let text = raw.replace(/[\r\n\t]+/g, ' ');      // Satır sonlarını boşluğa çevir
  text = text.replace(/\s{2,}/g, ' ');             // Çoklu boşlukları teke indir
  text = text.replace(/[^\w\s\-\.\/\+#@çğıöşüÇĞİÖŞÜ]/gi, ' '); // Özel karakterleri temizle
  return text.trim();
}
```

**Boyut Karşılaştırması (örnek CV dosyası):**

| Aşama | Karakter Sayısı | Açıklama |
|-------|-----------------|----------|
| Ham PDF metni | ~4.200 karakter | Encoding bozuklukları dahil |
| Temizlenmiş metin | ~3.100 karakter | Anlamsız karakterler çıkarıldı |
| Azalma | ~26% | Gürültü verisi temizlendi |

**Beceri Tespitinde Word Boundary Kontrolü:**

Kısa beceri adları (≤3 karakter: `c`, `r`, `go`) yanlış eşleşme üretmekteydi. Örneğin "vergi" kelimesi içindeki "r" harfi `r` programlama dili olarak tespit ediliyordu.

**Önce:** `vergi` → `r` (yanlış pozitif)
**Sonra:** Regex word boundary kontrolü ile `r` yalnızca bağımsız kelime olarak eşleşiyor.

```javascript
function matchesSkill(skill) {
  if (skill.length <= 3) {
    const regex = new RegExp(
      `(?<![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])${skill}(?![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])`, 'i'
    );
    return regex.test(lowerText);
  }
  return lowerText.includes(skill.toLowerCase());
}
```

---

### 4.3 Görselleştirme ve Yorumlar

**Görselleştirme 1: Genel Yetkinlik Skoru Hesaplama Ağırlıkları**

```
Genel Skor = KPI Skoru × %55 + Eğitim Skoru × %45
             (Potansiyel quiz yapılmamışsa)

Genel Skor = KPI Skoru × %50 + Eğitim Skoru × %35 + Potansiyel × %15
             (Potansiyel quiz tamamlanmışsa)

KPI Skoru Bileşenleri:
  İş Kalitesi    ████████████ %30
  Sorumluluk     ██████████   %25
  İş Birliği     ██████████   %25
  Zaman Yönetimi ████████     %20

Eğitim Skoru Bileşenleri:
  Çeviklik & İnovasyon  ████████████ %30 (4 kurs)
  Liderlik Gelişimi     ██████████   %25 (3 kurs)
  Stratejik Planlama    ██████████   %25 (3 kurs)
  Bütçe Yönetimi        ████████     %20 (3 kurs)
```

**Yorum:** Çeviklik kategorisine en yüksek ağırlık verilmesinin nedeni, dijital dönüşüm sürecinde bu yetkinliğin kritik önem taşımasıdır. KPI'da iş kalitesinin %30 ağırlık taşıması, çıktı odaklı performans değerlendirmesini yansıtmaktadır.

---

**Görselleştirme 2: CV Analizi — Kariyer Hedefi Uyum Skoru Dağılımı**

```
Kariyer Hedefi: Yazılım Mühendisi
Gerekli Beceriler (15 adet):
  javascript, python, git, sql, react, node.js,
  typescript, docker, java, c#, c++, agile, scrum, jira

CV'de Tespit Edilen Beceriler:
  ✓ jira          ✓ agile
  ✓ proje yönetimi ✓ bütçe yönetimi
  ✗ javascript    ✗ python
  ✗ react         ✗ docker

Uyum Skoru Hesabı:
  Eşleşen: 2 / 15 = %13
  Sertifika bonusu: +0 (sertifika yok)
  Sonuç: %13

Skill Gap (Eksik Beceriler):
  javascript, python, git, sql, react,
  node.js, typescript, docker, java, c#, c++, scrum
```

**Yorum:** Kullanıcının CV'si proje yönetimi odaklı olup yazılım geliştirme becerilerini içermemektedir. Bu durum, kariyer hedefi ile mevcut profil arasındaki uyumsuzluğu açıkça ortaya koymaktadır. Sistem bu boşluğu tespit ederek kullanıcıya teknik beceri geliştirme önerileri sunmaktadır.

---

**Görselleştirme 3: Akıllı Eğitim Öneri Motoru — Puanlama Sistemi**

```
Kurs Öneri Puanlama Algoritması:

Her tamamlanmamış kurs için puan hesaplanır:

  +40 puan → Kariyer hedefiyle ilişkili kategoride ise
  +30 puan → Düşük KPI kriteri (< 3/5) ile örtüşüyorsa
  +20 puan → CV'deki skill gap ile örtüşüyorsa
  +15 puan → Kategoriye hiç başlanmamışsa
  + 8 puan → Kategoride ilerleme %50'nin altındaysa
  +10 puan → Kategorinin sıradaki kursu ise

Örnek Hesaplama (Kullanıcı: Yazılım Mühendisi, Zaman KPI: 2/5):

  Kurs: "Agile ve Scrum Temelleri" (cevik kategorisi)
    +40 (kariyer hedefi: cevik ilişkili)
    +30 (zaman KPI düşük → cevik kategorisi)
    +15 (kategoriye hiç başlanmamış)
    +10 (kategorinin ilk kursu)
    = 95 puan → 1. Öneri

  Kurs: "Stratejik Düşünme ve Planlama" (stratejik)
    +40 (kariyer hedefi: stratejik ilişkili)
    +15 (kategoriye hiç başlanmamış)
    +10 (kategorinin ilk kursu)
    = 65 puan → 2. Öneri
```

**Yorum:** Çok kriterli puanlama sistemi, tek bir faktöre bağlı kalmak yerine kullanıcının tüm profilini (kariyer hedefi, KPI zayıflıkları, CV eksiklikleri, kurs geçmişi) birlikte değerlendirmektedir. Bu yaklaşım, öneri kalitesini önemli ölçüde artırmaktadır.

---

## 5. Ekipler Arası Entegrasyon

**Frontend ile Entegrasyon:**
- Tüm API endpoint'leri `Authorization: Bearer <token>` header'ı ile çağrılmaktadır
- Frontend `localStorage`'da JWT token saklayarak her istekte göndermektedir
- `useAuthGuard` hook'u her korumalı sayfada `/api/auth/me` endpoint'ine ping atarak token geçerliliğini doğrulamaktadır

**Ortak Kararlar:**
- Kullanıcı rolleri `USER` ve `ADMIN` olarak iki seviyede tutulmuştur
- API yanıtları tutarlı `{ message, data }` formatında döndürülmektedir
- Dosya URL'leri `/uploads/filename` formatında, backend base URL'i ile birleştirilerek kullanılmaktadır

---

## 6. Risk ve Sorunlar

| Sorun | Etki | Çözüm |
|-------|------|-------|
| PDF encoding bozukluğu | CV analiz skoru yanlış hesaplanıyordu | `cleanText()` fonksiyonu ile metin temizleme eklendi |
| Kariyer hedefi eşleşmemesi | "Yazılım Mühendisi" → skor 0 çıkıyordu | `resolveCareerGoal()` fuzzy matching fonksiyonu eklendi |
| Kısa beceri yanlış eşleşmesi | "vergi" → "r" dili olarak tespit ediliyordu | Word boundary regex kontrolü eklendi |
| Prisma 7.x uyumsuzluğu | `url` field schema'da desteklenmiyor | `prisma.config.ts` ile datasource URL yönetimi |
| `module.exports` çakışması | Backend başlamıyordu | Çift tanımlı export kaldırıldı |

---

## 7. İkinci Yarı Planı

| Hafta | Görev |
|-------|-------|
| 1-2 | Neon PostgreSQL'e geçiş, Render'a backend deploy |
| 3-4 | Vercel'e frontend deploy, production ortam testleri |
| 5-6 | Potansiyel quiz YZ yorumlayıcısı (4 boyutlu kişilik profili) |
| 7-8 | Akıllı bildirim sistemi otomasyonu (cron job ile periyodik çalışma) |
| 9-10 | Performans optimizasyonu, API rate limiting eklenmesi |
| 11-12 | Kapsamlı test yazımı, dokümantasyon tamamlama |

---

## Kaynakça

Prisma. (2024). *Prisma ORM Documentation*. https://www.prisma.io/docs

Express.js. (2024). *Express 5.x API Reference*. https://expressjs.com/en/5x/api.html

JSON Web Tokens. (2024). *JWT Introduction*. https://jwt.io/introduction

bcrypt.js. (2024). *bcryptjs npm package*. https://www.npmjs.com/package/bcryptjs

Multer. (2024). *Multer: Node.js middleware for multipart/form-data*. https://github.com/expressjs/multer

pdf-parse. (2024). *pdf-parse npm package*. https://www.npmjs.com/package/pdf-parse

mammoth. (2024). *Mammoth .docx to HTML converter*. https://github.com/mwilliamson/mammoth.js

fast-check. (2024). *Property-based testing for JavaScript*. https://fast-check.io

---

*Dosya adı: SahinMurat_Proje_Vize2025*
*Format: Arial 11pt · 1,5 satır aralığı · APA 7 kaynakça*
