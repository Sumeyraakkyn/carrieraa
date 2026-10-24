'use strict';

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

// ---------------------------------------------------------------------------
// Beceri sözlükleri
// ---------------------------------------------------------------------------

const TECHNICAL_SKILLS = [
  // Programlama dilleri
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'c', 'go', 'rust',
  'kotlin', 'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'perl', 'bash',
  'powershell', 'dart', 'lua', 'haskell', 'elixir', 'clojure',
  // Web framework & kütüphaneler
  'react', 'angular', 'vue', 'next.js', 'nuxt', 'svelte', 'express', 'fastapi',
  'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'nestjs',
  // Veritabanları
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
  'oracle', 'mssql', 'cassandra', 'dynamodb', 'firebase',
  // DevOps & Bulut
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
  'jenkins', 'github actions', 'ci/cd', 'linux', 'windows server', 'networking',
  // Araçlar
  'git', 'jira', 'figma', 'adobe xd', 'sketch', 'tableau', 'power bi',
  'excel', 'sap', 'sap hr', 'erp', 'crm', 'ms project',
  // Veri bilimi
  'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
  'statistics', 'machine learning', 'deep learning', 'nlp',
  // Metodolojiler
  'agile', 'scrum', 'kanban', 'devops', 'bpmn', 'uml',
  // Diğer teknik
  'html', 'css', 'rest api', 'graphql', 'microservices', 'node.js',
  'prototyping', 'user research', 'analytics', 'seo', 'sem',
  'google analytics', 'social media', 'content marketing',
  'product management', 'veri analizi', 'raporlama',
  'proje yönetimi', 'risk yönetimi', 'bütçe yönetimi',
  'finansal analiz', 'muhasebe', 'vergi',
  'ik yönetimi', 'işe alım', 'performans yönetimi', 'iş hukuku',
];

const SOFT_SKILLS = [
  // Türkçe
  'iletişim', 'takım çalışması', 'liderlik', 'problem çözme', 'analitik düşünme',
  'yaratıcılık', 'esneklik', 'adaptasyon', 'zaman yönetimi', 'organizasyon',
  'müzakere', 'sunum', 'empati', 'motivasyon', 'inisiyatif', 'özgüven',
  'eleştirel düşünme', 'karar verme', 'stres yönetimi', 'çatışma yönetimi',
  'mentorluk', 'koçluk', 'delegasyon', 'stratejik düşünme',
  // İngilizce
  'communication', 'teamwork', 'leadership', 'problem solving', 'analytical thinking',
  'creativity', 'flexibility', 'adaptability', 'time management', 'organization',
  'negotiation', 'presentation', 'empathy', 'motivation', 'initiative',
  'critical thinking', 'decision making', 'stress management', 'conflict resolution',
  'mentoring', 'coaching', 'delegation', 'strategic thinking',
];

const LANGUAGE_SKILLS = [
  'ingilizce', 'almanca', 'fransızca', 'ispanyolca', 'italyanca',
  'rusça', 'arapça', 'çince', 'japonca', 'korece', 'portekizce',
  'hollandaca', 'lehçe', 'türkçe', 'farsça', 'hintçe',
  'english', 'german', 'french', 'spanish', 'italian', 'russian',
  'arabic', 'chinese', 'japanese', 'korean', 'portuguese', 'dutch',
  'polish', 'turkish', 'persian', 'hindi',
];

const CERTIFICATE_KEYWORDS = [
  'aws certified', 'azure certified', 'google cloud certified', 'gcp certified',
  'aws solutions architect', 'aws developer', 'aws sysops',
  'azure administrator', 'azure developer', 'azure architect',
  'pmp', 'prince2', 'capm', 'pmi', 'agile certified', 'scrum master',
  'csm', 'psm', 'safe', 'itil',
  'cissp', 'ceh', 'comptia security+', 'comptia a+', 'comptia network+',
  'cism', 'cisa', 'oscp',
  'google analytics certified', 'tableau certified', 'power bi certified',
  'databricks certified', 'snowflake certified',
  'cisco ccna', 'cisco ccnp', 'oracle certified', 'salesforce certified',
  'hubspot certified', 'google ads certified', 'facebook blueprint',
  'six sigma', 'lean six sigma', 'iso', 'certificate', 'sertifika',
  'sertifikası', 'certified', 'certification', 'coursera', 'udemy',
  'linkedin learning', 'google career certificate', 'microsoft learn',
];

// Dil yetkinlik seviyeleri
const LANGUAGE_LEVELS = [
  'a1', 'a2', 'b1', 'b2', 'c1', 'c2',
  'başlangıç', 'orta', 'ileri', 'akıcı', 'anadil',
  'beginner', 'intermediate', 'advanced', 'fluent', 'native',
  'temel', 'iyi', 'çok iyi', 'mükemmel',
];

// ---------------------------------------------------------------------------
// Kariyer hedefi → gerekli beceriler
// ---------------------------------------------------------------------------

