'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import TopHeader from '@/components/TopHeader';

const skillCategories: Record<string, string[]> = {
  "Stratejik Planlama": ["planlama", "strateji", "hedef", "organizasyon"],
  "Liderlik ve Etki": ["liderlik", "yonetim", "sorumluluk", "ikna", "kararlı"],
  "Analitik Etki": ["analitik", "veri", "detay", "raporlama", "teknik"],
  "Adaptasyon Hızı": ["adaptasyon", "esneklik", "hizli", "degisim"],
  "Yaratıcı Vizyon": ["yaratici", "vizyoner", "inovasyon", "tasarim"],
  "Ekip Uyumu": ["takim", "iletisim", "isbirligi", "uyum", "sosyal", "diplomasi"],
};

const questionTraits = [
  [[" planlama", "analitik"], ["yaratici", "vizyoner"], ["takim", "iletisim"], ["baski", "esneklik"]],
  [["liderlik", "yonetim"], ["analitik", "detay"], ["takim", "uyum"], ["yaratici", "inovasyon"]],
  [["hedef", "motivasyon"], ["ogrenme", "akademik"], ["rehberlik", "gelisim"], ["cesitlilik", "deneyim"]],
  [["analitik", "veri"], ["sezgi", "deneyim"], ["takim", "isbirligi"], ["risk", "girisimci"]],
  [["analitik", "raporlama"], ["iletisim", "sosyal"], ["yaratici", "tasarim"], ["planlama", "organizasyon"]],
  [["analitik", "ikna"], ["uzlasma", "diplomasi"], ["pasif", "uyum"], ["kararlı", "liderlik"]],
  [["liderlik", "sorumluluk"], ["gelisim", "ogrenme"], ["esneklik", "uyum"], ["bagimsiz", "bireysel"]],
  [["adaptasyon", "esneklik"], ["analitik", "sabir"], ["elestiri", "detay"], ["istikrar", "rutin"]],
  [["hizli", "adaptasyon"], ["detay", "uzman"], ["pratik", "deneyim"], ["hiz", "rekabet"]],
  [["dikkatli", "strateji"], ["guvenlik", "istikrar"], ["cesaret", "girisimci"], ["kararsiz", "analiz"]],
  [["memnun", "uyum"], ["gelisim", "potansiyel"], ["hedef", "ilerleme"], ["degisim", "arayis"]],
  [["analitik", "teknik"], ["iletisim", "insan"], ["yaratici", "tasarim"], ["yonetim", "liderlik"]],
];

const positionProfiles = [
  { name: "STRATEJİK SENARYO YÖNETİCİSİ", primarySkills: ["Stratejik Planlama", "Analitik Etki", "Liderlik ve Etki"], analysis: "Kriz anlarında sakin kalıp, verilerle desteklenmiş yaratıcı çözümler üretmek senin en büyük gücün.", development: "Stratejik karar alma süreçlerinde veri analitiği araçlarını kullanarak senaryo modellerini dijitalleştir." },
  { name: "YENİLİKÇİ PROJE LİDERİ", primarySkills: ["Yaratıcı Vizyon", "Liderlik ve Etki", "Ekip Uyumu"], analysis: "Yaratıcı düşünce yapın ve liderlik becerilerin, projeleri başarıya taşıyan en önemli özelliklerinden.", development: "Agile ve Scrum metodolojilerini derinleştirerek inovatif projeleri daha verimli yönet." },
  { name: "VERİ ODAKLI STRATEJİST", primarySkills: ["Analitik Etki", "Stratejik Planlama", "Adaptasyon Hızı"], analysis: "Verileri analiz ederek stratejik kararlar almak senin doğal yeteneğin.", development: "İleri düzey veri görselleştirme araçları (Tableau, Power BI) öğren." },
  { name: "İLETİŞİM KOORDİNATÖRÜ", primarySkills: ["Ekip Uyumu", "Liderlik ve Etki", "Adaptasyon Hızı"], analysis: "İnsanlarla kurduğun güçlü bağlar ve iletişim becerilerin, seni doğal bir köprü haline getiriyor.", development: "Müzakere teknikleri ve çatışma yönetimi eğitimleri al." },
  { name: "YARATICI ÇÖZÜM MİMARI", primarySkills: ["Yaratıcı Vizyon", "Analitik Etki", "Adaptasyon Hızı"], analysis: "Yaratıcı düşünce yapın ile analitik bakış açını birleştirerek özgün çözümler üretebiliyorsun.", development: "Design Thinking ve Problem Solving metodolojilerini öğren." },
];

