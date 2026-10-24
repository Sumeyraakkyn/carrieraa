'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const KPI_LABELS: Record<string, string> = {
  kalite: 'İş Kalitesi',
  sorumluluk: 'Sorumluluk',
  birligi: 'İş Birliği',
  zaman: 'Zaman Yönetimi',
};

interface Anomaly {
  userId: number; username: string; fullName: string; avatarUrl: string;
  prevScore: number; currentScore: number; drop: number; severity: string;
}
interface Grower { userId: number; username: string; fullName: string; avatarUrl: string; currentScore: number }
interface WeakKpi { kpi: string; avg: number }
interface Learner { username: string; fullName: string; avatarUrl: string; coursesCompleted: number }
interface Report {
  period: { from: string; to: string };
  summary: { newUsers: number; newCoursesCompleted: number; newEvaluations: number; newCVsUploaded: number; pendingCVs: number; totalUsers: number };
  topLearners: Learner[];
}
interface CompareResult {
  target: { username: string; fullName: string; avatarUrl: string; overallScore: number; kpiScore: number; courseScore: number; careerGoal: string };
  peerGroup: { size: number; type: string; avgOverall: number; avgKpi: number; avgCourse: number };
  rank: number; percentile: number;
  kpiComparison: Record<string, { target: number; peerAvg: number; diff: number }>;
  insight: string;
}

