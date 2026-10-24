'use client';
import { useEffect, useState, useRef } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import Chart from 'chart.js/auto';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Recommendation = {
  title: string;
  strengths: string;
  development: string;
};

function getRecommendation(scores: { iletisim: number; liderlik: number; anlama: number }): Recommendation {
  const { iletisim, liderlik, anlama } = scores;
  const highest = Math.max(iletisim, liderlik, anlama);

  if (highest === liderlik && liderlik >= iletisim + 8 && liderlik >= anlama + 8) {
    return {
      title: 'Proje Yöneticisi',
      strengths: 'İnsanları yönlendirme, sorumluluk alma ve hedefleri sonuca ulaştırma konusunda güçlü bir potansiyelin var.',
      development: 'Veri destekli karar alma ve etkili iletişim becerilerini geliştirerek ekip liderliğinde daha da ilerleyebilirsin.',
    };
  }
  if (highest === anlama && anlama >= iletisim + 8 && anlama >= liderlik + 8) {
    return {
      title: 'Veri Analisti',
      strengths: 'Analitik düşünme, problem çözme ve karmaşık bilgileri anlamlandırma becerilerin öne çıkıyor.',
      development: 'Sunum ve paydaş iletişimi becerilerini güçlendirerek analizlerini daha etkili şekilde aktarabilirsin.',
    };
  }
  if (highest === iletisim && iletisim >= liderlik + 8 && iletisim >= anlama + 8) {
    return {
      title: 'İnsan Kaynakları Uzmanı',
      strengths: 'İnsanlarla güçlü bağ kurma, dinleme ve ekip içi uyumu destekleme becerilerin belirgin.',
      development: 'Liderlik ve analitik becerilerini geliştirerek insan odaklı kararlarında daha stratejik olabilirsin.',
    };
  }
  if (liderlik >= 65 && iletisim >= 65 && anlama >= 65) {
    return {
      title: 'Ürün Yöneticisi',
      strengths: 'Liderlik, iletişim ve analitik düşünmeyi birlikte kullanarak farklı ekipleri ortak hedefte buluşturabilirsin.',
      development: 'Ürün stratejisi, kullanıcı araştırması ve önceliklendirme pratikleriyle bu potansiyeli güçlendirebilirsin.',
    };
  }
  return {
    title: 'İş Geliştirme Uzmanı',
    strengths: 'Farklı beceri alanlarında dengeli bir profil sergiliyor, yeni görevleri öğrenmeye ve uyum sağlamaya açıksın.',
    development: 'En güçlü alanını belirleyip o alana yönelik eğitim ve uygulamalarla uzmanlığını derinleştirebilirsin.',
  };
}

