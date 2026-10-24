'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import TopHeader from '@/components/TopHeader';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Level { label: string; color: string; icon: string }
interface CareerPath { currentRole: string; targetRole: string; timeframe: string; advice: string }
interface RadarData { labels: string[]; values: number[] }
interface AnalysisItem { icon: string; text: string }
interface KpiTrend {
  sampleSize: number;
  currentScore: number;
  previousAverageScore: number | null;
  change: number | null;
  direction: 'up' | 'down' | 'stable' | 'not_enough_data';
}

interface Analysis {
  overallScore: number;
  level: Level;
  kpiScore: number;
  kpiTrend: KpiTrend | null;
  courseScore: number;
  catProgress: Record<string, number>;
  hasEvaluation: boolean;
  hasPotential: boolean;
  evaluation: {
    kalite: number; sorumluluk: number; birligi: number; zaman: number;
    yorumlar?: string; tarih: string; yonetici: string;
  } | null;
  strengths: AnalysisItem[];
  improvements: AnalysisItem[];
  courseRecommendations: string[];
  careerPath: CareerPath;
  radarData: RadarData;
  generatedAt: string;
}

interface BenchmarkData {
  available: boolean;
  myScore: number;
  groupType: string;
  groupSize: number;
  careerGoal: string | null;
  stats: { avg: number; median: number; min: number; max: number };
  percentile: number;
  distribution: { range: string; count: number }[];
  kpiComparison: Record<string, { label: string; mine: number; peerAvg: number; diff: number }>;
  insight: string;
}

interface SimResult {
  current: { overallScore: number; level: Level; completedCourseCount: number };
  simulated: { overallScore: number; level: Level; completedCourseCount: number };
  delta: { scoreDiff: number; levelUp: boolean; estimatedMonths: number; newCourses: { id: string; title: string }[]; newCourseCount: number };
  message: string;
}

