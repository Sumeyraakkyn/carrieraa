'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProfileViewPage() {
  useAuthGuard('USER');
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('Anonim');
  const [docs, setDocs] = useState<{ fileName: string; fileUrl: string }[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const user = localStorage.getItem('currentUser') || 'Anonim';
    setUsername(user);
    setAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user)}`);

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p) {
            setProfile(p);
            if (p.avatarUrl) setAvatarUrl(`${API_URL}${p.avatarUrl}`);
          } else {
            const local = localStorage.getItem('userProfile');
            if (local) setProfile(JSON.parse(local));
          }
        }).catch(() => {
          const local = localStorage.getItem('userProfile');
          if (local) setProfile(JSON.parse(local));
        });

      fetch(`${API_URL}/api/documents/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(d => { setDocs(d); setDocsLoading(false); })
        .catch(() => setDocsLoading(false));
    } else {
      setDocsLoading(false);
    }  }, []);

  async function uploadImage(file: File, type: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', type);
    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      if (!res.ok) return;
      const data = await res.json();
      const fileUrl = data.document.fileUrl;
      const updatedProfile = { ...profile, [type === 'AVATAR' ? 'avatarUrl' : 'bannerUrl']: fileUrl };
      setProfile(updatedProfile);
      if (type === 'AVATAR') setAvatarUrl(`${API_URL}${fileUrl}`);
      await fetch(`${API_URL}/api/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updatedProfile) });
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch {}
  }

  const p = profile as {
    fullName?: string; careerGoal?: string; email?: string; city?: string; linkedin?: string;
    bannerUrl?: string;
    experiences?: { position: string; company: string; startDate: string; endDate: string; currentJob: boolean; description: string }[];
    educations?: { school: string; department: string; degree: string; graduationYear: string }[];
    projects?: { name: string; description: string; link: string }[];
    skills?: string[];
    languages?: { language: string; level: string }[];
  };

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/profil-goruntule.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="profile-wrapper">
          <div className="profile-header">
            <input type="file" id="avatar-input" accept="image/*" hidden onChange={e => e.target.files && uploadImage(e.target.files[0], 'AVATAR')} />
            <input type="file" id="banner-input" accept="image/*" hidden onChange={e => e.target.files && uploadImage(e.target.files[0], 'BANNER')} />
            <div className="cover-photo" onClick={() => document.getElementById('banner-input')?.click()} style={p.bannerUrl ? { background: `url(${API_URL}${p.bannerUrl}) center/cover no-repeat` } : {}}>
              <div className="edit-overlay"><i className="fa-solid fa-camera"></i></div>
            </div>
            <div className="profile-avatar-container" onClick={() => document.getElementById('avatar-input')?.click()}>
              {avatarUrl && <img src={avatarUrl} alt="Avatar" />}
              <div className="edit-overlay"><i className="fa-solid fa-camera"></i></div>
            </div>
            <div className="profile-info">
              <div className="profile-info-text">
                <h1>{p.fullName || username}</h1>
                <h2>{p.careerGoal ? p.careerGoal.toUpperCase() : 'Kariyer Hedefi Belirtilmemiş'}</h2>
                <p><i className="fa-solid fa-envelope"></i> {p.email || 'Belirtilmemiş'}</p>
                <p><i className="fa-solid fa-location-dot"></i> {p.city ? p.city.toUpperCase() : 'Belirtilmemiş'}</p>
                <p>
                  <i className="fa-brands fa-linkedin"></i>{' '}
                  {p.linkedin ? (
                    <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {p.linkedin}
                    </a>
                  ) : (
                    'Belirtilmemiş'
                  )}
                </p>
              </div>
              <div>
                <button className="btn-edit-profile" onClick={() => window.location.href = '/profile'}>
                  <i className="fa-solid fa-pen-to-square"></i> Profili Düzenle
                </button>
              </div>
            </div>
          </div>
          <div className="profile-grid">
            <div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-briefcase"></i> Deneyim</h3>
                <div className="timeline">
                  {p.experiences && p.experiences.length > 0 ? p.experiences.map((e, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-title">{e.position}</div>
                      <div className="timeline-subtitle">{e.company}</div>
                      <div className="timeline-date">{e.startDate} - {e.currentJob ? 'Devam Ediyor' : e.endDate}</div>
                      <div className="timeline-desc">{e.description}</div>
                    </div>
                  )) : <div className="empty-state">Henüz bir iş deneyimi girilmemiş.</div>}
                </div>
              </div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-graduation-cap"></i> Eğitim</h3>
                <div className="timeline">
                  {p.educations && p.educations.length > 0 ? p.educations.map((e, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-title">{e.school}</div>
                      <div className="timeline-subtitle">{e.department} - {e.degree}</div>
                      <div className="timeline-date">Mezuniyet: {e.graduationYear || '?'}</div>
                    </div>
                  )) : <div className="empty-state">Henüz eğitim bilgisi girilmemiş.</div>}
                </div>
              </div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-folder-open"></i> Projeler</h3>
                <div className="timeline">
                  {p.projects && p.projects.length > 0 ? p.projects.map((e, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-title">{e.name}</div>
                      <div className="timeline-subtitle"><a href={e.link} target="_blank" style={{ color: 'var(--primary-color)' }}>{e.link}</a></div>
                      <div className="timeline-desc">{e.description}</div>
                    </div>
                  )) : <div className="empty-state">Henüz proje girilmemiş.</div>}
                </div>
              </div>
            </div>
            <div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-code"></i> Yetenekler</h3>
                <div className="tags-container">
                  {p.skills && p.skills.length > 0 ? p.skills.map((s, i) => {
                    const parts = s.split(':');
                    const name = parts[0];
                    const lvl = parts[1] || 'Orta';
                    return <span key={i} className="tag-pill">{name} ({lvl})</span>;
                  }) : <div className="empty-state">Yetenek eklenmemiş.</div>}
                </div>
              </div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-language"></i> Diller</h3>
                <div className="tags-container">
                  {p.languages && p.languages.length > 0 ? p.languages.map((l, i) => <span key={i} className="tag-pill">{l.language.toUpperCase()} ({l.level})</span>) : <div className="empty-state">Dil bilgisi eklenmemiş.</div>}
                </div>
              </div>
              <div className="profile-section">
                <h3 className="section-title"><i className="fa-solid fa-certificate"></i> Belge ve Sertifikalar</h3>
                <div className="docs-grid">
                  {docsLoading ? <div className="empty-state">Belgeleriniz yükleniyor...</div>
                    : docs.length === 0 ? <div className="empty-state">Henüz sertifika veya belge yüklemediniz.</div>
                    : docs.map((doc, i) => {
                      const ext = doc.fileName.split('.').pop()?.toLowerCase() || '';
                      const isImg = ['jpg', 'jpeg', 'png'].includes(ext);
                      return (
                        <a key={i} href={`${API_URL}${doc.fileUrl}`} target="_blank" className="doc-card" title={doc.fileName}>
                          <i className={`fa-solid ${isImg ? 'fa-file-image' : 'fa-file-pdf'} doc-icon`}></i>
                          <div className="doc-name">{doc.fileName}</div>
                        </a>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