const CAREER_SKILL_MAP = {
  'Yazılım Geliştirici':        ['javascript', 'python', 'git', 'sql', 'react', 'node.js', 'typescript', 'docker'],
  'Yazılım Mühendisi':          ['javascript', 'python', 'git', 'sql', 'react', 'node.js', 'typescript', 'docker', 'java', 'c#', 'agile', 'scrum'],
  'Software Engineer':          ['javascript', 'python', 'git', 'sql', 'react', 'node.js', 'typescript', 'docker'],
  'Frontend Geliştirici':       ['javascript', 'typescript', 'react', 'html', 'css', 'git', 'figma', 'rest api'],
  'Backend Geliştirici':        ['python', 'java', 'node.js', 'sql', 'postgresql', 'docker', 'git', 'rest api'],
  'Full Stack Geliştirici':     ['javascript', 'typescript', 'react', 'node.js', 'sql', 'docker', 'git', 'rest api'],
  'Mobil Geliştirici':          ['kotlin', 'swift', 'dart', 'react', 'git', 'firebase', 'rest api'],
  'DevOps Mühendisi':           ['docker', 'kubernetes', 'aws', 'linux', 'git', 'ci/cd', 'terraform', 'ansible'],
  'Veri Analisti':              ['python', 'sql', 'excel', 'tableau', 'power bi', 'statistics', 'r', 'pandas'],
  'Veri Bilimci':               ['python', 'sql', 'pandas', 'scikit-learn', 'tensorflow', 'statistics', 'r', 'machine learning'],
  'Veri Mühendisi':             ['python', 'sql', 'spark', 'aws', 'docker', 'postgresql', 'mongodb'],
  'Proje Yöneticisi':           ['proje yönetimi', 'agile', 'scrum', 'jira', 'ms project', 'risk yönetimi', 'pmp'],
  'Ürün Yöneticisi':            ['product management', 'agile', 'scrum', 'jira', 'figma', 'sql', 'analytics'],
  'UX/UI Tasarımcı':            ['figma', 'adobe xd', 'sketch', 'prototyping', 'user research', 'css', 'html'],
  'Grafik Tasarımcı':           ['figma', 'adobe xd', 'sketch', 'prototyping', 'user research'],
  'Pazarlama Uzmanı':           ['google analytics', 'seo', 'sem', 'social media', 'content marketing', 'crm'],
  'Dijital Pazarlama Uzmanı':   ['google analytics', 'seo', 'sem', 'social media', 'content marketing', 'google ads certified'],
  'İnsan Kaynakları Uzmanı':    ['ik yönetimi', 'işe alım', 'performans yönetimi', 'iş hukuku', 'sap hr'],
  'Finans Uzmanı':              ['excel', 'muhasebe', 'finansal analiz', 'erp', 'vergi', 'bütçe yönetimi'],
  'Muhasebeci':                 ['muhasebe', 'excel', 'vergi', 'erp', 'finansal analiz'],
  'İş Analisti':                ['sql', 'excel', 'bpmn', 'uml', 'jira', 'veri analizi', 'raporlama'],
  'Sistem Yöneticisi':          ['linux', 'windows server', 'networking', 'docker', 'kubernetes', 'aws', 'azure'],
  'Siber Güvenlik Uzmanı':      ['cissp', 'ceh', 'linux', 'networking', 'python', 'comptia security+'],
  'Kalite Güvence Uzmanı':      ['sql', 'python', 'jira', 'agile', 'selenium'],
  'Satış Uzmanı':               ['crm', 'excel', 'iletişim', 'müzakere', 'sunum'],
  'Diğer':                      ['excel', 'proje yönetimi'],
};

// ---------------------------------------------------------------------------
// Kariyer hedefi normalize
// ---------------------------------------------------------------------------