export default function SkillsPage() {
  useAuthGuard('USER');
  const [username, setUsername] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [selectedSimCourses, setSelectedSimCourses] = useState<string[]>([]);
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);

  function handleExportPDF() {
    window.print();
  }

  async function runSimulation() {
    setSimLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ targetCourses: selectedSimCourses }),
      });
      if (res.ok) setSimResult(await res.json());
    } catch { /* ignore */ } finally { setSimLoading(false); }
  }

  useEffect(() => {

    const user = localStorage.getItem('currentUser') || '';
    setUsername(user);

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/ai/analyze`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) setError(data.error);
          else setAnalysis(data);
          setLoading(false);
        })
        .catch(() => { setError('Sunucuya bağlanılamadı.'); setLoading(false); });

      // Benchmark'ı arka planda çek
      fetch(`${API_URL}/api/ai/benchmark`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.available) setBenchmark(data); })
        .catch(() => {});
    } else {
      setLoading(false);
    }  }, []);

  const radarChartData = analysis ? {
    labels: analysis.radarData.labels,
    datasets: [{
      label: 'Yetkinlik Profili',
      data: analysis.radarData.values,
      backgroundColor: 'rgba(26, 79, 186, 0.15)',
      borderColor: '#1a4fba',
      borderWidth: 2,
      pointBackgroundColor: '#1a4fba',
      pointRadius: 4,
    }],
  } : null;

  const radarOptions = {
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { stepSize: 25, font: { size: 10 }, color: '#888888', backdropColor: 'transparent' },
        pointLabels: { font: { size: 11 }, color: '#aaaaaa' },
        grid: { color: 'rgba(128, 128, 128, 0.2)' },
        angleLines: { color: 'rgba(128, 128, 128, 0.2)' }
      },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: true,
  };

  if (loading) return (
    <>
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '4px solid #e0e0e0', borderTop: '4px solid #1a4fba', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
          <p style={{ color: '#888', fontWeight: 500 }}>YZ analizi hazırlanıyor...</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <link rel="stylesheet" href="/styles/yetenek-analizi.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1>Kişisel Yetkinlik Analizi</h1>
              <button
                onClick={() => setShowInfo(true)}
                title="Nasıl hesaplanıyor?"
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#e8f0fe', border: '2px solid #1a4fba',
                  color: '#1a4fba', fontWeight: 800, fontSize: '0.85rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a4fba'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e8f0fe'; (e.currentTarget as HTMLButtonElement).style.color = '#1a4fba'; }}
              >
                i
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {analysis && (
                <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                  Son güncelleme: {new Date(analysis.generatedAt).toLocaleString('tr-TR')}
                </p>
              )}
              {analysis && (
                <button
                  onClick={handleExportPDF}
                  className="no-print"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#1a4fba', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(26,79,186,0.3)' }}
                >
                  <i className="fa-solid fa-file-pdf"></i> PDF İndir
                </button>
              )}
            </div>
          </div>

          {/* ── Bilgi Modalı ── */}
          {showInfo && (
            <div
              onClick={() => setShowInfo(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: '#fff', borderRadius: 20, padding: 36,
                  maxWidth: 680, width: '100%', maxHeight: '85vh',
                  overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}
              >
                {/* Kapat */}
                <button
                  onClick={() => setShowInfo(false)}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#f3f4f6', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, cursor: 'pointer', fontSize: '1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6, color: '#1a4fba' }}>
                  <i className="fa-solid fa-brain" style={{ marginRight: 10 }}></i>
                  YZ Analizi Nasıl Çalışır?
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 28 }}>
                  Genel yetkinlik skorun 3 farklı veri kaynağından hesaplanır ve her biri farklı ağırlık taşır.
                </p>

                {/* Genel Formül */}
                <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#1e40af' }}>
                    <i className="fa-solid fa-calculator" style={{ marginRight: 8 }}></i>Genel Skor Formülü
                  </h3>
                  <div style={{ fontFamily: 'monospace', background: '#1e293b', color: '#7dd3fc', padding: '14px 18px', borderRadius: 10, fontSize: '0.88rem', lineHeight: 1.8 }}>
                    <div><span style={{ color: '#fbbf24' }}>Genel Skor</span> = KPI × <span style={{ color: '#86efac' }}>%55</span> + Eğitim × <span style={{ color: '#86efac' }}>%45</span></div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 6 }}>
                      * Potansiyel quiz yapıldıysa: KPI × %50 + Eğitim × %35 + Potansiyel × %15
                    </div>
                  </div>
                </div>

                {/* KPI */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>%55</span>
                    KPI Performans Skoru
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 12 }}>
                    Yöneticin tarafından 4 kriterde 1-5 arası puanlama yapılır. Her kriterin farklı ağırlığı vardır:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'İş Kalitesi', weight: '%30', color: '#3b82f6', desc: 'Üretilen işin doğruluğu, titizliği ve standartlara uygunluğu.' },
                      { label: 'Sorumluluk', weight: '%25', color: '#8b5cf6', desc: 'Görevleri sahiplenme, taahhütlere bağlılık ve güvenilirlik.' },
                      { label: 'İş Birliği', weight: '%25', color: '#10b981', desc: 'Ekip içi iletişim, yardımlaşma ve uyum.' },
                      { label: 'Zaman Yönetimi', weight: '%20', color: '#f59e0b', desc: 'Görevleri zamanında teslim etme ve önceliklendirme.' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '12px 14px', background: '#f9fafb', borderRadius: 10, borderLeft: `3px solid ${item.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.label}</span>
                          <span style={{ background: `${item.color}20`, color: item.color, padding: '1px 8px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 700 }}>{item.weight}</span>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: '0.82rem', color: '#166534' }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }}></i>
                    Örnek: Kalite=4, Sorumluluk=3, Birliği=5, Zaman=4 → KPI Skoru = (4×0.30 + 3×0.25 + 5×0.25 + 4×0.20) / 5 × 100 = <strong>76</strong>
                  </div>
                </div>

                {/* Eğitim */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>%45</span>
                    Eğitim Tamamlama Skoru
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 12 }}>
                    4 eğitim kategorisindeki tamamlama oranın ağırlıklı ortalaması alınır:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Çeviklik & İnovasyon', weight: '%30', total: '4 kurs', color: '#8b5cf6' },
                      { label: 'Liderlik Gelişimi', weight: '%25', total: '3 kurs', color: '#3b82f6' },
                      { label: 'Stratejik Planlama', weight: '%25', total: '3 kurs', color: '#f59e0b' },
                      { label: 'Bütçe Yönetimi', weight: '%20', total: '3 kurs', color: '#10b981' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 10, borderLeft: `3px solid ${item.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.78rem' }}>{item.total}</div>
                        </div>
                        <span style={{ background: `${item.color}20`, color: item.color, padding: '2px 10px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}>{item.weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potansiyel */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem' }}>%15</span>
                    Potansiyel Quiz Skoru
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(opsiyonel)</span>
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                    12 soruluk potansiyel testini tamamlarsan cevapların 4 boyuta dönüştürülür:
                    <strong> Liderlik, Analitik, Yaratıcılık, Uyum</strong>. Bu boyutlar kariyer önerilerini kişiselleştirir.
                    Quiz yapılmadıysa bu %15 KPI ve Eğitim skoruna dağıtılır.
                  </p>
                </div>

                {/* Seviye Tablosu */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                    <i className="fa-solid fa-layer-group" style={{ marginRight: 8, color: '#6b7280' }}></i>Seviye Tablosu
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { range: '85 – 100', label: 'Uzman', color: '#10b981', desc: 'Liderlik veya uzmanlık rollerine hazır.' },
                      { range: '70 – 84', label: 'İleri Seviye', color: '#3b82f6', desc: 'Kıdemli uzman hedefine yakın.' },
                      { range: '50 – 69', label: 'Orta Seviye', color: '#f59e0b', desc: 'Gelişim sürecinde, eğitimlere devam.' },
                      { range: '30 – 49', label: 'Gelişmekte', color: '#f97316', desc: 'Temel yetkinlikler üzerinde çalışılmalı.' },
                      { range: '0 – 29', label: 'Başlangıç', color: '#6b7280', desc: 'Kariyer yolculuğunun başlangıcı.' },
                    ].map(item => (
                      <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: `${item.color}08`, borderRadius: 10, border: `1px solid ${item.color}20` }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: item.color, minWidth: 70, fontSize: '0.85rem' }}>{item.range}</span>
                        <span style={{ fontWeight: 600, minWidth: 100, fontSize: '0.88rem' }}>{item.label}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: 10, padding: '14px 20px', marginBottom: 20, color: '#e65100' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> {error}
            </div>
          )}

          {!analysis?.hasEvaluation && !loading && (
            <div className="alert alert-warning" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ marginTop: 2 }}></i>
              <div>
                <strong>Değerlendirme Bekleniyor</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
                  Yöneticiniz henüz KPI değerlendirmesi yapmamış. Analiz kurs verilerinize göre oluşturuldu.
                </p>
              </div>
            </div>
          )}

          {analysis && (
            <div id="pdf-report">
              {/* ── Rapor Başlığı (sadece print'te görünür) ── */}
              <div style={{ display: 'none' }} className="pdf-header-only">
                <h2 style={{ textAlign: 'center', color: '#1a4fba', marginBottom: 4 }}>Carriera — Kişisel Yetkinlik Raporu</h2>
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>
                  {username} · {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
              <style>{`@media print { .pdf-header-only { display: block !important; } }`}</style>
              {/* ── Üst Skor Kartları ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 30 }}>
                {/* Genel Skor */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', textAlign: 'center', border: `2px solid ${analysis.level.color}20` }}>
                  <div className="overall-score-value" style={{ '--score-color': analysis.level.color } as React.CSSProperties}>
                    {analysis.overallScore}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 8 }}>/ 100 Genel Skor</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${analysis.level.color}15`, color: analysis.level.color, padding: '4px 14px', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className={`fa-solid ${analysis.level.icon}`}></i> {analysis.level.label}
                  </div>
                </div>

                {/* KPI Skoru */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12, fontWeight: 600 }}>
                    <i className="fa-solid fa-chart-bar" style={{ color: '#1a4fba', marginRight: 6 }}></i>KPI Performansı
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1a4fba', marginBottom: 8 }}>{analysis.kpiScore}<span style={{ fontSize: '1rem', color: '#888' }}>/100</span></div>
                  <div style={{ background: '#e8f0fe', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${analysis.kpiScore}%`, height: '100%', background: '#1a4fba', borderRadius: 8, transition: 'width 1s ease' }}></div>
                  </div>
                  {analysis.evaluation && (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[['İş Kalitesi', analysis.evaluation.kalite], ['Sorumluluk', analysis.evaluation.sorumluluk], ['İş Birliği', analysis.evaluation.birligi], ['Zaman', analysis.evaluation.zaman]].map(([k, v]) => (
                        <div key={String(k)} style={{ fontSize: '0.78rem', color: '#555' }}>
                          {k}: <strong style={{ color: Number(v) >= 4 ? '#10b981' : Number(v) >= 3 ? '#f59e0b' : '#ef4444' }}>{v}/5</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {analysis.kpiTrend && analysis.kpiTrend.change !== null && (
                    <div style={{ marginTop: 10, fontSize: '0.76rem', color: analysis.kpiTrend.direction === 'up' ? '#15803d' : analysis.kpiTrend.direction === 'down' ? '#b45309' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className={`fa-solid ${analysis.kpiTrend.direction === 'up' ? 'fa-arrow-trend-up' : analysis.kpiTrend.direction === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'}`}></i>
                      Son {analysis.kpiTrend.sampleSize} değerlendirmeye göre {analysis.kpiTrend.change > 0 ? '+' : ''}{analysis.kpiTrend.change} puan
                    </div>
                  )}
                  {analysis.kpiTrend?.direction === 'not_enough_data' && (
                    <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#64748b' }}>Eğilim için en az iki KPI değerlendirmesi gerekir.</div>
                  )}
                </div>

                {/* Eğitim Skoru */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: 12, fontWeight: 600 }}>
                    <i className="fa-solid fa-graduation-cap" style={{ color: '#10b981', marginRight: 6 }}></i>Eğitim Tamamlama
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', marginBottom: 8 }}>{analysis.courseScore}<span style={{ fontSize: '1rem', color: '#888' }}>/100</span></div>
                  <div style={{ background: '#d1fae5', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ width: `${analysis.courseScore}%`, height: '100%', background: '#10b981', borderRadius: 8 }}></div>
                  </div>
                  {Object.entries(analysis.catProgress).map(([cat, pct]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#555', marginBottom: 3 }}>
                      <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                      <span style={{ fontWeight: 600, color: pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>%{pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Ana Grid ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                {/* Sol: Radar Chart */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-spider" style={{ color: '#1a4fba', marginRight: 8 }}></i>Yetkinlik Radar Grafiği
                  </h3>
                  {radarChartData && <Radar data={radarChartData} options={radarOptions} />}
                  {analysis.evaluation && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8faff', borderRadius: 10, fontSize: '0.82rem', color: '#555' }}>
                      <i className="fa-solid fa-user-tie" style={{ color: '#1a4fba', marginRight: 6 }}></i>
                      Değerlendiren: <strong>{analysis.evaluation.yonetici}</strong> · {analysis.evaluation.tarih}
                    </div>
                  )}
                  {analysis.evaluation?.yorumlar && (
                    <div style={{ marginTop: 10, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, fontSize: '0.85rem', color: '#78350f', borderLeft: '3px solid #f59e0b' }}>
                      <i className="fa-solid fa-comment-dots" style={{ marginRight: 6 }}></i>
                      <strong>Yönetici Yorumu:</strong> {analysis.evaluation.yorumlar}
                    </div>
                  )}
                </div>

                {/* Sağ: Kariyer Yolu */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginBottom: 20, fontSize: '1.1rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-road" style={{ color: '#8b5cf6', marginRight: 8 }}></i>Kariyer Yolu Analizi
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px 16px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Mevcut Rol</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-color)' }}>{analysis.careerPath.currentRole}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <i className="fa-solid fa-arrow-right" style={{ color: '#8b5cf6', fontSize: '1.2rem' }}></i>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>{analysis.careerPath.timeframe}</span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 10, border: '2px solid rgba(139, 92, 246, 0.3)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginBottom: 4 }}>Hedef Rol</div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#8b5cf6' }}>{analysis.careerPath.targetRole}</div>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 10, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-color)' }}>
                    <i className="fa-solid fa-lightbulb" style={{ color: '#f59e0b', marginRight: 8 }}></i>
                    {analysis.careerPath.advice}
                  </div>

                  {/* İlerleme çubuğu */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: 6 }}>
                      <span>Hedefe İlerleme</span>
                      <span>%{analysis.overallScore}</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${analysis.overallScore}%`, height: '100%', background: `linear-gradient(90deg, #8b5cf6, #1a4fba)`, borderRadius: 8, transition: 'width 1.2s ease' }}></div>
                    </div>
                  </div>
                </div>

                {/* Güçlü Yönler */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-thumbs-up" style={{ color: '#10b981', marginRight: 8 }}></i>Güçlü Yönler
                  </h3>
                  {analysis.strengths.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Değerlendirme tamamlandıkça güçlü yönleriniz burada görünecek.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.strengths.map((s, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, fontSize: '0.88rem', color: '#166534' }}>
                          <i className={`fa-solid ${s.icon}`} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }}></i>
                          {s.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Gelişim Alanları */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                  <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-arrow-trend-up" style={{ color: '#f59e0b', marginRight: 8 }}></i>Gelişim Alanları
                  </h3>
                  {analysis.improvements.length === 0 ? (
                    <p style={{ color: '#10b981', fontSize: '0.9rem' }}>
                      <i className="fa-solid fa-party-horn" style={{ marginRight: 6 }}></i>
                      Tüm alanlarda güçlü performans gösteriyorsunuz!
                    </p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {analysis.improvements.map((item, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#fffbeb', borderRadius: 10, fontSize: '0.88rem', color: '#92400e' }}>
                          <i className={`fa-solid ${item.icon}`} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }}></i>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Önerilen Eğitimler — tam genişlik */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', gridColumn: '1 / -1' }}>
                  <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 700 }}>
                    <i className="fa-solid fa-book-open" style={{ color: '#1a4fba', marginRight: 8 }}></i>YZ Tarafından Önerilen Eğitimler
                  </h3>
                  {analysis.courseRecommendations.length === 0 ? (
                    <p style={{ color: '#10b981', fontSize: '0.9rem' }}>
                      <i className="fa-solid fa-graduation-cap" style={{ marginRight: 6 }}></i>
                      Tüm önerilen eğitimleri tamamladınız. İleri düzey içeriklere geçebilirsiniz!
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {analysis.courseRecommendations.map((rec, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, fontSize: '0.88rem', color: '#1e40af', cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={() => window.location.href = '/education'}
                        >
                          <i className="fa-solid fa-circle-play" style={{ color: '#1a4fba', marginTop: 2, flexShrink: 0 }}></i>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => window.location.href = '/education'}
                    style={{ marginTop: 16, padding: '10px 24px', background: '#1a4fba', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <i className="fa-solid fa-play"></i> Eğitimlere Git
                  </button>
                </div>

                {/* ── Kariyer Yolu Simülasyonu ── */}
                <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-flask" style={{ color: '#8b5cf6', marginRight: 8 }}></i>Kariyer Yolu Simülasyonu
                    </h3>
                    <button onClick={() => setShowSimPanel(p => !p)} className="no-print"
                      style={{ background: '#f5f3ff', color: '#8b5cf6', border: '1px solid #ddd8fe', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      {showSimPanel ? 'Kapat' : 'Simülasyonu Aç'}
                    </button>
                  </div>

                  {!showSimPanel && (
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                      "Eğer şu kursları tamamlarsam skorum ne olur?" sorusunu YZ ile simüle et.
                    </p>
                  )}

                  {showSimPanel && (
                    <div>
                      <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: 16 }}>
                        Tamamlamak istediğin kursları seç, YZ tahmini skoru ve süreyi hesaplasın:
                      </p>

                      {/* Kurs seçimi */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
                        {[
                          { id: 'liderlik-1', title: 'Modern Liderlik', cat: 'liderlik' },
                          { id: 'liderlik-2', title: 'Çevik Dönüşüm', cat: 'liderlik' },
                          { id: 'liderlik-3', title: 'Etkili İletişim', cat: 'liderlik' },
                          { id: 'stratejik-1', title: 'Stratejik Düşünme', cat: 'stratejik' },
                          { id: 'stratejik-2', title: 'Veri Odaklı Karar', cat: 'stratejik' },
                          { id: 'stratejik-3', title: 'Risk Yönetimi', cat: 'stratejik' },
                          { id: 'butce-1', title: 'Bütçe Planlama', cat: 'butce' },
                          { id: 'butce-2', title: 'Finansal Analiz', cat: 'butce' },
                          { id: 'butce-3', title: 'Maliyet Optimizasyonu', cat: 'butce' },
                          { id: 'cevik-1', title: 'Agile & Scrum', cat: 'cevik' },
                          { id: 'cevik-2', title: 'İnovasyon', cat: 'cevik' },
                          { id: 'cevik-3', title: 'Kanban', cat: 'cevik' },
                          { id: 'cevik-4', title: 'Dijital Dönüşüm', cat: 'cevik' },
                        ].map(course => {
                          const isSelected = selectedSimCourses.includes(course.id);
                          const catColors: Record<string, string> = { liderlik: '#3b82f6', stratejik: '#10b981', butce: '#f59e0b', cevik: '#8b5cf6' };
                          const color = catColors[course.cat];
                          return (
                            <div key={course.id} onClick={() => setSelectedSimCourses(prev =>
                              isSelected ? prev.filter(id => id !== course.id) : [...prev, course.id]
                            )}
                              style={{ padding: '10px 14px', borderRadius: 10, border: `2px solid ${isSelected ? color : '#e5e7eb'}`, background: isSelected ? `${color}10` : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
                              <i className={`fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: isSelected ? color : '#d1d5db', fontSize: '1rem' }}></i>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{course.title}</div>
                                <div style={{ fontSize: '0.72rem', color, fontWeight: 500 }}>{course.cat}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button onClick={runSimulation} disabled={simLoading || selectedSimCourses.length === 0}
                        style={{ background: selectedSimCourses.length === 0 ? '#e5e7eb' : '#8b5cf6', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, cursor: selectedSimCourses.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {simLoading ? <><i className="fa-solid fa-spinner fa-spin"></i> Hesaplanıyor...</> : <><i className="fa-solid fa-flask"></i> Simüle Et ({selectedSimCourses.length} kurs)</>}
                      </button>

                      {/* Simülasyon sonucu */}
                      {simResult && (
                        <div style={{ marginTop: 20, padding: 20, background: simResult.delta.scoreDiff > 0 ? '#f0fdf4' : '#fef9c3', borderRadius: 14, border: `1px solid ${simResult.delta.scoreDiff > 0 ? '#bbf7d0' : '#fde68a'}` }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', padding: '14px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Mevcut Skor</div>
                              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6b7280' }}>{simResult.current.overallScore}</div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>{simResult.current.level.label}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '1.5rem', color: simResult.delta.scoreDiff > 0 ? '#10b981' : '#f59e0b' }}>
                                {simResult.delta.scoreDiff > 0 ? '→' : '='}
                              </div>
                              {simResult.delta.scoreDiff > 0 && (
                                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>+{simResult.delta.scoreDiff} puan</div>
                              )}
                            </div>
                            <div style={{ textAlign: 'center', padding: '14px', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: simResult.delta.levelUp ? '2px solid #10b981' : undefined }}>
                              <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 4 }}>Simüle Skor</div>
                              <div style={{ fontSize: '2rem', fontWeight: 800, color: simResult.delta.scoreDiff > 0 ? '#10b981' : '#6b7280' }}>{simResult.simulated.overallScore}</div>
                              <div style={{ fontSize: '0.8rem', color: simResult.delta.levelUp ? '#10b981' : '#888', fontWeight: simResult.delta.levelUp ? 700 : 400 }}>
                                {simResult.simulated.level.label} {simResult.delta.levelUp && '⬆️'}
                              </div>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', textAlign: 'center' }}>
                            <i className="fa-solid fa-clock" style={{ color: '#8b5cf6', marginRight: 6 }}></i>
                            {simResult.message}
                          </p>
                          {simResult.delta.estimatedMonths > 0 && (
                            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6b7280', textAlign: 'center' }}>
                              Tahmini süre: <strong>{simResult.delta.estimatedMonths} ay</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Benchmark Raporu ── */}
                {benchmark && (
                  <div style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        <i className="fa-solid fa-ranking-star" style={{ color: '#f59e0b', marginRight: 8 }}></i>Benchmark Raporu
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 400, marginLeft: 8 }}>
                          {benchmark.groupType === 'same_career' ? `${benchmark.careerGoal} hedefli` : 'Tüm'} {benchmark.groupSize} kullanıcıyla karşılaştırma
                        </span>
                      </h3>
                      <button onClick={() => setShowBenchmark(p => !p)} className="no-print"
                        style={{ background: '#fffbeb', color: '#f59e0b', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        {showBenchmark ? 'Kapat' : 'Detayları Gör'}
                      </button>
                    </div>

                    {/* Yüzdelik dilim özeti */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: showBenchmark ? 24 : 0 }}>
                      {[
                        { label: 'Senin Skoru', value: benchmark.myScore, color: '#1a4fba', suffix: '' },
                        { label: 'Grup Ortalaması', value: benchmark.stats.avg, color: '#6b7280', suffix: '' },
                        { label: 'Yüzdelik Dilim', value: benchmark.percentile, color: benchmark.percentile >= 75 ? '#10b981' : benchmark.percentile >= 50 ? '#f59e0b' : '#ef4444', suffix: '.' },
                        { label: 'Grup En Yükseği', value: benchmark.stats.max, color: '#8b5cf6', suffix: '' },
                      ].map(item => (
                        <div key={item.label} style={{ textAlign: 'center', padding: '14px', background: '#f9fafb', borderRadius: 12 }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: item.color }}>{item.value}{item.suffix}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Insight */}
                    <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 10, fontSize: '0.88rem', color: '#78350f', borderLeft: '3px solid #f59e0b', marginBottom: showBenchmark ? 20 : 0 }}>
                      <i className="fa-solid fa-lightbulb" style={{ marginRight: 8 }}></i>{benchmark.insight}
                    </div>

                    {showBenchmark && (
                      <>
                        {/* Dağılım grafiği */}
                        <div style={{ marginBottom: 20 }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>Skor Dağılımı</h4>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
                            {benchmark.distribution.map(bucket => {
                              const maxCount = Math.max(...benchmark.distribution.map(b => b.count), 1);
                              const height = Math.max((bucket.count / maxCount) * 70, 4);
                              const isMyBucket = benchmark.myScore >= parseInt(bucket.range.split('-')[0]) &&
                                                 benchmark.myScore <= parseInt(bucket.range.split('-')[1] || '100');
                              return (
                                <div key={bucket.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{bucket.count}</div>
                                  <div style={{ width: '100%', height, background: isMyBucket ? '#1a4fba' : '#e5e7eb', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }}></div>
                                  <div style={{ fontSize: '0.65rem', color: isMyBucket ? '#1a4fba' : '#9ca3af', fontWeight: isMyBucket ? 700 : 400 }}>{bucket.range}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* KPI karşılaştırması */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: '#374151' }}>KPI Karşılaştırması</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Object.values(benchmark.kpiComparison).map(kpi => (
                              <div key={kpi.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ minWidth: 120, fontSize: '0.82rem', color: '#374151', fontWeight: 500 }}>{kpi.label}</span>
                                <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <div style={{ flex: kpi.mine / 5, background: '#1a4fba', height: 8, borderRadius: 4, minWidth: 4 }}></div>
                                  <span style={{ fontSize: '0.75rem', color: '#1a4fba', fontWeight: 700, minWidth: 24 }}>{kpi.mine}</span>
                                </div>
                                <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <div style={{ flex: kpi.peerAvg / 5, background: '#e5e7eb', height: 8, borderRadius: 4, minWidth: 4 }}></div>
                                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', minWidth: 24 }}>{kpi.peerAvg}</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: kpi.diff >= 0 ? '#10b981' : '#ef4444', minWidth: 40 }}>
                                  {kpi.diff >= 0 ? '+' : ''}{kpi.diff}
                                </span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#6b7280' }}>
                                <div style={{ width: 12, height: 8, background: '#1a4fba', borderRadius: 2 }}></div> Senin puanın
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#6b7280' }}>
                                <div style={{ width: 12, height: 8, background: '#e5e7eb', borderRadius: 2 }}></div> Grup ortalaması
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Print CSS — PDF rapor için ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pdf-report, #pdf-report * { visibility: visible; }
          #pdf-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}
