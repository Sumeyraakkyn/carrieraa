'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';
import { COURSE_CATEGORY_LABELS, getCourseProgress } from '@/data/courseCatalog';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProgressPage() {
  useAuthGuard('USER');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [competencies, setCompetencies] = useState({ liderlik: 0, stratejik: 0, cevik: 0 });

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    const user = localStorage.getItem('currentUser') || '';
    setUsername(user);
    setAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user)}`);

    const token = localStorage.getItem('token');
    if (token) {
      // Fetch avatar
      fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p?.avatarUrl) setAvatarUrl(`${API_URL}${p.avatarUrl}`); })
        .catch(() => {});
        
      // Fetch progress — kategori bazlı gerçek veri
      fetch(`${API_URL}/api/courses/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((courses: { courseId: string }[]) => {
          const ids = courses.map(c => c.courseId);
          const progress = getCourseProgress(ids);
          setCompetencies({
            liderlik: progress.categoryProgress.liderlik || 0,
            stratejik: progress.categoryProgress.stratejik || 0,
            cevik: progress.categoryProgress.cevik || 0,
          });
        })
        .catch(() => {});
    }  }, []);

  function getProgressLabel(pct: number) {
    if (pct < 40) return 'Başlangıç';
    if (pct < 70) return 'Orta';
    return 'İleri';
  }

  const avg = Object.values(competencies).reduce((sum, value) => sum + value, 0) / Object.values(competencies).length;
  const name = username.split('@')[0] || username;

  function getGoalInfo() {
    if (avg >= 100) return '🎉 Yönetici Seviyesine Ulaştınız!';
    if (avg >= 75) return `Yöneticiye Geçiş: %${Math.round(avg)} tamamlandı ↑`;
    return `Kariyer Hedefi: %${Math.round(avg)} ilerleme`;
  }

  const skills = [
    { key: 'liderlik', name: COURSE_CATEGORY_LABELS.liderlik, pct: competencies.liderlik },
    { key: 'stratejik', name: COURSE_CATEGORY_LABELS.stratejik, pct: competencies.stratejik },
    { key: 'cevik', name: COURSE_CATEGORY_LABELS.cevik, pct: competencies.cevik },
  ];

  const recommendations = skills
    .filter(s => s.pct < 100)
    .map(s => ({
      category: s.name,
      priority: s.pct < 40 ? 'high' : s.pct < 70 ? 'medium' : 'low',
      message: s.pct < 40 ? `${s.name} eğitimlerine başla.` : s.pct < 70 ? `%${s.pct} ilerlemen var. Devam et!` : `Son eğitimi tamamlayarak %100'e ulaş.`,
    }));

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/ilerleme-gelisim.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content progress-page">
          <div className="user-header">
            <div className="user-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <i className="fa-solid fa-user" aria-hidden="true" />}
            </div>
            <div className="user-details">
              <h1>İLERLEME & GELİŞİM</h1>
              <p>{username}</p>
              <p className="role-info">Mevcut Rol: <span>{avg >= 75 ? 'Yönetici Adayı' : avg >= 50 ? 'Kıdemli Uzman' : avg > 0 ? 'Gelişen Uzman' : '-'}</span></p>
              <p className="goal-info">{getGoalInfo()}</p>
            </div>
            <div className="progress-overview">
              <span>GENEL İLERLEME</span>
              <strong>%{Math.round(avg)}</strong>
              <small>{recommendations.length === 0 ? 'Hedef tamamlandı' : `${recommendations.length} gelişim alanı kaldı`}</small>
            </div>
          </div>
          <div className="content-grid">
            <div className="left-column">
              <div className="card competencies-card">
                <h2>Yetkinlikler</h2>
                {skills.map(s => (
                  <div key={s.key} className="competency-item">
                    <label>{s.name}</label>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${s.pct}%` }}></div>
                    </div>
                    <span className="progress-text">%{s.pct} · {getProgressLabel(s.pct)}</span>
                  </div>
                ))}
              </div>
              <div className="card recommendations-card">
                <h2>Yapay Zeka Önerileri</h2>
                <p className="rec-intro">
                  {recommendations.length === 0
                    ? `🎉 Tebrikler ${name}! Tüm yetkinlik alanlarını başarıyla tamamladın.`
                    : `Merhaba ${name}! Kariyer hedeflerine ulaşmak için sana özel önerilerimiz:`}
                </p>
                <div>
                  {recommendations.length === 0 ? (
                    <div className="recommendation-item success"><i className="fa-solid fa-check-circle"></i> Tüm eğitimleri başarıyla tamamladınız!</div>
                  ) : recommendations.map((rec, i) => {
                    const emoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
                    return <div key={i} className={`recommendation-item priority-${rec.priority}`}><strong>{emoji} {rec.category}:</strong> {rec.message}</div>;
                  })}
                </div>
                <button className="btn-view-courses" onClick={() => window.location.href = '/education'}>KALAN EĞİTİMLERİ GÖRÜNTÜLE</button>
              </div>
            </div>
            <div className="right-column">
              <div className="card career-card">
                <h2>Kariyer Yolu</h2>
                <div className="career-info">
                  <p><strong>Mevcut Rol:</strong> {avg >= 75 ? 'Yönetici Adayı' : 'Kıdemli Uzman'} &nbsp;&nbsp; <strong>Hedef Rol:</strong> Yönetici</p>
                </div>
                <div>
                  {skills.map(s => {
                    const activeCount = Math.round((s.pct / 100) * 5);
                    return (
                      <div key={s.key} className="skill-path" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <label style={{ minWidth: 160, fontSize: '0.85rem' }}>{s.name}:</label>
                        <div className="milestone-path" style={{ display: 'flex', gap: 4 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={`milestone${i < activeCount ? ' active' : ''}`}></div>
                          ))}
                        </div>
                        <span className="skill-percent" style={{ fontSize: '0.85rem', minWidth: 36 }}>{s.pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="career-message">
                  {avg >= 100 ? `🎉 Tebrikler ${name}! Terfi için hazırsın!`
                    : avg >= 75 ? `💪 Harika gidiyorsun ${name}! Son adımları at!`
                    : avg >= 50 ? `📈 İyi ilerleme ${name}! Yarı yolu geçtin.`
                    : avg > 0 ? `🚀 Başlangıç yaptın ${name}! Devam et.`
                    : `👋 Merhaba ${name}! Eğitimlere başlamaya hazır mısın?`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
