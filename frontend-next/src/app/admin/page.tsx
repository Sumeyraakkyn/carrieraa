'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Activity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

type KpiKey = 'kalite' | 'sorumluluk' | 'birligi' | 'zaman';
type AnomalyData = {
  anomalies: Array<{ id?: string; fullName?: string; username?: string; drop: number; severity: string }>;
  teamKpiAvg: Record<KpiKey, number>;
  weakTeamKpis: Array<{ kpi: KpiKey; avg: number }>;
};

type WeeklyData = {
  summary: {
    newUsers: number;
    newCoursesCompleted: number;
    newEvaluations: number;
    newCVsUploaded: number;
    pendingCVs: number;
  };
};

const KPI_LABELS: Record<KpiKey, string> = {
  kalite: 'İş Kalitesi',
  sorumluluk: 'Sorumluluk',
  birligi: 'İş Birliği',
  zaman: 'Zaman Yönetimi',
};

const asNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export default function AdminDashboard() {
  useAuthGuard('ADMIN');
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [pendingCVs, setPendingCVs] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setLoadError('');
    const headers = { Authorization: `Bearer ${token}` };

    const [usersResult, statsResult, anomalyResult, weeklyResult] = await Promise.allSettled([
      fetch(`${API_URL}/api/users`, { headers }),
      fetch(`${API_URL}/api/admin/dashboard-stats`, { headers }),
      fetch(`${API_URL}/api/ai/admin/anomalies`, { headers }),
      fetch(`${API_URL}/api/ai/admin/weekly-report`, { headers }),
    ]);

    let failedRequests = 0;

    if (usersResult.status === 'fulfilled' && usersResult.value.ok) {
      const users = await usersResult.value.json();
      setTotalUsers(Array.isArray(users) ? users.length : asNumber(users?.total));
      setTotalCourses(Array.isArray(users)
        ? users.reduce((sum: number, user: { courses?: unknown[] }) => sum + (Array.isArray(user.courses) ? user.courses.length : 0), 0)
        : 0);
    } else {
      failedRequests += 1;
    }

    if (statsResult.status === 'fulfilled' && statsResult.value.ok) {
      const stats = await statsResult.value.json();
      setPendingCVs(asNumber(stats?.pendingCount));
      setActivities(Array.isArray(stats?.recentUsers) ? stats.recentUsers : []);
    } else {
      failedRequests += 1;
    }

    if (anomalyResult.status === 'fulfilled' && anomalyResult.value.ok) {
      const data = await anomalyResult.value.json();
      setAnomalyData({
        anomalies: Array.isArray(data?.anomalies) ? data.anomalies : [],
        teamKpiAvg: data?.teamKpiAvg || { kalite: 0, sorumluluk: 0, birligi: 0, zaman: 0 },
        weakTeamKpis: Array.isArray(data?.weakTeamKpis) ? data.weakTeamKpis : [],
      });
    } else {
      failedRequests += 1;
    }

    if (weeklyResult.status === 'fulfilled' && weeklyResult.value.ok) {
      const data = await weeklyResult.value.json();
      setWeeklyData(data);
    } else {
      failedRequests += 1;
    }

    if (failedRequests) setLoadError('Bazı yönetim verileri şu an alınamadı. Yenileyerek tekrar deneyebilirsin.');
    setDashboardLoading(false);
  }, []);

  useEffect(() => {
    setHasSession(Boolean(localStorage.getItem('token')));
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const syncTheme = () => setIsDark(document.body.classList.contains('dark-mode'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const nextTheme = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', nextTheme ? 'true' : 'false');
    setIsDark(nextTheme);
  }

  if (hasSession === null || !hasSession) {
    return <div className="app-container"><div className="loading">Yönetim paneli hazırlanıyor...</div></div>;
  }

  const riskCount = anomalyData?.anomalies.length || 0;
  const weakKpis = anomalyData?.weakTeamKpis || [];
  const kpis = anomalyData?.teamKpiAvg || { kalite: 0, sorumluluk: 0, birligi: 0, zaman: 0 };

  return (
    <div className={`admin-container${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <AdminSidebar onCollapsedChange={setSidebarCollapsed} />
      <main className="admin-main">
        <section className="admin-header" style={{ marginBottom: 24 }}>
          <div>
            <p style={{ color: 'var(--muted-text)', fontSize: 14, margin: '0 0 6px' }}>Carriera yönetim paneli</p>
            <h1 style={{ margin: 0 }}>Yönetici Merkezi</h1>
            <p style={{ color: 'var(--muted-text)', margin: '8px 0 0' }}>Ekibin nabzını izle, bekleyen işleri hızla yönet.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="admin-dashboard-icon-btn" onClick={toggleTheme} aria-label={isDark ? 'Açık moda geç' : 'Koyu moda geç'} title={isDark ? 'Açık moda geç' : 'Koyu moda geç'}><i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`} /></button>
            <button className="btn btn-secondary" onClick={loadDashboard} disabled={dashboardLoading}>
              {dashboardLoading ? 'Yenileniyor...' : '↻ Verileri Yenile'}
            </button>
          </div>
        </section>

        {loadError && <div className="alert alert-warning" style={{ marginBottom: 18 }}>{loadError}</div>}

        <section className="stats-grid" aria-label="Genel durum">
          <article className="stat-card"><div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>👥</div><div><p>Toplam Kullanıcı</p><h2>{totalUsers}</h2><small>Platformdaki kayıtlı kullanıcılar</small></div></article>
          <article className="stat-card"><div className="stat-icon" style={{ background: '#dcfce7', color: '#15803d' }}>📚</div><div><p>Tamamlanan Eğitim</p><h2>{totalCourses}</h2><small>Ekipteki toplam eğitim adedi</small></div></article>
          <article className="stat-card"><div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>📄</div><div><p>İncelenecek CV</p><h2>{pendingCVs}</h2><small>Onay veya geri bildirim bekliyor</small></div></article>
          <article className="stat-card"><div className="stat-icon" style={{ background: riskCount ? '#fee2e2' : '#dcfce7', color: riskCount ? '#dc2626' : '#15803d' }}>⚡</div><div><p>YZ Risk Sinyali</p><h2>{riskCount}</h2><small>{riskCount ? 'Puan düşüşü tespit edildi' : 'Kritik düşüş görünmüyor'}</small></div></article>
        </section>

        <section className="admin-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, .8fr)', gap: 20, marginTop: 24 }}>
          <div className="admin-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }}>
              <div><h2 style={{ margin: 0, fontSize: 19 }}>Hızlı Aksiyon Merkezi</h2><p style={{ margin: '6px 0 0', color: 'var(--muted-text)' }}>Öncelikli işleri doğrudan ilgili ekrana taşı.</p></div>
              <Link href="/admin/ai-analytics" className="text-link">Detaylı analiz →</Link>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <Link href="/admin/cv-review" className="admin-action-card"><span className="admin-action-icon">📄</span><span><strong>{pendingCVs ? `${pendingCVs} CV inceleme bekliyor` : 'CV inceleme kuyruğu boş'}</strong><small>CV doğruluğunu kontrol et ve geri bildirim ver.</small></span><b>→</b></Link>
              <Link href="/admin/ai-analytics" className="admin-action-card"><span className="admin-action-icon">⚡</span><span><strong>{riskCount ? `${riskCount} kullanıcıda gelişim riski var` : 'Kritik gelişim riski bulunmuyor'}</strong><small>YZ tespitlerini ve kullanıcı eğilimlerini incele.</small></span><b>→</b></Link>
              <Link href="/admin/education" className="admin-action-card"><span className="admin-action-icon">🎯</span><span><strong>{weakKpis.length ? `${weakKpis.length} ekip yetkinliği destek bekliyor` : 'Ekip yetkinlikleri dengeli görünüyor'}</strong><small>Eğitimleri ekip ihtiyaçlarına göre planla.</small></span><b>→</b></Link>
            </div>
          </div>

          <aside className="admin-card" style={{ padding: 22, background: 'linear-gradient(135deg, #172554, #243b7b)', color: 'white' }}>
            <p style={{ margin: 0, opacity: .72, fontSize: 13 }}>SON 7 GÜN</p>
            <h2 style={{ margin: '8px 0 20px', fontSize: 20 }}>Haftalık hareket</h2>
            <div className="weekly-metric"><span>Yeni kullanıcı</span><b>{weeklyData?.summary?.newUsers || 0}</b></div>
            <div className="weekly-metric"><span>Tamamlanan eğitim</span><b>{weeklyData?.summary?.newCoursesCompleted || 0}</b></div>
            <div className="weekly-metric"><span>Yapılan değerlendirme</span><b>{weeklyData?.summary?.newEvaluations || 0}</b></div>
            <div className="weekly-metric"><span>Yüklenen CV</span><b>{weeklyData?.summary?.newCVsUploaded || 0}</b></div>
            <Link href="/admin/ai-analytics" style={{ color: 'white', display: 'inline-block', marginTop: 18, fontWeight: 700 }}>Haftalık raporu aç →</Link>
          </aside>
        </section>

        <section className="admin-dashboard-grid admin-dashboard-bottom" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, .8fr)', gap: 20, marginTop: 20, paddingBottom: 36 }}>
          <div className="admin-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><div><h2 style={{ margin: 0, fontSize: 19 }}>Ekip Yetkinlik Nabzı</h2><p style={{ margin: '6px 0 0', color: 'var(--muted-text)' }}>Son değerlendirmelerin 5 üzerinden ortalaması.</p></div><Link href="/admin/skills" className="text-link">Yetkinlikler →</Link></div>
            <div style={{ display: 'grid', gap: 16 }}>
              {(Object.keys(KPI_LABELS) as KpiKey[]).map((key) => {
                const score = Math.min(5, Math.max(0, asNumber(kpis[key])));
                const isWeak = weakKpis.some((item) => item.kpi === key);
                return <div key={key}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}><span style={{ fontWeight: 600, color: 'var(--text-color)' }}>{KPI_LABELS[key]}</span><strong style={{ color: isWeak ? '#dc2626' : '#2563eb' }}>{score.toFixed(1)} / 5</strong></div><div style={{ height: 9, background: 'var(--surface-muted)', borderRadius: 999 }}><div style={{ height: '100%', width: `${score * 20}%`, background: isWeak ? '#f97316' : 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: 999, transition: 'width .3s' }} /></div></div>;
              })}
            </div>
          </div>
          <div className="recent-activities" style={{ margin: 0 }}>
            <div className="section-header"><div><h2>Son Hareketler</h2><p>Platforma yeni katılanlar</p></div></div>
            {activities.length ? activities.slice(0, 5).map((activity, index) => <div className="activity-item" key={activity.id || `${activity.type}-${activity.createdAt}-${index}`}><div className="activity-icon">👤</div><div><strong>{activity.description || activity.type}</strong><p>{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('tr-TR') : 'Yeni etkinlik'}</p></div></div>) : <div style={{ padding: '24px 0', color: 'var(--muted-text)' }}>{dashboardLoading ? 'Veriler hazırlanıyor...' : 'Henüz gösterilecek hareket yok.'}</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