function resolveCareerGoal(careerGoal) {
  if (!careerGoal) return null;
  if (CAREER_SKILL_MAP[careerGoal]) return careerGoal;

  const lower = careerGoal.toLowerCase();
  const exactLower = Object.keys(CAREER_SKILL_MAP).find(k => k.toLowerCase() === lower);
  if (exactLower) return exactLower;

  const keywords = [
    { words: ['frontend', 'ön yüz', 'front-end'], goal: 'Frontend Geliştirici' },
    { words: ['backend', 'arka yüz', 'back-end'], goal: 'Backend Geliştirici' },
    { words: ['full stack', 'fullstack'], goal: 'Full Stack Geliştirici' },
    { words: ['mobil', 'mobile', 'android', 'ios'], goal: 'Mobil Geliştirici' },
    { words: ['devops', 'sre', 'altyapı', 'infrastructure'], goal: 'DevOps Mühendisi' },
    { words: ['yazılım', 'software', 'developer', 'geliştirici', 'mühendis', 'engineer'], goal: 'Yazılım Geliştirici' },
    { words: ['veri mühendis', 'data engineer'], goal: 'Veri Mühendisi' },
    { words: ['veri bilim', 'data scien'], goal: 'Veri Bilimci' },
    { words: ['veri', 'data', 'analiz', 'analyst'], goal: 'Veri Analisti' },
    { words: ['proje', 'project', 'manager', 'yönetici'], goal: 'Proje Yöneticisi' },
    { words: ['ürün', 'product'], goal: 'Ürün Yöneticisi' },
    { words: ['ux', 'ui', 'tasarım', 'design'], goal: 'UX/UI Tasarımcı' },
    { words: ['grafik', 'graphic'], goal: 'Grafik Tasarımcı' },
    { words: ['dijital pazarlama', 'digital marketing'], goal: 'Dijital Pazarlama Uzmanı' },
    { words: ['pazarlama', 'marketing'], goal: 'Pazarlama Uzmanı' },
    { words: ['insan kaynakları', 'hr', 'human resources', 'ik'], goal: 'İnsan Kaynakları Uzmanı' },
    { words: ['muhasebe', 'accounting', 'accountant'], goal: 'Muhasebeci' },
    { words: ['finans', 'finance'], goal: 'Finans Uzmanı' },
    { words: ['iş analisti', 'business analyst'], goal: 'İş Analisti' },
    { words: ['siber güvenlik', 'cyber security', 'cybersecurity', 'security'], goal: 'Siber Güvenlik Uzmanı' },
    { words: ['sistem', 'system', 'network', 'ağ'], goal: 'Sistem Yöneticisi' },
    { words: ['kalite', 'quality', 'qa', 'test'], goal: 'Kalite Güvence Uzmanı' },
    { words: ['satış', 'sales'], goal: 'Satış Uzmanı' },
  ];

  for (const { words, goal } of keywords) {
    if (words.some(w => lower.includes(w))) return goal;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Metin çıkarma
// ---------------------------------------------------------------------------

async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return cleanText(data.text);
  }

  if (ext === '.docx' || ext === '.doc') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return cleanText(result.value);
  }

  throw new Error(`Desteklenmeyen dosya formatı: ${ext}`);
}