export default function PotentialResultPage() {
  const [username, setUsername] = useState('');
  const [position, setPosition] = useState(positionProfiles[0]);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const user = localStorage.getItem('currentUser') || '';
    setUsername(user.split('@')[0]);

    const savedAnswers = localStorage.getItem('potentialAnswers');
    let answers: number[] = [];
    try {
      const parsed = savedAnswers ? JSON.parse(savedAnswers) : null;
      if (Array.isArray(parsed) && parsed.length === questionTraits.length) {
        answers = parsed.map(answer => Number(answer));
      }
    } catch (error) {
      console.error('Potansiyel testi cevapları okunamadı:', error);
    }

    const traitCount: Record<string, number> = {};
    answers.forEach((ansIdx, qIdx) => {
      const traits = Number.isInteger(ansIdx) && ansIdx >= 0
        ? questionTraits[qIdx]?.[ansIdx] || []
        : [];
      traits.forEach(t => { traitCount[t.trim()] = (traitCount[t.trim()] || 0) + 1; });
    });

    const catScores: Record<string, number> = {};
    Object.keys(skillCategories).forEach(cat => {
      let score = 0;
      skillCategories[cat].forEach(t => { score += traitCount[t] || 0; });
      catScores[cat] = answers.length
        ? Math.min(Math.round((score / answers.length) * 100), 100)
        : 0;
    });
    setScores(catScores);

    let best = positionProfiles[0];
    let bestScore = 0;
    positionProfiles.forEach(p => {
      const s = p.primarySkills.reduce((acc, sk) => acc + (catScores[sk] || 0), 0);
      if (s > bestScore) { bestScore = s; best = p; }
    });
    setPosition(best);  }, []);

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/analiz-sonuc.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">
          <div className="left-section">
            <div className="header-section">
              <h1 className="main-title">TEBRİKLER {username.toUpperCase()}</h1>
              <h2 className="sub-title">İŞTE ANALİZİN HAZIR !</h2>
              <div className="progress-complete">
                <div className="progress-bar-complete"><div className="progress-fill-complete"></div></div>
                <span className="progress-check"><i className="fa-solid fa-check-circle"></i></span>
              </div>
              <p className="progress-text-complete">12/12 Soru Tamamlandı!</p>
            </div>
            <div className="position-card">
              <div className="star-badge"><i className="fa-solid fa-star"></i></div>
              <h3>{position.name}</h3>
            </div>
            <div className="analysis-card analysis-blue">
              <div className="card-icon"><i className="fa-solid fa-search"></i></div>
              <h4>Analiz</h4>
              <p>{position.analysis}</p>
            </div>
            <div className="analysis-card analysis-yellow">
              <div className="card-icon"><i className="fa-solid fa-lightbulb"></i></div>
              <h4>Gelişim Alanı</h4>
              <p>{position.development}</p>
            </div>
          </div>

          <div className="right-section">
            <div className="radar-chart-container">
              <div style={{ padding: '20px' }}>
                {Object.entries(scores).map(([cat, score]) => (
                  <div key={cat} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>{cat}</span><span>%{score}</span>
                    </div>
                    <div style={{ background: '#e0e0e0', borderRadius: '10px', height: '8px' }}>
                      <div style={{ background: '#1a4fba', width: `${score}%`, height: '100%', borderRadius: '10px', transition: 'width 0.8s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <button className="cta-button" onClick={() => window.location.href = '/cv-upload'}>CV'ni Yükle ve Kariyerine Başla</button>
        </div>
        <div className="bottom-actions">
          <button className="action-btn" onClick={() => window.location.href = '/potential'}><i className="fa-solid fa-rotate"></i> Testi Tekrarla</button>
          <button className="action-btn" onClick={() => window.location.href = '/education'}><i className="fa-solid fa-graduation-cap"></i> Eğitimlere Git</button>
        </div>
      </div>
    </>
  );
}
