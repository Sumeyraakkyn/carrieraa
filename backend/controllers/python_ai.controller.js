'use strict';
const prisma = require('../lib/prisma');

// Python FastAPI sunucusunun adresi (Varsayılan olarak 8000 portunda çalışır)
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

// Profil formu becerileri "Python:Orta" biçiminde saklayabilir; Python
// modeli ve öneri kuralları ise yalın beceri adlarıyla eğitilmiştir.
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];

  return skills
    .map((skill) => typeof skill === 'string' ? skill.split(':')[0].trim() : '')
    .filter(Boolean);
}

// Form ve yapay zekâ servisindeki aynı anlama gelen rol adlarını eşleştir.
function normalizeTargetRole(role) {
  const aliases = {
    'Veri Bilimcisi': 'Veri Bilimci',
    'Yazılım Mühendisi': 'Kıdemli Geliştirici',
  };

  return aliases[role] || role || 'Belirtilmemiş';
}

function getDepartment(profile) {
  let experiences = profile.experiences;
  if (typeof experiences === 'string') {
    try { experiences = JSON.parse(experiences); }
    catch { experiences = []; }
  }

  if (!Array.isArray(experiences) || experiences.length === 0) return 'Bilinmiyor';
  return experiences[0].position || experiences[0].title || 'Bilinmiyor';
}

/**
 * GET /api/python-ai/recommendation
 * Kullanıcının yetkinliklerine ve hedeflerine göre Python üzerinden eğitim önerisi alır.
 */
async function getPythonRecommendation(req, res) {
  try {
    const userId = req.user.id;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });

    const targetRole = normalizeTargetRole(profile.careerGoal);
    const currentSkills = normalizeSkills(profile.skills);
    
    // Node.js üzerinden Python FastAPI servisine istek atıyoruz (Entegrasyon)
    const response = await fetch(`${PYTHON_API_URL}/api/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_skills: currentSkills,
        target_role: targetRole,
        department: getDepartment(profile)
      })
    });
    
    if (!response.ok) throw new Error("Python servisinden hata döndü");
    const aiData = await response.json();
    
    res.json(aiData);
  } catch (err) {
    console.error('getPythonRecommendation Error:', err);
    res.status(500).json({ error: 'Yapay zeka (Python) servisine bağlanılamadı. Servisin açık olduğundan emin olun.' });
  }
}

/**
 * GET /api/python-ai/performance
 * Random Forest modeli kullanılarak Python üzerinden performans tahmini yapar.
 */
async function getPythonPerformancePrediction(req, res) {
  try {
    const userId = req.user.id;
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profil bulunamadı.' });

    const department = getDepartment(profile);

    const response = await fetch(`${PYTHON_API_URL}/api/performance-prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_skills: normalizeSkills(profile.skills),
        target_role: normalizeTargetRole(profile.careerGoal),
        department: department
      })
    });
    
    if (!response.ok) throw new Error("Python servisinden hata döndü");
    const aiData = await response.json();
    
    res.json(aiData);
  } catch (err) {
    console.error('getPythonPerformancePrediction Error:', err);
    res.status(500).json({ error: 'Yapay zeka performans tahmini başarısız.' });
  }
}

async function getPythonModelMetrics(req, res) {
  try {
    const response = await fetch(`${PYTHON_API_URL}/api/model-metrics`, {
      method: 'GET'
    });
    if (!response.ok) throw new Error("Python model-metrics servisinden hata döndü");
    const metricsData = await response.json();
    res.json(metricsData);
  } catch (err) {
    console.error('getPythonModelMetrics Error:', err);
    res.status(500).json({ error: 'Yapay zeka (Python) model metriklerine bağlanılamadı.' });
  }
}

module.exports = {
  getPythonRecommendation,
  getPythonPerformancePrediction,
  getPythonModelMetrics
};