function cleanText(raw) {
  if (!raw) return '';
  // Satırları korumak bölüm (dil/sertifika/proje) ayrıştırması için önemli.
  // URL'lerdeki ':' ve '?' de link çıkarma aşaması için korunur.
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[^\w\s\-\.\/\+#@:?=&%çğıöşüÇĞİÖŞÜ]/gi, ' ');

  return text
    .split('\n')
    .map(line => line.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Beceri tespiti
// ---------------------------------------------------------------------------

function matchesSkill(lowerText, skill) {
  if (skill.length <= 3) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])${escaped}(?![a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])`, 'i');
    return regex.test(lowerText);
  }
  return lowerText.includes(skill.toLowerCase());
}

function extractSkills(text) {
  const lowerText = text.toLowerCase();

  const technical    = TECHNICAL_SKILLS.filter(s => matchesSkill(lowerText, s));
  const softSkills   = SOFT_SKILLS.filter(s => matchesSkill(lowerText, s));
  const languages    = LANGUAGE_SKILLS.filter(s => matchesSkill(lowerText, s));
  const certificates = CERTIFICATE_KEYWORDS.filter(s => matchesSkill(lowerText, s));

  return { technical, softSkills, languages, certificates };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniqueBy(items, key) {
  return [...new Map(items.map(item => [key(item), item])).values()];
}

function extractLanguageDetails(text) {
  const groups = [
    { label: 'Türkçe', aliases: ['türkçe', 'turkish'] },
    { label: 'İngilizce', aliases: ['ingilizce', 'i̇ngilizce', 'english'] },
    { label: 'Almanca', aliases: ['almanca', 'german', 'deutsch'] },
    { label: 'Fransızca', aliases: ['fransızca', 'french'] },
    { label: 'İspanyolca', aliases: ['ispanyolca', 'spanish'] },
    { label: 'İtalyanca', aliases: ['italyanca', 'italian'] },
    { label: 'Arapça', aliases: ['arapça', 'arabic'] },
    { label: 'Rusça', aliases: ['rusça', 'russian'] },
  ];
  const levelPattern = '(a1|a2|b1|b2|c1|c2|başlangıç|temel|orta|iyi|çok iyi|ileri|akıcı|anadil|beginner|intermediate|advanced|fluent|native)';
  const details = [];
  const normalizedText = text.toLocaleLowerCase('tr');

  for (const group of groups) {
    const alias = group.aliases.find(item => matchesSkill(normalizedText, item));
    if (!alias) continue;
    const start = normalizedText.indexOf(alias);
    const nearbyText = normalizedText.slice(start, start + 45);
    const level = nearbyText.match(new RegExp(levelPattern, 'i'))?.[1];
    details.push({ language: group.label, level: level || 'Seviye belirtilmemiş' });
  }
  return uniqueBy(details, item => item.language);
}

function extractLinks(text) {
  const urls = (text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) || [])
    .map(value => value.replace(/[.,;]+$/, ''));
  const linkedin = urls.find(url => /linkedin\.com/i.test(url)) || text.match(/(?:linkedin\.com\/in\/)[\w-]+/i)?.[0] || null;
  const github = urls.find(url => /github\.com/i.test(url)) || text.match(/(?:github\.com\/)[\w-]+/i)?.[0] || null;
  const portfolio = urls.find(url => !/linkedin\.com|github\.com/i.test(url)) || null;
  return { linkedin, github, portfolio, urls: [...new Set(urls)] };
}

function extractCertificateDetails(text, keywordCertificates) {
  const details = [];
  const normalizedText = text.toLocaleLowerCase('tr');
  const headingPattern = /(?:^|\n)\s*(?:sertifikalar?|sertifikalarım|certificates?|certifications?|courses?)\b[\s:–-]*\n?([\s\S]{0,700})/;
  const section = normalizedText.match(headingPattern)?.[1] || '';
  const stopAt = section.search(/\n\s*(?:deneyim|experience|eğitim|education|beceri|skills?|diller|languages?|projeler|projects?|iletişim|contact)\b/);
  const candidates = (stopAt >= 0 ? section.slice(0, stopAt) : section)
    .split(/\n|•|\||\s{3,}/)
    .map(item => item.trim())
    .filter(item => item.length >= 3 && item.length <= 160)
    .slice(0, 8)
    .map(name => ({ name, source: 'CV sertifika bölümü' }));

  keywordCertificates.forEach(name => {
    const alreadyRepresented = details.some(detail => detail.name.toLocaleLowerCase('tr').includes(name.toLocaleLowerCase('tr')));
    if (!alreadyRepresented) details.push({ name, source: 'Anahtar kelime eşleşmesi' });
  });
  return uniqueBy([...candidates, ...details], item => item.name.toLocaleLowerCase('tr'));
}

function assessExtractionQuality(text) {
  const words = text.split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word));
  const compactness = text.length > 0 ? words.length / text.length : 0;
  const lowQuality = text.length < 120 || words.length < 30 || compactness < 0.015;
  return {
    wordCount: words.length,
    characterCount: text.length,
    confidence: lowQuality ? 'low' : words.length < 100 ? 'medium' : 'high',
    warning: lowQuality ? 'PDF metni düşük kalitede çıkarıldı. Taranmış veya karmaşık tasarımlı PDF için OCR destekli bir dosya ya da DOCX yükleyin.' : null,
  };
}

// ---------------------------------------------------------------------------
// Deneyim yılı tespiti
// ---------------------------------------------------------------------------

/**
 * CV metninden toplam deneyim yılını tahmin eder.
 * "5 yıl deneyim", "3+ years experience" gibi ifadeleri arar.
 * @returns {{ years: number, label: string }}
 */
function extractExperience(text) {
  const lower = text.toLowerCase();

  // "X yıl" veya "X+ yıl" veya "X years" gibi kalıplar
  const patterns = [
    /(\d+)\s*\+?\s*yıl(?:lık)?\s*(?:deneyim|tecrübe|iş)/i,
    /(\d+)\s*\+?\s*year[s]?\s*(?:of\s*)?(?:experience|exp)/i,
    /(?:deneyim|tecrübe|experience)[:\s]+(\d+)\s*\+?\s*(?:yıl|year)/i,
  ];

  let maxYears = 0;
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const y = parseInt(match[1]);
      if (y > maxYears && y < 50) maxYears = y; // 50+ yıl saçma olur
    }
  }

  let label;
  if (maxYears === 0)      label = 'Belirtilmemiş';
  else if (maxYears <= 2)  label = '0-2 yıl';
  else if (maxYears <= 5)  label = '3-5 yıl';
  else if (maxYears <= 10) label = '6-10 yıl';
  else                     label = '10+ yıl';

  // Eğitim tarihleri ve sertifika tarihleri deneyim yılı değildir. Açık bir
  // "X yıl deneyim" ifadesi yoksa tahmin üretmek yerine belirsiz bırakılır.
  return { years: maxYears, label, source: maxYears > 0 ? 'explicit' : 'not_specified' };
}

// ---------------------------------------------------------------------------
// Eğitim seviyesi tespiti
// ---------------------------------------------------------------------------

/**
 * CV metninden en yüksek eğitim seviyesini tespit eder.
 * @returns {{ level: string, score: number }} score: 0-3 (0=belirtilmemiş, 1=lisans, 2=yüksek lisans, 3=doktora)
 */
function extractEducationLevel(text) {
  const lower = text.toLowerCase();

  const levels = [
    { keywords: ['doktora', 'phd', 'ph.d', 'doctorate'], level: 'Doktora', score: 3 },
    { keywords: ['yüksek lisans', 'master', 'msc', 'm.sc', 'mba', 'yükseklisans'], level: 'Yüksek Lisans', score: 2 },
    { keywords: ['lisans', 'bachelor', 'b.sc', 'bsc', 'üniversite', 'university', 'fakülte', 'faculty', 'mühendislik fakültesi'], level: 'Lisans', score: 1 },
    { keywords: ['önlisans', 'associate', 'meslek yüksekokulu', 'myo'], level: 'Ön Lisans', score: 0.5 },
  ];

  let best = { level: 'Belirtilmemiş', score: 0 };
  for (const { keywords, level, score } of levels) {
    if (keywords.some(kw => lower.includes(kw))) {
      if (score > best.score) best = { level, score };
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Uyum skoru hesaplama (v2 — çok faktörlü)
// ---------------------------------------------------------------------------

/**
 * Tespit edilen beceriler + deneyim + eğitim → 0-100 uyum skoru
 *
 * Ağırlıklar:
 *   - Teknik beceri uyumu : %55
 *   - Soft skills bonusu  : %15 (max)
 *   - Deneyim bonusu      : %15 (max)
 *   - Eğitim bonusu       : %10 (max)
 *   - Sertifika bonusu    : %5  (max)
 */
function calculateAlignmentScore(detectedSkills, careerGoal, experience, education) {
  const resolved = resolveCareerGoal(careerGoal);
  const required = resolved ? CAREER_SKILL_MAP[resolved] : null;

  // Teknik beceri uyumu (%55)
  let techScore = 0;
  if (required && required.length > 0) {
    const allDetected = [
      ...(detectedSkills.technical || []),
      ...(detectedSkills.languages || []),
      ...(detectedSkills.certificates || []),
    ].map(s => s.toLowerCase());

    const matchedCount = required.filter(req => allDetected.includes(req.toLowerCase())).length;
    techScore = (matchedCount / required.length) * 55;
  }

  // Soft skills bonusu (%15) — her 2 soft skill için +3 puan, max 15
  const softCount = (detectedSkills.softSkills || []).length;
  const softBonus = Math.min(softCount * 3, 15);

  // Deneyim bonusu (%15)
  let expBonus = 0;
  if (experience) {
    if (experience.years >= 10)     expBonus = 15;
    else if (experience.years >= 6) expBonus = 12;
    else if (experience.years >= 3) expBonus = 8;
    else if (experience.years >= 1) expBonus = 4;
  }

  // Eğitim bonusu (%10)
  let eduBonus = 0;
  if (education) {
    if (education.score >= 3)      eduBonus = 10; // Doktora
    else if (education.score >= 2) eduBonus = 8;  // Yüksek Lisans
    else if (education.score >= 1) eduBonus = 5;  // Lisans
    else if (education.score > 0)  eduBonus = 2;  // Ön Lisans
  }

  // Sertifika bonusu (%5)
  const certBonus = (detectedSkills.certificates || []).length > 0 ? 5 : 0;

  const total = techScore + softBonus + expBonus + eduBonus + certBonus;
  return Math.min(100, Math.round(total));
}

// ---------------------------------------------------------------------------
// Skill Gap üretimi
// ---------------------------------------------------------------------------

function generateSkillGap(detectedSkills, careerGoal) {
  const resolved = resolveCareerGoal(careerGoal);
  const required = resolved ? CAREER_SKILL_MAP[resolved] : null;
  if (!required) return [];

  const allDetected = [
    ...(detectedSkills.technical || []),
    ...(detectedSkills.languages || []),
    ...(detectedSkills.certificates || []),
  ].map(s => s.toLowerCase());

  return required.filter(req => !allDetected.includes(req.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Özgeçmiş Optimizasyon Önerileri Üretici
// ---------------------------------------------------------------------------

function generateResumeOptimizationFeedback(detectedSkills, careerGoal, skillGap) {
  const resolved = resolveCareerGoal(careerGoal);
  if (!resolved) {
    return {
      message: "Lütfen CV analizi raporunuzu kariyer hedefiniz doğrultusunda optimize etmek için profilinize bir kariyer hedefi ekleyin.",
      projectSuggestions: [],
      keywordSuggestions: [],
      actionPlan: []
    };
  }

  const projectPool = {
    'Yazılım Geliştirici': [
      "Modern bir Frontend projesi (Örn: React ile Dashboard veya E-Ticaret Arayüzü)",
      "Node.js & Express.js veya Python & FastAPI ile REST API Geliştirme projesi",
      "Docker kullanarak konteynerize edilmiş çok katmanlı (multi-container) uygulama"
    ],
    'Yazılım Mühendisi': [
      "Veritabanı ilişkileri içeren CRUD uygulaması (Örn: PostgreSQL + Prisma ORM)",
      "Git/GitHub kullanarak takım çalışmasına uygun versiyon kontrol pratikleri",
      "Yazılım test pratikleri (Jest veya PyTest ile Unit/Integration Test yazımı)"
    ],
    'Frontend Geliştirici': [
      "Responsive (mobil uyumlu) modern arayüz tasarımı (HTML/CSS/Tailwind)",
      "Next.js ile Server-Side Rendering (SSR) kullanan bir web uygulaması",
      "Figma tasarımı üzerinden birebir pixel-perfect arayüz kodlama çalışması"
    ],
    'Backend Geliştirici': [
      "PostgreSQL veya MongoDB veritabanı şeması tasarımı ve optimizasyonu",
      "Redis kullanarak veri önbellekleme (Caching) ve hızlandırma çalışması",
      "Kullanıcı kimlik doğrulama sistemi (JWT/Session tabanlı Auth API)"
    ],
    'Full Stack Geliştirici': [
      "Next.js (Frontend) ve Express.js (Backend) kullanan uçtan uca web platformu",
      "SQL veritabanı bağlantısı ve Dockerize edilmiş dağıtım (deployment) süreci"
    ],
    'Veri Analisti': [
      "SQL ile karmaşık veri sorgulama ve rapor hazırlama senaryoları",
      "Pandas & Numpy kütüphaneleriyle eksik/kirli verilerin temizlenmesi çalışması",
      "Tableau veya Power BI ile interaktif yönetim (KPI) paneli görselleştirmesi"
    ],
    'Veri Bilimci': [
      "Scikit-Learn kullanarak denetimli makine öğrenmesi modeli (Sınıflandırma/Regresyon)",
      "Veri seti üzerinde Feature Engineering (özellik mühendisliği) uygulamaları",
      "Model tahmin performansını ölçen metrik raporları (R^2, MSE, Konfüzyon Matrisi)"
    ],
    'Proje Yöneticisi': [
      "Agile metodolojisine uygun Sprint planlama ve Scrum süreç simülasyonu",
      "Jira veya Trello üzerinde iş paketlerinin yönetimi ve Gantt şeması hazırlığı"
    ],
    'Ürün Yöneticisi': [
      "Yeni bir mobil uygulama için PRD (Product Requirement Document) yazımı",
      "Kullanıcı geri bildirim analizleri ve A/B test senaryolarının planlanması"
    ]
  };

  const keywordPool = {
    'Yazılım Geliştirici': ["REST API", "Git/GitHub", "Database Design", "MVC Architecture", "OOP (Nesne Yönelimli Programlama)"],
    'Yazılım Mühendisi': ["Software Architecture", "Agile/Scrum", "CI/CD Pipelines", "System Design", "Unit Testing"],
    'Frontend Geliştirici': ["Responsive Web Design", "DOM Manipulation", "CSS Frameworks (Tailwind)", "API Integration", "State Management (Redux/Zustand)"],
    'Backend Geliştirici': ["Database Optimization", "ORM (Prisma/Sequelize)", "Authentication & Security", "RESTful API Design", "Microservices"],
    'Veri Analisti': ["SQL Queries", "Data Visualisation", "Exploratory Data Analysis (EDA)", "Business Intelligence (BI)", "Excel Pivots"],
    'Veri Bilimci': ["Machine Learning Algorithms", "Statistical Analysis", "Data Preprocessing", "Supervised/Unsupervised Learning", "Python Data Science Stack"],
    'Proje Yöneticisi': ["Agile/Scrum Methodologies", "Sprint Planning", "Risk Management", "Stakeholder Communication", "Budget & Resource Planning"],
    'Ürün Yöneticisi': ["Product Lifecycle Management", "Product Roadmaps", "User Stories", "Market Research", "Feature Prioritization"]
  };

  const defaultProjects = [
    "Kişisel Github portfolyosunun oluşturulması ve projelerin dokümante edilmesi",
    "Sektörel gelişim için açık kaynak kodlu (Open Source) projelere katkıda bulunulması"
  ];
  const defaultKeywords = ["Problem Solving", "Teamwork", "Agile Mindset", "Analytical Thinking"];

  const projects = projectPool[resolved] || defaultProjects;
  const keywords = keywordPool[resolved] || defaultKeywords;

  // Skill gap doğrultusunda aksiyon planı
  const actionPlan = [];
  if (skillGap.length > 0) {
    const first2 = skillGap.slice(0, 2);
    actionPlan.push(`Öncelikli olarak eksik olan '${first2.join(', ')}' yetkinliklerini edinmek için eğitimleri başlatın.`);
  }
  actionPlan.push(`Hedeflediğiniz '${resolved}' rolü için önerilen en az 1 projeyi tamamlayıp GitHub profilinizde yayınlayın.`);
  actionPlan.push(`CV'nizin ATS (İşe Alım Arama Motorları) tarafından kolayca elenmesini engellemek için önerilen anahtar kelimeleri CV metninizde geçirin.`);

  return {
    targetRole: resolved,
    projectSuggestions: projects,
    keywordSuggestions: keywords,
    actionPlan: actionPlan
  };
}

// ---------------------------------------------------------------------------
// Ana orkestratör
// ---------------------------------------------------------------------------

async function analyzeCv(documentId, filePath, userId) {
  let rawText;
  try {
    rawText = await extractText(filePath);
  } catch (err) {
    console.error(`[cv-analyzer] Metin çıkarma hatası (documentId=${documentId}):`, err.message);
    return null;
  }

  // Kullanıcının kariyer hedefini oku
  let careerGoal = null;
  try {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    careerGoal = profile?.careerGoal ?? null;
  } catch (err) {
    console.error(`[cv-analyzer] Profil okuma hatası (userId=${userId}):`, err.message);
  }

  const baseSkills = extractSkills(rawText);
  const languageDetails = extractLanguageDetails(rawText);
  const certificateDetails = extractCertificateDetails(rawText, baseSkills.certificates);
  const detectedSkills = {
    ...baseSkills,
    // Arayüzde tek ve anlaşılır dil/sertifika adı gösterilir; ayrıntılar ayrıca saklanır.
    languages: uniqueBy([
      ...baseSkills.languages.map(language => ({ language })),
      ...languageDetails,
    ], item => item.language.toLocaleLowerCase('tr')).map(item => item.language),
    certificates: certificateDetails.map(certificate => certificate.name),
    languageDetails,
    certificateDetails,
    links: extractLinks(rawText),
    extractionQuality: assessExtractionQuality(rawText),
  };
  const experience     = extractExperience(rawText);
  const education      = extractEducationLevel(rawText);
  const resolvedGoal   = resolveCareerGoal(careerGoal);
  const alignmentScore = calculateAlignmentScore(detectedSkills, careerGoal, experience, education);
  const skillGap       = generateSkillGap(detectedSkills, careerGoal);
  const qualityScore   = calculateCvQualityScore(rawText, detectedSkills);
  const resumeFeedback = generateResumeOptimizationFeedback(detectedSkills, careerGoal, skillGap);

  console.log(
    `[cv-analyzer v3.0] documentId=${documentId} | careerGoal="${careerGoal}" → resolved="${resolvedGoal}" ` +
    `| score=${alignmentScore} | teknik=${detectedSkills.technical.length} | soft=${detectedSkills.softSkills.length} ` +
    `| deneyim=${experience.label} | eğitim=${education.level} | gap=${skillGap.length} | extraction=${detectedSkills.extractionQuality.confidence}`
  );

  // detectedSkills'e deneyim, eğitim ve kalite bilgisini de ekle (frontend için)
  const enrichedSkills = {
    ...detectedSkills,
    experience,
    education,
    qualityScore,
    resumeFeedback,
  };

  try {
    const analysis = await prisma.cvAnalysis.upsert({
      where: { documentId },
      update: {
        userId,
        alignmentScore,
        detectedSkills: enrichedSkills,
        skillGap,
        rawTextLength: rawText.length,
        analysisVersion: '3.0',
      },
      create: {
        documentId,
        userId,
        alignmentScore,
        detectedSkills: enrichedSkills,
        skillGap,
        rawTextLength: rawText.length,
        analysisVersion: '3.0',
      },
    });

    return analysis;
  } catch (err) {
    console.error(`[cv-analyzer] Veritabanı kayıt hatası (documentId=${documentId}):`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// CV Kalite Skoru
// ---------------------------------------------------------------------------

/**
 * CV metninin kalitesini çok faktörlü olarak değerlendirir.
 * Harici AI gerektirmez — yapısal ve içerik sinyallerine dayanır.
 *
 * Faktörler (toplam 100 puan):
 *   - Uzunluk          : 20 puan (300-1500 kelime ideal)
 *   - Bölüm çeşitliliği: 20 puan (deneyim, eğitim, beceri, proje, dil)
 *   - Teknik beceri    : 20 puan (tespit edilen teknik beceri sayısı)
 *   - Soft skill       : 10 puan
 *   - Sertifika        : 10 puan
 *   - Dil              : 10 puan
 *   - Eylem fiilleri   : 10 puan (güçlü fiiller: "geliştirdim", "yönettim"...)
 *
 * @param {string} text - CV ham metni
 * @param {{ technical: string[], softSkills: string[], languages: string[], certificates: string[] }} skills
 * @returns {{ score: number, grade: string, breakdown: object, tips: string[] }}
 */
function calculateCvQualityScore(text, skills) {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  const breakdown = {};
  const tips = [];

  // 1. Uzunluk skoru (20 puan)
  let lengthScore = 0;
  if (wordCount >= 300 && wordCount <= 1500) lengthScore = 20;
  else if (wordCount >= 150 && wordCount < 300) lengthScore = 12;
  else if (wordCount > 1500 && wordCount <= 2500) lengthScore = 14;
  else if (wordCount > 0) lengthScore = 5;
  breakdown.length = { score: lengthScore, max: 20, detail: `${wordCount} kelime` };
  if (wordCount < 300) tips.push('CV çok kısa. Deneyim ve proje detaylarını genişletin (ideal: 300-1500 kelime).');
  if (wordCount > 2500) tips.push('CV çok uzun. En önemli bilgileri öne çıkarın, gereksiz detayları kısaltın.');

  // 2. Bölüm çeşitliliği (20 puan)
  const sectionKeywords = {
    deneyim:   ['deneyim', 'experience', 'iş', 'çalıştım', 'pozisyon', 'görev', 'şirket', 'work'],
    egitim:    ['eğitim', 'education', 'üniversite', 'university', 'lisans', 'bachelor', 'okul', 'school'],
    beceri:    ['beceri', 'skill', 'yetenek', 'teknoloji', 'technology', 'araç', 'tool'],
    proje:     ['proje', 'project', 'uygulama', 'application', 'geliştirme', 'development'],
    iletisim:  ['e-posta', 'email', 'telefon', 'phone', 'linkedin', 'github', 'iletişim', 'contact'],
  };
  let sectionCount = 0;
  for (const [sec, kws] of Object.entries(sectionKeywords)) {
    if (kws.some(kw => lower.includes(kw))) sectionCount++;
  }
  const sectionScore = Math.round((sectionCount / 5) * 20);
  breakdown.sections = { score: sectionScore, max: 20, detail: `${sectionCount}/5 bölüm` };
  if (sectionCount < 3) tips.push('CV\'nize daha fazla bölüm ekleyin: deneyim, eğitim, beceriler, projeler, iletişim bilgileri.');

  // 3. Teknik beceri (20 puan)
  const techCount = (skills.technical || []).length;
  const techScore = Math.min(techCount * 2, 20);
  breakdown.technical = { score: techScore, max: 20, detail: `${techCount} teknik beceri` };
  if (techCount < 5) tips.push('Daha fazla teknik beceri ekleyin. Kullandığınız araç, dil ve framework\'leri listeleyin.');

  // 4. Soft skill (10 puan)
  const softCount = (skills.softSkills || []).length;
  const softScore = Math.min(softCount * 2, 10);
  breakdown.softSkills = { score: softScore, max: 10, detail: `${softCount} soft skill` };
  if (softCount < 2) tips.push('İletişim, liderlik, takım çalışması gibi soft skill\'leri CV\'nize ekleyin.');

  // 5. Sertifika (10 puan)
  const certCount = (skills.certificates || []).length;
  const certScore = Math.min(certCount * 5, 10);
  breakdown.certificates = { score: certScore, max: 10, detail: `${certCount} sertifika` };
  if (certCount === 0) tips.push('Sertifika veya kurs tamamlama belgelerinizi ekleyin (Coursera, Udemy, AWS vb.).');

  // 6. Dil (10 puan)
  const langCount = (skills.languages || []).length;
  const langScore = Math.min(langCount * 5, 10);
  breakdown.languages = { score: langScore, max: 10, detail: `${langCount} dil` };
  if (langCount === 0) tips.push('Bildiğiniz yabancı dilleri ve seviyelerini (A1-C2) ekleyin.');

  // 7. Eylem fiilleri (10 puan) — güçlü CV fiilleri
  const actionVerbs = [
    'geliştirdim', 'yönettim', 'tasarladım', 'uyguladım', 'kurdum', 'artırdım',
    'azalttım', 'optimize', 'koordine', 'liderlik', 'analiz', 'raporladım',
    'developed', 'managed', 'designed', 'implemented', 'built', 'increased',
    'reduced', 'optimized', 'coordinated', 'led', 'analyzed', 'delivered',
    'achieved', 'improved', 'created', 'launched', 'established',
  ];
  const verbCount = actionVerbs.filter(v => lower.includes(v)).length;
  const verbScore = Math.min(verbCount * 2, 10);
  breakdown.actionVerbs = { score: verbScore, max: 10, detail: `${verbCount} eylem fiili` };
  if (verbCount < 3) tips.push('Başarılarınızı güçlü eylem fiilleriyle ifade edin: "geliştirdim", "yönettim", "artırdım" gibi.');

  const totalScore = Object.values(breakdown).reduce((s, b) => s + b.score, 0);

  let grade;
  if (totalScore >= 85) grade = 'A+';
  else if (totalScore >= 75) grade = 'A';
  else if (totalScore >= 65) grade = 'B';
  else if (totalScore >= 50) grade = 'C';
  else if (totalScore >= 35) grade = 'D';
  else grade = 'F';

  return { score: totalScore, grade, breakdown, tips: tips.slice(0, 4) };
}

// ---------------------------------------------------------------------------
// Dışa aktarımlar
// ---------------------------------------------------------------------------

module.exports = {
  extractText,
  extractSkills,
  extractLanguageDetails,
  extractCertificateDetails,
  extractLinks,
  assessExtractionQuality,
  extractExperience,
  extractEducationLevel,
  calculateAlignmentScore,
  calculateCvQualityScore,
  generateSkillGap,
  analyzeCv,
  resolveCareerGoal,
  TECHNICAL_SKILLS,
  SOFT_SKILLS,
  LANGUAGE_SKILLS,
  CERTIFICATE_KEYWORDS,
  CAREER_SKILL_MAP,
};