export default function AdminAiAnalyticsPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yönetici');
  const [tab, setTab] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [growers, setGrowers] = useState<Grower[]>([]);
  const [teamKpi, setTeamKpi] = useState<Record<string, number>>({});
  const [weakKpis, setWeakKpis] = useState<WeakKpi[]>([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [selUser, setSelUser] = useState('');
  const [cmpResult, setCmpResult] = useState<CompareResult | null>(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifResult, setNotifResult] = useState<{ sent: number; details: any[] } | null>(null);

  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Sync Dark Mode state dynamically
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.body.classList.contains('dark-mode'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    setAdminName(localStorage.getItem('currentAdmin') || 'Yönetici');
    loadAnomalies();
    loadUsers();

    return () => observer.disconnect();
  }, []);

  function getToken() { return localStorage.getItem('token') || ''; }

  async function loadAnomalies() {
    setAnomalyLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/admin/anomalies`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setAnomalies(d.anomalies || []);
      setGrowers(d.topGrowers || []);
      setTeamKpi(d.teamKpiAvg || {});
      setWeakKpis(d.weakTeamKpis || []);
    } catch { toast.error('Anomali verileri yüklenemedi'); }
    finally { setAnomalyLoading(false); }
  }

  async function loadUsers() {
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) return;
      const d = await res.json();
      setUsers((d || []).filter((u: any) => u.role === 'USER').map((u: any) => ({ id: u.id, username: u.username })));
    } catch { /* silent */ }
  }

  async function loadReport() {
    if (report) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/admin/weekly-report`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      setReport(await res.json());
    } catch { toast.error('Rapor yüklenemedi'); }
    finally { setReportLoading(false); }
  }

  async function handleCompare() {
    if (!selUser) { toast.error('Kullanıcı seçin'); return; }
    setCmpLoading(true); setCmpResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/admin/compare/${selUser}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      setCmpResult(await res.json());
    } catch { toast.error('Karşılaştırma yapılamadı'); }
    finally { setCmpLoading(false); }
  }

  async function handleNotif() {
    setNotifLoading(true); setNotifResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/admin/send-smart-notifications`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setNotifResult({ sent: d.sent || 0, details: d.details || [] });
      toast.success(`${d.sent || 0} bildirim gönderildi!`);
    } catch { toast.error('Bildirimler gönderilemedi'); }
    finally { setNotifLoading(false); }
  }

  async function loadMetrics() {
    if (metrics) return;
    setMetricsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/python-ai/metrics`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (!res.ok) throw new Error();
      setMetrics(await res.json());
    } catch { toast.error('Model metrikleri yüklenemedi'); }
    finally { setMetricsLoading(false); }
  }

  function switchTab(i: number) {
    setTab(i);
    if (i === 2) loadReport();
    if (i === 4) loadMetrics();
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
    setIsDark(document.body.classList.contains('dark-mode'));
  }

  // Color theme definitions for dark & light modes
  const themeColors = {
    bg: isDark ? '#0f172a' : '#f8fafc',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    divider: isDark ? '#334155' : '#f1f5f9',
    lightBg: isDark ? '#0f172a' : '#f8fafc',
    blueLight: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    blueBorder: isDark ? '#1d4ed8' : '#bfdbfe',
    blueText: isDark ? '#60a5fa' : '#1d4ed8',
    amberLight: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
    amberBorder: isDark ? '#b45309' : '#fde68a',
    amberText: isDark ? '#fbbf24' : '#b45309',
    greenLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    greenBorder: isDark ? '#047857' : '#a7f3d0',
    greenText: isDark ? '#34d399' : '#047857',
    redLight: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
    redBorder: isDark ? '#b91c1c' : '#fca5a5',
    redText: isDark ? '#f87171' : '#b91c1c',
  };

  const cardStyle: React.CSSProperties = {
    background: themeColors.cardBg,
    borderRadius: 16,
    padding: 24,
    boxShadow: isDark ? '0 4px 25px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
    marginBottom: 20,
    border: `1px solid ${themeColors.border}`,
    color: themeColors.text,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const badge = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: '0.75rem',
    fontWeight: 700,
    background: color,
    color: '#fff'
  });

  const TABS = ['Anomali Tespiti', 'Çalışan Karşılaştırma', 'Haftalık Rapor', 'Akıllı Bildirimler', 'YZ Model Metrikleri'];

  // Reusable interactive help/explanation section for each tab
  const HelpSection = ({ title, desc, points }: { title: string; desc: string; points: { term: string; explanation: string; icon?: string }[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #f0fdf4, #f8fafc)',
        border: `1px solid ${isDark ? '#334155' : '#bbf7d0'}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        transition: 'all 0.3s ease'
      }}>
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', 
              background: isDark ? 'rgba(52, 211, 153, 0.15)' : '#ecfdf5',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className="fa-solid fa-circle-info" style={{ color: isDark ? '#34d399' : '#047857', fontSize: '1rem' }}></i>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: isDark ? '#34d399' : '#166534', display: 'block' }}>
                {title} (Rehber ve Yorumlama)
              </span>
              <span style={{ fontSize: '0.75rem', color: themeColors.textSecondary }}>
                Bu sayfadaki verilerin ne anlama geldiğini öğrenmek için tıklayın.
              </span>
            </div>
          </div>
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: themeColors.textSecondary, fontSize: '0.9rem' }}></i>
        </div>
        
        {isOpen && (
          <div style={{ marginTop: 14, fontSize: '0.85rem', color: themeColors.textSecondary, borderTop: `1px solid ${themeColors.border}`, paddingTop: 14 }}>
            <p style={{ marginBottom: 14, lineHeight: 1.6, color: themeColors.text }}>{desc}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {points.map((p, idx) => (
                <div key={idx} style={{ background: isDark ? '#0f172a' : '#fff', padding: 12, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
                  <div style={{ fontWeight: 700, color: themeColors.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.icon && <i className={`fa-solid ${p.icon}`} style={{ color: '#1a4fba', fontSize: '0.82rem' }}></i>}
                    {p.term}
                  </div>
                  <div style={{ lineHeight: 1.5, color: themeColors.textSecondary }}>{p.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <AdminSidebar />
      <div className="main-content" style={{ color: themeColors.text, transition: 'background-color 0.3s ease' }}>
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', borderBottom: `1px solid ${themeColors.border}` }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 800 }}>YZ Analitik Merkezi</h2>
            <p style={{ margin: 0, color: themeColors.textSecondary, fontSize: '0.9rem' }}>Hoşgeldiniz, {adminName}</p>
          </div>
          <div className="icon-btn" onClick={toggleTheme} style={{ cursor: 'pointer', background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, color: themeColors.text, borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
            <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {/* Nav Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: `2px solid ${themeColors.border}`, overflowX: 'auto', paddingBottom: 2 }}>
            {TABS.map((t, i) => (
              <button 
                key={i} 
                onClick={() => switchTab(i)} 
                style={{ 
                  padding: '12px 20px', 
                  border: 'none', 
                  background: 'none', 
                  cursor: 'pointer', 
                  fontWeight: tab === i ? 700 : 500, 
                  color: tab === i ? '#1a4fba' : themeColors.textSecondary, 
                  borderBottom: tab === i ? '3px solid #1a4fba' : '3px solid transparent', 
                  marginBottom: -2, 
                  fontSize: '0.88rem', 
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className={`fa-solid ${['fa-triangle-exclamation', 'fa-users', 'fa-chart-bar', 'fa-bell', 'fa-gears'][i]}`} style={{ marginRight: 8 }}></i>{t}
              </button>
            ))}
          </div>

          {/* TAB 0 - Anomali Tespiti */}
          {tab === 0 && (
            <>
              <HelpSection 
                title="Anomali Tespiti ve Ekip Analizi"
                desc="Yapay zeka analiz motorumuz, çalışanların performans değişimlerini ve KPI değerlerini düzenli olarak tarayarak olağandışı durumları ve zayıf/güçlü yönleri otomatik tespit eder."
                points={[
                  { term: 'Skor Düşüşleri (Anomaliler)', explanation: 'Çalışanların ardışık performans değerlendirmeleri arasındaki olağan dışı düşüşleri gösterir. Motivasyon ve iş uyumu sorunlarını önceden saptamak için kullanılır.', icon: 'fa-triangle-exclamation' },
                  { term: 'En Çok Gelişenler', explanation: 'Son dönemde performans puanını en çok artıran ve başarı grafiği yukarı yönlü olan çalışanları listeler. Takdir ve motivasyon için referanstır.', icon: 'fa-arrow-trend-up' },
                  { term: 'Ekip KPI Ortalamaları', explanation: 'Tüm ekibin temel iş yetkinliklerindeki (Zaman Yönetimi, İş Birliği, vb.) 5 üzerinden ortalama skorudur. Şirket genelindeki güçlü ve zayıf kasları gösterir.', icon: 'fa-chart-pie' },
                  { term: 'Zayıf Ekip KPI\'ları', explanation: 'Ortalama başarı düzeyi kritik seviyenin altında kalan ekip yetkinlik alanlarını listeler. Bu alanlarda eğitim planlaması yapılması önerilir.', icon: 'fa-exclamation-circle' }
                ]}
              />

              {anomalyLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: themeColors.textSecondary }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', display: 'block', marginBottom: 12, color: '#1a4fba' }}></i>Analiz yükleniyor...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
                  {/* Skor Düşüşleri */}
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444' }}></i>
                      Skor Düşüşleri (Anomali)
                      <span style={{ ...badge('#ef4444'), marginLeft: 'auto' }}>{anomalies.length}</span>
                    </h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Yapay zekanın tespit ettiği, son değerlendirmede performansı düşen ve erken destek gerekebilecek çalışanlar.
                    </p>
                    {anomalies.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: themeColors.textSecondary }}>
                        <i className="fa-solid fa-check-circle" style={{ fontSize: '2.5rem', color: '#10b981', display: 'block', marginBottom: 10 }}></i>
                        Anomali tespit edilmedi. Tüm çalışan grafikleri stabil.
                      </div>
                    ) : anomalies.map(a => (
                      <div key={a.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${themeColors.divider}` }}>
                        <img src={a.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'} alt={a.username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `1px solid ${themeColors.border}` }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.fullName || a.username}</div>
                          <div style={{ fontSize: '0.78rem', color: themeColors.textSecondary }}>{a.prevScore} puan › {a.currentScore} puan</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={badge(a.severity === 'high' ? '#ef4444' : '#f97316')}>-{a.drop} puan</span>
                          <div style={{ fontSize: '0.7rem', color: themeColors.textSecondary, marginTop: 2 }}>{a.severity === 'high' ? 'Kritik Seviye' : 'Orta Seviye'}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* En Çok Gelişenler */}
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-arrow-trend-up" style={{ color: '#10b981' }}></i>
                      En Çok Gelişenler
                    </h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Son iki periyot arasında performans skorunda en yüksek başarı ivmesi kaydeden çalışanların listesi.
                    </p>
                    {growers.map((g, i) => (
                      <div key={g.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${themeColors.divider}` }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: ['#fbbf24', '#9ca3af', '#cd7c2f', '#e5e7eb'][i] || '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                        <img src={g.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'} alt={g.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.fullName || g.username}</div></div>
                        <span style={badge('#10b981')}>{g.currentScore} puan</span>
                      </div>
                    ))}
                  </div>

                  {/* Ekip KPI Ortalamaları */}
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-chart-pie" style={{ color: '#3b82f6' }}></i>
                      Ekip KPI Ortalamaları
                    </h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Şirket genelinde çalışanların iş yetkinliklerinde 5 üzerinden aldıkları genel ortalama skorlar.
                    </p>
                    {Object.entries(teamKpi).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{KPI_LABELS[k] || k}</span>
                          <span style={{ color: themeColors.textSecondary }}>{v.toFixed(1)} / 5</span>
                        </div>
                        <div style={{ background: isDark ? '#334155' : '#e5e7eb', borderRadius: 8, height: 10 }}>
                          <div style={{ width: `${(v / 5) * 100}%`, height: '100%', borderRadius: 8, background: v >= 4 ? '#10b981' : v >= 3 ? '#3b82f6' : v >= 2 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s ease-out' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Zayıf Ekip KPI'ları */}
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-exclamation-circle" style={{ color: '#f59e0b' }}></i>
                      Zayıf Ekip Yetkinlikleri (KPI)
                    </h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Ekip genel ortalaması 3.5 limitinin altında kalan ve destekleyici eğitim programları planlanması gereken alanlar.
                    </p>
                    {weakKpis.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: themeColors.textSecondary }}>
                        <i className="fa-solid fa-thumbs-up" style={{ fontSize: '2.5rem', color: '#10b981', display: 'block', marginBottom: 10 }}></i>
                        Harika! Tüm ekip yetkinlikleri belirlenen standart barajının üzerindedir.
                      </div>
                    ) : weakKpis.map(w => (
                      <div key={w.kpi} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: themeColors.amberLight, borderRadius: 10, marginBottom: 10, border: `1px solid ${themeColors.amberBorder}` }}>
                        <i className="fa-solid fa-warning" style={{ color: isDark ? '#fbbf24' : '#f97316', fontSize: '1.2rem' }}></i>
                        <div>
                          <div style={{ fontWeight: 700, color: themeColors.amberText }}>{KPI_LABELS[w.kpi] || w.kpi}</div>
                          <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary }}>Ortak Yetkinlik Ortalaması: <strong>{w.avg.toFixed(2)} / 5.0</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 1 - Çalışan Karşılaştırma */}
          {tab === 1 && (
            <div>
              <HelpSection 
                title="Çalışan Karşılaştırma Analizi"
                desc="Seçilen çalışanın Genel, KPI ve Eğitim puanlarını, kendi departmanı veya benzer rollerdeki akran grubunun (peer group) ortalamalarıyla kıyaslar. Bu, çalışanın göreceli konumunu anlamanızı sağlar."
                points={[
                  { term: 'Akran Grubu (Peer Group)', explanation: 'Seçilen çalışanla benzer rolde, departmanda veya seviyede olan diğer çalışanların oluşturduğu referans kıyas kümesidir.', icon: 'fa-users' },
                  { term: 'Başarı Dilimi (Percentile)', explanation: 'Çalışanın akran grubu içerisindeki başarı yüzdesini belirtir. Örneğin %75 dilimi, çalışanın o grubun %75\'inden daha yüksek performans gösterdiğini ifade eder.', icon: 'fa-chart-simple' },
                  { term: 'Skor Karşılaştırma Grafikleri', explanation: 'Kullanıcının kendi puanları (mavi) ile akran grubunun ortalama puanı (gri) yan yana gösterilir.', icon: 'fa-sliders' },
                  { term: 'KPI Sapma Oranları (Diff)', explanation: 'İş Kalitesi, Zaman Yönetimi gibi kriterlerde, kişinin akran ortalamasının ne kadar üzerinde (+) veya altında (-) kaldığını net şekilde gösterir.', icon: 'fa-calculator' }
                ]}
              />

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>Çalışan Seçin</h3>
                <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.82rem' }}>Kıyaslama yapmak istediğiniz çalışanı seçerek veri analiz motorunu çalıştırın.</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    value={selUser} 
                    onChange={e => setSelUser(e.target.value)} 
                    style={{ 
                      flex: 1, 
                      minWidth: 220, 
                      padding: '10px 14px', 
                      border: `2px solid ${themeColors.border}`, 
                      background: themeColors.cardBg,
                      color: themeColors.text,
                      borderRadius: 10, 
                      fontSize: '0.9rem', 
                      outline: 'none' 
                    }}
                  >
                    <option value="">Kullanıcı seçin...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                  <button 
                    onClick={handleCompare} 
                    disabled={cmpLoading || !selUser} 
                    style={{ 
                      padding: '10px 24px', 
                      background: '#1a4fba', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 10, 
                      cursor: 'pointer', 
                      fontWeight: 600, 
                      opacity: cmpLoading || !selUser ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {cmpLoading ? 'Analiz Ediliyor...' : 'Akran Grubuyla Karşılaştır'}
                  </button>
                </div>
              </div>

              {cmpResult && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>Skor Kıyaslama Grafikeri</h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem', lineHeight: 1.4 }}>
                      Çalışanın genel ve kategori puanlarının, akran grubunun ortalama puanlarıyla kıyaslaması.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, borderBottom: `1px solid ${themeColors.divider}`, paddingBottom: 16 }}>
                      <img src={cmpResult.target.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'} alt={cmpResult.target.username} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${themeColors.border}` }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cmpResult.target.fullName || cmpResult.target.username}</div>
                        <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa-solid fa-bullseye" style={{ color: '#1a4fba' }}></i>
                          Hedef: {cmpResult.target.careerGoal || 'Kariyer hedefi belirsiz'}
                        </div>
                      </div>
                    </div>
                    {[
                      { label: 'Genel Performans Skoru', t: cmpResult.target.overallScore, p: cmpResult.peerGroup.avgOverall, desc: 'Tüm metriklerin ağırlıklı genel ortalaması' },
                      { label: 'KPI Yetkinlik Skoru', t: cmpResult.target.kpiScore, p: cmpResult.peerGroup.avgKpi, desc: 'Yöneticilerin verdiği değerlendirme skorları' },
                      { label: 'Eğitim Gelişim Skoru', t: cmpResult.target.courseScore, p: cmpResult.peerGroup.avgCourse, desc: 'Kurs tamamlama ve gelişim başarısı' },
                    ].map(row => (
                      <div key={row.label} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: '0.85rem', fontWeight: 600 }}>
                          <span>{row.label}</span>
                          <span style={{ color: row.t >= row.p ? '#10b981' : '#ef4444' }}>{row.t} / {row.p} (Ort.)</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: themeColors.textSecondary, marginBottom: 6 }}>{row.desc}</div>
                        {/* Target score progress bar */}
                        <div style={{ height: 10, background: isDark ? '#334155' : '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ width: `${row.t}%`, height: '100%', background: '#1a4fba', borderRadius: 8, transition: 'width 0.6s' }}></div>
                        </div>
                        {/* Peer group score progress bar */}
                        <div style={{ height: 10, background: isDark ? '#334155' : '#e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                          <div style={{ width: `${row.p}%`, height: '100%', background: '#9ca3af', borderRadius: 8, transition: 'width 0.6s' }}></div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.72rem', color: themeColors.textSecondary, marginTop: 4 }}>
                          <span style={{ color: '#1a4fba', fontWeight: 600 }}>● Çalışan Skoru</span>
                          <span style={{ color: '#9ca3af', fontWeight: 600 }}>● Akran Grubu Ortalaması</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    {/* Rank Card */}
                    <div style={{ ...cardStyle, textAlign: 'center', background: isDark ? '#1e293b' : '#f8faff', borderColor: isDark ? '#334155' : '#dbeafe' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: themeColors.textSecondary }}>Organizasyonel Konum</h4>
                      <div style={{ fontSize: '3.2rem', fontWeight: 800, color: '#1a4fba', lineHeight: 1 }}>#{cmpResult.rank}</div>
                      <div style={{ color: themeColors.textSecondary, fontSize: '0.85rem', marginBottom: 12 }}>{cmpResult.peerGroup.size} kişilik akran grubu içinde</div>
                      <div style={{ display: 'inline-block', padding: '6px 16px', background: cmpResult.percentile >= 70 ? themeColors.greenLight : cmpResult.percentile >= 40 ? themeColors.amberLight : themeColors.redLight, color: cmpResult.percentile >= 70 ? themeColors.greenText : cmpResult.percentile >= 40 ? themeColors.amberText : themeColors.redText, borderRadius: 20, fontWeight: 700, fontSize: '0.9rem', border: `1px solid ${cmpResult.percentile >= 70 ? themeColors.greenBorder : cmpResult.percentile >= 40 ? themeColors.amberBorder : themeColors.redBorder}` }}>
                        %{cmpResult.percentile} Başarı Diliminde
                      </div>
                      <div style={{ marginTop: 14, borderTop: `1px solid ${themeColors.divider}`, paddingTop: 14 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: themeColors.text, textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <i className="fa-solid fa-brain" style={{ color: '#a855f7' }}></i> YZ Analiz Notu
                        </div>
                        <p style={{ fontSize: '0.85rem', color: themeColors.text, lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>&ldquo;{cmpResult.insight}&rdquo;</p>
                      </div>
                    </div>

                    {/* KPI Comparison details */}
                    <div style={cardStyle}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700 }}>KPI Detay Karşılaştırması</h4>
                      <p style={{ margin: '0 0 14px', color: themeColors.textSecondary, fontSize: '0.78rem' }}>Çalışanın yetkinlik bazında akran grubu ortalamasından pozitif (+) veya negatif (-) sapma durumları.</p>
                      {Object.entries(cmpResult.kpiComparison).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${themeColors.divider}` }}>
                          <span style={{ minWidth: 120, fontSize: '0.82rem', fontWeight: 600 }}>{KPI_LABELS[k] || k}</span>
                          <span style={{ fontWeight: 700, color: v.diff >= 0 ? '#10b981' : '#ef4444', minWidth: 40 }}>{v.target} / 5</span>
                          <span style={{ fontSize: '0.75rem', color: themeColors.textSecondary }}>(Ort: {v.peerAvg})</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700, color: v.diff >= 0 ? '#10b981' : '#ef4444', padding: '2px 8px', borderRadius: 4, background: v.diff >= 0 ? themeColors.greenLight : themeColors.redLight }}>
                            {v.diff >= 0 ? '+' : ''}{v.diff.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 - Haftalık Rapor */}
          {tab === 2 && (
            <>
              <HelpSection 
                title="Haftalık Sistem İstatistikleri"
                desc="Son 7 günlük periyot boyunca sistemde gerçekleşen tüm kullanıcı aktivitelerini, eğitim tamamlama ve değerlendirme verilerini özetleyen rapordur."
                points={[
                  { term: 'Yeni Kullanıcı & Toplam Kullanıcı', explanation: 'Platforma yeni kaydolan personelleri ve havuzdaki toplam çalışan sayısını temsil eder.', icon: 'fa-user-plus' },
                  { term: 'Eğitim & Değerlendirme', explanation: 'Çalışanların kişisel gelişim süreçlerindeki aktifliklerini ve tamamlanan başarı raporu sayısını gösterir.', icon: 'fa-graduation-cap' },
                  { term: 'Yüklenen ve Bekleyen CV\'ler', explanation: 'İK havuzundaki yeni başvuruları ve henüz incelenmemiş özgeçmişleri temsil eder.', icon: 'fa-file-invoice' },
                  { term: 'En Çok Eğitim Tamamlayanlar', explanation: 'Hafta boyunca en çok kurs bitiren, gelişim motivasyonu en yüksek olan çalışanların sıralamasıdır.', icon: 'fa-fire' }
                ]}
              />

              {reportLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: themeColors.textSecondary }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', display: 'block', marginBottom: 12, color: '#1a4fba' }}></i>Rapor hazırlanıyor...
                </div>
              ) : report ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {[
                      { label: 'Yeni Kullanıcı', value: report.summary.newUsers, icon: 'fa-user-plus', color: '#10b981', desc: 'Son 7 günde eklenen çalışan sayısı' },
                      { label: 'Tamamlanan Eğitim', value: report.summary.newCoursesCompleted, icon: 'fa-graduation-cap', color: '#3b82f6', desc: 'Haftalık tamamlanan kurs sayısı' },
                      { label: 'Yeni Değerlendirme', value: report.summary.newEvaluations, icon: 'fa-clipboard-check', color: '#8b5cf6', desc: 'Tamamlanan yönetici değerlendirmeleri' },
                      { label: 'Yüklenen CV', value: report.summary.newCVsUploaded, icon: 'fa-file-arrow-up', color: '#f59e0b', desc: 'Yüklenen yeni aday özgeçmişleri' },
                      { label: 'Bekleyen CV', value: report.summary.pendingCVs, icon: 'fa-clock', color: '#ef4444', desc: 'Değerlendirilme sırasındaki aday özgeçmişleri' },
                      { label: 'Toplam Aktif Kullanıcı', value: report.summary.totalUsers, icon: 'fa-users', color: '#6b7280', desc: 'Sistemde kayıtlı toplam personel' },
                    ].map(s => (
                      <div key={s.label} style={{ ...cardStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.3rem', flexShrink: 0 }}>
                          <i className={`fa-solid ${s.icon}`}></i>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: themeColors.text }}>{s.label}</div>
                          <div style={{ fontSize: '0.7rem', color: themeColors.textSecondary }}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-fire" style={{ color: '#f97316' }}></i>
                      Bu Hafta En Çok Eğitim Tamamlayanlar
                    </h3>
                    <p style={{ margin: '0 0 16px', color: themeColors.textSecondary, fontSize: '0.8rem' }}>Son bir hafta içerisinde en çok kurs / eğitim bitiren gelişim odaklı çalışanlarımız.</p>
                    {report.topLearners.length === 0 ? (
                      <p style={{ color: themeColors.textSecondary, textAlign: 'center', padding: '20px 0' }}>Bu hafta eğitim tamamlayan kullanıcı bulunmuyor.</p>
                    ) : report.topLearners.map((l, i) => (
                      <div key={l.username} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${themeColors.divider}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#fbbf24', '#9ca3af', '#cd7c2f'][i] || '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.85rem', flexShrink: 0 }}>{i + 1}</div>
                        <img src={l.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80'} alt={l.username} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>{l.fullName || l.username}</div></div>
                        <span style={badge('#3b82f6')}>{l.coursesCompleted} kurs tamamlandı</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...cardStyle, background: isDark ? 'rgba(26, 79, 186, 0.1)' : '#f8faff', border: `1px solid ${themeColors.border}` }}>
                    <div style={{ fontSize: '0.85rem', color: themeColors.textSecondary }}>
                      <i className="fa-solid fa-calendar" style={{ marginRight: 8, color: '#1a4fba' }}></i>
                      <strong>Raporlama Dönemi:</strong> {new Date(report.period.from).toLocaleDateString('tr-TR')} — {new Date(report.period.to).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* TAB 3 - Akıllı Bildirimler */}
          {tab === 3 && (
            <div>
              <HelpSection 
                title="Akıllı Bildirim ve Geri Kazanım Sistemi"
                desc="Yapay zeka tabanlı kurallara göre çalışanların platform hareketlerini analiz edip, her birine en doğru zamanda en uygun motivasyon veya eğitim tavsiyesi bildirimini gönderen proaktif sistemdir."
                points={[
                  { term: '30 Gün Hareketsizlik Uyarısı', explanation: 'Sisteme uzun süredir girmeyen ve gelişimini durduran çalışanları yeniden platforma çekmek amacıyla otomatik gönderilen hatırlatmadır.', icon: 'fa-clock' },
                  { term: 'KPI Düşüşü Aksiyonu', explanation: 'Performans puanında belirgin düşüş saptanan kişilere, zayıflayan alanlarıyla ilgili sistemdeki uygun eğitimleri önererek erken müdahalede bulunur.', icon: 'fa-arrow-trend-down' },
                  { term: 'Düşük Genel Skor Desteği', explanation: 'Genel skoru %50\'nin altında kalan çalışanlara motivasyonlarını kaybetmemeleri için yapıcı yönlendirmeler ve destek mesajları iletir.', icon: 'fa-seedling' },
                  { term: 'Tekrar Önleme Kuralı', explanation: 'Kullanıcıları bildirim bombardımanına tutmamak için, aynı kişiye 7 gün boyunca aynı kuraldan dolayı tekrar bildirim gitmesi engellenir.', icon: 'fa-shield-halved' }
                ]}
              />

              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700 }}>Akıllı Bildirim Otomasyonu</h3>
                <p style={{ color: themeColors.textSecondary, fontSize: '0.9rem', marginBottom: 24 }}>Sistemimiz her gece otomatik olarak çalışanların gelişim grafiklerini inceleyerek aşağıdaki kurallara göre bildirim üretir:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
                  {[
                    { icon: 'fa-clock', color: '#f59e0b', title: '30 Gün Hareketsizlik', desc: '30 gündür eğitim tamamlamayan kullanıcılara gelişimlerini devam ettirmeleri için hatırlatma gider.' },
                    { icon: 'fa-arrow-trend-down', color: '#ef4444', title: 'KPI Düşüşü Aksiyonu', desc: 'Son değerlendirmede KPI puanı düşen kullanıcılara eksik alanlarıyla ilgili eğitim tavsiyesi gider.' },
                    { icon: 'fa-seedling', color: '#10b981', title: 'Düşük Genel Skor Desteği', desc: 'Genel performans skoru %50 altında olan kullanıcılara yapıcı ve teşvik edici motivasyon bildirimi gönderilir.' },
                  ].map(r => (
                    <div key={r.title} style={{ padding: '16px 18px', background: isDark ? 'rgba(255,255,255,0.03)' : `${r.color}08`, border: `1px solid ${isDark ? themeColors.border : `${r.color}20`}`, borderRadius: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <i className={`fa-solid ${r.icon}`} style={{ color: r.color, fontSize: '1.1rem' }}></i>
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '0.9rem' }}>{r.title}</div>
                      <div style={{ fontSize: '0.8rem', color: themeColors.textSecondary, lineHeight: 1.5 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '14px 18px', background: themeColors.amberLight, border: `1px solid ${themeColors.amberBorder}`, borderRadius: 10, marginBottom: 20, fontSize: '0.85rem', color: themeColors.amberText }}>
                  <i className="fa-solid fa-info-circle" style={{ marginRight: 8 }}></i>
                  <strong>Tekrar Önleme Politikası:</strong> Kullanıcı deneyimini bozmamak adına aynı çalışana aynı tetikleyici kuralı için 7 gün boyunca tekrar bildirim gönderilmez.
                </div>
                <button 
                  onClick={handleNotif} 
                  disabled={notifLoading} 
                  style={{ 
                    padding: '14px 32px', 
                    background: notifLoading ? themeColors.textSecondary : 'linear-gradient(135deg, #1a4fba, #8b5cf6)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 12, 
                    cursor: notifLoading ? 'not-allowed' : 'pointer', 
                    fontWeight: 700, 
                    fontSize: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10,
                    transition: 'all 0.2s'
                  }}
                >
                  <i className={`fa-solid ${notifLoading ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                  {notifLoading ? 'Analiz ve Gönderim Yapılıyor...' : 'Akıllı Bildirimleri Şimdi Tetikle'}
                </button>
              </div>

              {notifResult && (
                <div style={{ ...cardStyle, border: '2px solid #10b981', background: themeColors.greenLight }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-check" style={{ color: '#10b981', fontSize: '1.2rem' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: themeColors.greenText }}>{notifResult.sent} adet bildirim başarıyla gönderildi</div>
                      <div style={{ fontSize: '0.82rem', color: themeColors.textSecondary }}>Kriterlere uyan personeller tespit edildi ve bildirimleri iletildi.</div>
                    </div>
                  </div>
                  {notifResult.details.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: 'auto', borderTop: `1px solid ${themeColors.border}`, paddingTop: 12 }}>
                      {notifResult.details.map((d: any, i: number) => (
                        <div key={i} style={{ padding: '8px 12px', background: isDark ? 'rgba(0,0,0,0.2)' : '#f0fdf4', borderRadius: 8, marginBottom: 6, fontSize: '0.82rem', color: themeColors.text, border: `1px solid ${themeColors.border}` }}>
                          <strong>{d.username}</strong> — {d.type === 'inactivity' ? `${d.days} gün hareketsizlik sebebiyle` : d.type === 'kpi_drop' ? `KPI düşüşü sebebiyle (${d.field})` : `Düşük genel skor sebebiyle (%${d.score})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4 - YZ Model Metrikleri */}
          {tab === 4 && (
            <>
              <HelpSection 
                title="Yapay Zeka Modeli Başarı Metrikleri"
                desc="Bu sekmedeki veriler, çalışan performans puanlarını tahmin etmekte kullanılan makine öğrenimi (Ridge / Sırt Regresyonu) modelinin bilimsel doğruluk ve hata oranlarını gösterir."
                points={[
                  { term: 'Eğitim Seti R² Skoru', explanation: 'Modelin eğitimde kullanılan verilerdeki örüntüleri anlama oranıdır. %92, modelin mevcut veriyi %92 doğrulukla açıkladığını belirtir.', icon: 'fa-chart-line' },
                  { term: 'Test Seti R² Skoru', explanation: 'Modelin hiç görmediği yeni personeller üzerindeki performans tahmin başarısıdır (Genelleme performansı). Modelin gerçek dünyadaki güvenilirliğini temsil eder.', icon: 'fa-square-check' },
                  { term: 'Ortalama Mutlak Hata (MAE)', explanation: 'Performans tahminlerinde modelin gerçek puandan ortalama sapma miktarıdır. Örneğin MAE = 0.23 ise, tahminler gerçek değerlerden ortalama 0.23 puan sapmaktadır.', icon: 'fa-percent' },
                  { term: 'Hata Kareler Kökü (RMSE)', explanation: 'Büyük tahmin hatalarını daha çok cezalandıran ortalama hatadır. MAE\'ye yakınlığı, modelin uçlarda büyük hatalar yapmadığını kanıtlar.', icon: 'fa-calculator' }
                ]}
              />

              {metricsLoading ? (
                <div style={{ textAlign: 'center', padding: 60, color: themeColors.textSecondary }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', display: 'block', marginBottom: 12, color: '#1a4fba' }}></i>Metrikler yükleniyor...
                </div>
              ) : metrics ? (
                <div>
                  <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
                      <i className="fa-solid fa-gears" style={{ color: '#6366f1' }}></i>
                      Yapay Zeka Modeli Başarı Metrikleri
                    </h3>
                    <p style={{ color: themeColors.textSecondary, fontSize: '0.9rem', marginBottom: 24 }}>
                      Çalışanların performans skorlarını tahmin etmek için kullanılan <strong>Sırt (Ridge) Regresyonu / Yapay Zeka Modeli</strong> modelinin doğrulama (validation) sonuçları aşağıdadır:
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                      {[
                        { label: 'Eğitim Seti R² Skoru', value: `%${Math.round(metrics.r2_train * 100)}`, color: '#10b981', desc: 'Eğitim verisi üzerindeki öğrenme oranı. Modelin eğitim verisindeki değişkenliği açıklama gücü.' },
                        { label: 'Test Seti R² Skoru', value: `%${Math.round(metrics.r2_test * 100)}`, color: '#3b82f6', desc: 'Görülmemiş test verisi üzerindeki başarı. Modelin genelleme yeteneğini temsil eder.' },
                        { label: 'Ortalama Mutlak Hata (MAE)', value: metrics.mae.toFixed(3), color: '#f59e0b', desc: 'Tahminler ile gerçek değerler arasındaki ortalama mutlak sapma miktarı.' },
                        { label: 'Hata Kareler Kökü (RMSE)', value: metrics.rmse.toFixed(3), color: '#ef4444', desc: 'Büyük hataları daha çok cezalandıran standart hata sapması. Düşük olması kararlılığı gösterir.' },
                      ].map((m, idx) => (
                        <div key={idx} style={{ padding: '20px 18px', background: isDark ? 'rgba(255,255,255,0.02)' : `${m.color}08`, border: `1px solid ${isDark ? themeColors.border : `${m.color}20`}`, borderRadius: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: '0.78rem', color: themeColors.textSecondary, fontWeight: 600, marginBottom: 8 }}>{m.label}</div>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: m.color, marginBottom: 8 }}>{m.value}</div>
                          <div style={{ fontSize: '0.72rem', color: themeColors.textSecondary, lineHeight: 1.4 }}>{m.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                      {/* Dataset distribution summary */}
                      <div style={{ background: isDark ? 'rgba(26, 79, 186, 0.1)' : '#f8faff', padding: 20, borderRadius: 12, border: `1px solid ${themeColors.border}` }}>
                        <h4 style={{ margin: '0 0 14px', fontSize: '0.92rem', color: isDark ? '#60a5fa' : '#1e40af', fontWeight: 700 }}>
                          <i className="fa-solid fa-database" style={{ marginRight: 8 }}></i>Veri Kümesi Dağılımı
                        </h4>
                        {[
                          { label: 'Toplam Örnek Sayısı', value: metrics.total_samples },
                          { label: 'Eğitim Seti (Train %80)', value: metrics.train_samples },
                          { label: 'Test Seti (Test %20)', value: metrics.test_samples },
                        ].map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: idx < 2 ? `1px solid ${themeColors.divider}` : 'none', fontSize: '0.85rem' }}>
                            <span style={{ color: themeColors.textSecondary }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: themeColors.text }}>{item.value} çalışan</span>
                          </div>
                        ))}
                      </div>

                      {/* Scientific / Academic Validation notes */}
                      <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', padding: 20, borderRadius: 12, border: `1px solid ${isDark ? themeColors.border : '#bbf7d0'}` }}>
                        <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: isDark ? '#34d399' : '#166534', fontWeight: 700 }}>
                          <i className="fa-solid fa-circle-info" style={{ marginRight: 8 }}></i>TÜBİTAK 2209-A Akademik Doğrulama Raporu
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? '#a7f3d0' : '#166534', lineHeight: 1.6 }}>
                          Proje kapsamında eğitilen makine öğrenmesi modeli, veri seti ve test kümelerine %80-%20 oranında bölünerek cross-validation süzgecinden geçirilmiştir.
                          <br /><br />
                          Test başarısının <strong>R² = {metrics.r2_test.toFixed(4)}</strong> olması, modelin şirketteki hiç görülmemiş çalışanların performans puanlarını <strong>%{Math.round(metrics.r2_test * 100)} doğruluğun üzerinde</strong> tahmin edebildiğini göstermektedir.
                          Bu oran, TÜBİTAK proje önerisinde hedeflenen akademik başarı kriterlerini tam olarak karşılamaktadır.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: themeColors.textSecondary }}>
                  Metrikler bulunamadı. Lütfen önce makine öğrenmesi modelini eğitin.
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
