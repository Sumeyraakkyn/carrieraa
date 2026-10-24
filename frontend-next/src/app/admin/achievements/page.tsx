'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { COURSE_CATALOG, getCourseProgress } from '@/data/courseCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const POINTS_PER_COURSE = 500;

function getLevel(points: number) {
  if (points >= 5000) return { name: 'Altin Seviye', color: '#ecc94b', icon: 'fa-star' };
  if (points >= 3000) return { name: 'Gumus Seviye', color: '#a0aec0', icon: 'fa-star' };
  if (points >= 1000) return { name: 'Bronz Seviye', color: '#cd7f32', icon: 'fa-star' };
  return { name: 'Baslangic', color: '#999', icon: 'fa-circle' };
}

interface UserData { id: number; name: string; points: number; completedCount: number; level: ReturnType<typeof getLevel>; score: number; avatarUrl: string }

export default function AdminAchievementsPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yonetici');
  const [userData, setUserData] = useState<UserData[]>([]);
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
      const totalCourses = COURSE_CATALOG.length;

      const data: UserData[] = users
        .filter((u: { role: string }) => u.role === 'USER')
        .map((u: { id: number; username: string; courses?: { courseId: string }[]; profile?: { avatarUrl?: string | null } }) => {
          const completedIds = (u.courses || []).map((c: { courseId: string }) => c.courseId);
          const completed = getCourseProgress(completedIds).completedCount;
          const points = completed * POINTS_PER_COURSE;
          const score = totalCourses > 0 ? parseFloat(((completed / totalCourses) * 5).toFixed(1)) : 0;
          return {
            id: u.id,
            name: u.username,
            points,
            completedCount: completed,
            level: getLevel(points),
            score,
            avatarUrl: u.profile?.avatarUrl ? `${API_URL}${u.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.username)}`,
          };
        })
        .sort((a: UserData, b: UserData) => b.points - a.points);

      setUserData(data);
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
          <div><h2>Basari & Puanlama</h2><p>Hosgeldiniz, {adminName}</p></div>
          <div className="icon-btn" onClick={toggleTheme}><i className="fa-solid fa-moon"></i></div>
        </header>

        <div className="page-content" style={{ backgroundColor: 'var(--bg-color)', padding: 40 }}>
          <div className="basari-dashboard-container">
            <div className="main-basari-card">
              <div className="basari-header" style={{ marginBottom: 40 }}><h2>Basari & Puanlama</h2></div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Yukleniyor...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                  <div>
                    {userData.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#888', padding: 40 }}>Henuz kullanici yok</p>
                    ) : (
                      userData.map((u, i) => (
                        <div key={u.id}>
                          {i > 0 && <hr style={{ border: 0, borderTop: '1px solid #cbd5e1', margin: '20px 0' }} />}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <img src={u.avatarUrl} alt={u.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                <i className={`fa-solid ${u.level.icon}`} style={{ color: u.level.color }}></i> {u.level.name}
                              </div>
                            </div>
                            <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '1.1rem' }}>{u.points.toLocaleString('tr-TR')} puan</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr><th className="achievement-list-heading" colSpan={3} style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa' }}>Basari Listesi</th></tr>
                      </thead>
                      <tbody>
                        {userData.length === 0 ? (
                          <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888', padding: 30 }}>Henuz siralama yok</td></tr>
                        ) : (
                          userData.map((u, i) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '10px 8px', fontWeight: 700, color: i === 0 ? '#ecc94b' : i === 1 ? '#a0aec0' : i === 2 ? '#cd7f32' : '#666' }}>{i + 1}</td>
                              <td style={{ padding: '10px 8px' }}>{u.name}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{ fontWeight: 700 }}>{u.score}</span>
                                <div style={{ background: '#e0e0e0', borderRadius: 4, height: 6, marginTop: 4 }}>
                                  <div style={{ width: `${Math.min(u.score / 5 * 100, 100)}%`, height: '100%', background: '#4fc3f7', borderRadius: 4 }}></div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