export default function SkillsResultPage() {
  useAuthGuard('USER');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const [username, setUsername] = useState('Kullanıcı');
  const [scores, setScores] = useState({ anlama: 85, problem: 90, iletisim: 75, liderlik: 80, yaraticilik: 85, takim: 95 });
  const [recommendation, setRecommendation] = useState<Recommendation>(() => getRecommendation({ anlama: 85, iletisim: 75, liderlik: 80 }));

  useEffect(() => {

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const user = localStorage.getItem('currentUser') || 'Kullanıcı';
    setUsername(user);

    // Varsa localStorage'dan skorları al, yoksa default kullan
    const storedScores = localStorage.getItem('potentialScore');
    const storedResults = localStorage.getItem('potentialResults');
    let loadedScores = { anlama: 85, problem: 90, iletisim: 75, liderlik: 80, yaraticilik: 85, takim: 95 };
    if (storedScores) {
      try {
        loadedScores = JSON.parse(storedScores);
        setScores(loadedScores);
      } catch (e) {}
    } else if (storedResults) {
      try {
        const parsed = JSON.parse(storedResults);
        const l = Math.round(((parsed.liderlik || 0) / 40) * 100) || 80;
        const i = Math.round(((parsed.iletisim || 0) / 40) * 100) || 75;
        const a = Math.round(((parsed.analitik || 0) / 40) * 100) || 85;
        loadedScores = {
          anlama: a,
          problem: Math.min(a + 5, 100),
          iletisim: i,
          liderlik: l,
          yaraticilik: Math.round((a + l) / 2),
          takim: i
        };
        setScores(loadedScores);
      } catch (e) {}
    }
    setRecommendation(getRecommendation({
      anlama: loadedScores.anlama,
      iletisim: loadedScores.iletisim,
      liderlik: loadedScores.liderlik,
    }));

    // Chart.js çizimi
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Analitik Düşünme', 'Problem Çözme', 'İletişim', 'Liderlik', 'Yaratıcılık', 'Takım Çalışması'],
            datasets: [{
              label: 'Yetkinlik Skorunuz',
              data: [loadedScores.anlama, loadedScores.problem, loadedScores.iletisim, loadedScores.liderlik, loadedScores.yaraticilik, loadedScores.takim],
              backgroundColor: 'rgba(79, 195, 247, 0.2)',
              borderColor: 'rgba(79, 195, 247, 1)',
              pointBackgroundColor: 'rgba(26, 79, 186, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(26, 79, 186, 1)',
              borderWidth: 2,
            }]
          },
          options: {
            scales: {
              r: {
                angleLines: { color: darkMode === 'true' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                grid: { color: darkMode === 'true' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                pointLabels: { color: darkMode === 'true' ? '#ccc' : '#666', font: { family: "'Poppins', sans-serif", size: 12 } },
                max: 100,
                min: 0,
                ticks: { display: false }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
    // Sayfayı yenile ki chart renkleri güncellensin
    window.location.reload();
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/analiz-sonuc.css" />
      <style>{`.sidebar { left: 0 !important; position: fixed !important; } .main-content { margin-left: 250px !important; }`}</style>
      <UserSidebar />
      <div className="main-content">
        <TopHeader />

        <div className="page-content">
          <div className="left-section">
            <div className="header-section">
              <h1 className="main-title">
                YETENEK <span>ANALİZİN</span>
                <img src="https://cdn-icons-png.flaticon.com/512/10435/10435133.png" alt="confetti" className="confetti-icon" />
              </h1>
              <h2 className="sub-title">TAMAMLANDI</h2>
              
              <div className="progress-complete">
                <div className="progress-bar-complete">
                  <div className="progress-fill-complete"></div>
                </div>
                <i className="fa-solid fa-check-circle progress-check"></i>
              </div>
              <p className="progress-text-complete">Profilin analiz edildi ve sana en uygun kariyer yolu belirlendi.</p>
            </div>

            <div className="position-card">
              <div className="star-badge"><i className="fa-solid fa-star"></i></div>
              <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 5, fontSize: '0.9rem' }}>Önerilen Pozisyon</h4>
              <h3>{recommendation.title}</h3>
            </div>

            <div className="analysis-card analysis-blue">
              <div className="card-icon"><i className="fa-solid fa-lightbulb"></i></div>
              <h4>Güçlü Yönlerin</h4>
              <p>{recommendation.strengths}</p>
            </div>

            <div className="analysis-card analysis-yellow">
              <div className="card-icon"><i className="fa-solid fa-rocket"></i></div>
              <h4>Gelişim Alanların</h4>
              <p>{recommendation.development}</p>
            </div>
          </div>

          <div className="right-section">
            <div className="radar-chart-container">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <button className="cta-button" onClick={() => window.location.href = '/education'}>
            Eğitimlerine Başla <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
          </button>
        </div>

        <div className="bottom-actions">
          <button className="action-btn" onClick={() => window.location.href = '/profile/view'}>
            <i className="fa-solid fa-user"></i> Profilime Git
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/dashboard'}>
            <i className="fa-solid fa-house"></i> Ana Sayfaya Dön
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/potential'}>
            <i className="fa-solid fa-rotate-right"></i> Testi Tekrarla
          </button>
        </div>
      </div>
    </>
  );
}
