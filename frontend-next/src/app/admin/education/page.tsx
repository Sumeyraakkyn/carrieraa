'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { COURSE_CATALOG, COURSE_CATEGORY_LABELS, getCourseProgress } from '@/data/courseCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Employee {
  id: number;
  username: string;
  fullName: string;
  percentage: number;
  egitimOnerisi: string;
  kariyerHedefi: string | null;
  avatarUrl: string;
  categoryProgress: Record<string, number>;
  completedCourseIds: string[];
}

export default function AdminEducationPage() {
  useAuthGuard('ADMIN');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [adminName, setAdminName] = useState('Yonetici');
  const [detailUser, setDetailUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    setAdminName(localStorage.getItem('currentAdmin') || 'Yonetici');
    loadEmployees();  }, []);

  async function loadEmployees() {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const users = await res.json();

      const emps: Employee[] = users
        .filter((u: { role: string }) => u.role === 'USER')
        .map((u: { id: number; username: string; courses?: { courseId: string }[]; profile?: { avatarUrl?: string | null; fullName?: string | null; careerGoal?: string | null } }) => {
          const completedCourseIds = (u.courses || []).map((c: { courseId: string }) => c.courseId);
          const progress = getCourseProgress(completedCourseIds);
          return {
            id: u.id,
            username: u.username,
            fullName: u.profile?.fullName || u.username,
            percentage: progress.percentage,
            egitimOnerisi: progress.nextCourse?.name || 'Katalogdaki tüm eğitimler tamamlandı',
            kariyerHedefi: u.profile?.careerGoal || null,
            avatarUrl: u.profile?.avatarUrl ? `${API_URL}${u.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.username)}`,
            categoryProgress: progress.categoryProgress,
            completedCourseIds,
          };
        })
        .sort((a: Employee, b: Employee) => b.percentage - a.percentage);

      setEmployees(emps);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  const filtered = employees.filter(e => !search || e.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AdminSidebar />
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px' }}>
          <div><h2>Egitim ve Oneri Yonetici Ekrani</h2><p>Hosgeldiniz, {adminName}</p></div>
          <div className="icon-btn" onClick={toggleTheme}><i className="fa-solid fa-moon"></i></div>
        </header>

        <div style={{ padding: '30px 40px' }}>
          <h2 style={{ marginBottom: 20 }}>Egitim ve Oneriler</h2>
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 30 }}>
            <input type="text" placeholder="Calisan Adi Ara..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 45px 12px 18px', border: '2px solid var(--border-color, #e0e0e0)', background: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: 12, fontSize: '0.9rem', outline: 'none' }} />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Yukleniyor...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
              <i className="fa-solid fa-users-slash" style={{ fontSize: '3rem', marginBottom: 15, display: 'block' }}></i>
              <h3>Henuz kayitli calisan yok</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {filtered.map(emp => {
                const progressColor = emp.percentage >= 75 ? '#4CAF50' : emp.percentage >= 40 ? '#FF9800' : '#4fc3f7';
                return (
                  <div key={emp.id} style={{ background: 'var(--card-bg, #fff)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                      <img src={emp.avatarUrl} alt={emp.username} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{emp.username}</div></div>
                      <div style={{ cursor: 'pointer', color: '#999' }} onClick={() => setDetailUser(emp)}><i className="fa-solid fa-eye"></i></div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 2 }}>Egitim Onerisi</div>
                      <div style={{ fontSize: '0.9rem' }}>{emp.egitimOnerisi}</div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ background: '#e8e8e8', borderRadius: 10, height: 10, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ width: `${emp.percentage}%`, height: '100%', background: progressColor, borderRadius: 10 }}></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>%{emp.percentage} Tamamlanan</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 2 }}>Kariyer Onerisi</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{emp.kariyerHedefi || 'Kariyer hedefi belirtilmemiş'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {detailUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDetailUser(null)}>
            <div style={{ background: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: 16, padding: 30, maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ marginBottom: 20 }}>{detailUser.username} - Egitim Detaylari</h3>
              {Object.entries(COURSE_CATEGORY_LABELS).map(([cat, name]) => {
                const pct = detailUser.categoryProgress[cat] || 0;
                const total = COURSE_CATALOG.filter((course) => course.category === cat).length;
                const done = Math.round((pct / 100) * total);
                const color = pct >= 100 ? '#4CAF50' : pct >= 50 ? '#FF9800' : '#4fc3f7';
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <span style={{ minWidth: 140, fontSize: '0.85rem', fontWeight: 500 }}>{name}</span>
                    <div style={{ flex: 1, height: 8, background: '#e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8 }}></div>
                    </div>
                    <span style={{ minWidth: 35, textAlign: 'right', fontSize: '0.82rem', fontWeight: 600 }}>{done}/{total}</span>
                  </div>
                );
              })}
              <button onClick={() => setDetailUser(null)} style={{ marginTop: 10, padding: '8px 20px', background: '#e0e0e0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Kapat</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
