'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { COURSE_CATEGORY_LABELS, getCourseProgress } from '@/data/courseCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const categoryNames = COURSE_CATEGORY_LABELS;

function getRole(pct: number) {
  if (pct >= 100) return 'Yonetici';
  if (pct >= 75) return 'Yonetici Adayi';
  if (pct >= 50) return 'Kidemli Uzman';
  if (pct >= 25) return 'Gelisen Uzman';
  if (pct > 0) return 'Baslangic Seviyesi';
  return 'Henuz Baslamadi';
}

interface EmpData { id: number; name: string; progress: number; catProgress: Record<string, number>; avatarUrl: string }

export default function AdminProgressPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yonetici');
  const [employees, setEmployees] = useState<EmpData[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    setAdminName(localStorage.getItem('currentAdmin') || 'Yonetici');
    loadData();  }, []);

  async function loadData() {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const users = await res.json();

      const emps: EmpData[] = users
        .filter((u: { role: string }) => u.role === 'USER')
        .map((u: { id: number; username: string; courses?: { courseId: string }[]; profile?: { avatarUrl?: string | null } }) => {
          const completedIds = (u.courses || []).map((c: { courseId: string }) => c.courseId);
          const courseProgress = getCourseProgress(completedIds);
          return {
            id: u.id,
            name: u.username,
            progress: courseProgress.percentage,
            catProgress: courseProgress.categoryProgress,
            avatarUrl: u.profile?.avatarUrl ? `${API_URL}${u.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.username)}`,
          };
        })
        .sort((a: EmpData, b: EmpData) => b.progress - a.progress);

      setEmployees(emps);
      if (emps.length > 0) {
        setOverallScore(Math.round(emps.reduce((s: number, e: EmpData) => s + e.progress, 0) / emps.length));
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <AdminSidebar />
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px' }}>
          <div><h2>Ilerleme & Gelisim</h2><p>Hosgeldiniz, {adminName}</p></div>
          <div className="icon-btn" onClick={toggleTheme}><i className="fa-solid fa-moon"></i></div>
        </header>

        <div className="page-content" style={{ backgroundColor: 'var(--bg-color)' }}>
          <div className="admin-dashboard-container">
            <div className="top-score-card">
              <div className="score-section">
                <h2>Genel Yetkinlik Skoru</h2>
                <div className="score-bar-container">
                  <div className="score-bar-fill" style={{ width: `${overallScore}%` }}>%{overallScore}</div>
                </div>
                <p className="score-desc">Tum ekibin gelisim yuzdesi %{overallScore}</p>
              </div>
              <div className="momentum-section">
                <h3>İlerleme verisi</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '.88rem', lineHeight: 1.55 }}>
                  Aylık ivme için aynı çalışan hakkında en az iki farklı dönemde değerlendirme gerekir.
                  Yeni değerlendirmeler geldikçe burada gerçek eğilim gösterilir.
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Yukleniyor...</div>
            ) : (
              <div className="employees-grid">
                {employees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#888', gridColumn: '1/-1' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: '3rem', color: '#ddd', marginBottom: 15, display: 'block' }}></i>
                    <h3>Henuz Kullanici Yok</h3>
                  </div>
                ) : (
                  employees.map(emp => {
                    const role = getRole(emp.progress);
                    const topCats = Object.entries(emp.catProgress).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    const cats = Object.keys(categoryNames);
                    return (
                      <div key={emp.id} className="emp-card">
                        <div className="emp-header">
                          <img src={emp.avatarUrl} alt={emp.name} className="emp-avatar" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                          <div className="emp-info"><h4>{emp.name}</h4><span>{role}</span></div>
                        </div>
                        <div className="emp-section">
                          <h5>Yetkinlikler</h5>
                          {topCats.map(([cat, pct]) => (
                            <div key={cat} className="comp-row">
                              <label>{categoryNames[cat]}</label>
                              <div className="comp-bar">
                                <div className={`comp-fill ${pct >= 80 ? 'blue' : pct >= 40 ? 'light-blue' : 'red'}`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="emp-section">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><h5>Gorevler</h5><h5>Durum</h5></div>
                          {cats.filter(cat => emp.catProgress[cat] < 100).slice(0, 2).map(cat => (
                            <div key={cat} className="task-row">
                              <span>{categoryNames[cat]} Egitimini Tamamla</span>
                              <span className="task-badge ongoing">{emp.catProgress[cat] > 0 ? 'Devam Ediyor' : 'Baslamadi'}</span>
                            </div>
                          ))}
                          {cats.filter(cat => emp.catProgress[cat] >= 100).slice(0, 1).map(cat => (
                            <div key={cat} className="task-row">
                              <span>{categoryNames[cat]} Egitimini Tamamla</span>
                              <span className="task-badge completed">Tamamlandi</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
