'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const criteria = [
  { key: 'kalite', label: 'İş Kalitesi', icon: 'fa-gem', color: '#4fc3f7' },
  { key: 'sorumluluk', label: 'Sorumluluk', icon: 'fa-shield-halved', color: '#81c784' },
  { key: 'birligi', label: 'İş Birliği', icon: 'fa-users', color: '#ffb74d' },
  { key: 'zaman', label: 'Zaman Yönetimi', icon: 'fa-clock', color: '#f06292' },
];

interface UserEval {
  id: number; username: string; avatarUrl: string;
  evaluation: { kalite: number; sorumluluk: number; birligi: number; zaman: number; yorumlar?: string; } | null;
}

export default function AdminSkillsPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yönetici');
  const [users, setUsers] = useState<UserEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserEval | null>(null);
  const [ratings, setRatings] = useState({ kalite: 3, sorumluluk: 3, birligi: 3, zaman: 3 });
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    setAdminName(localStorage.getItem('currentAdmin') || 'Yönetici');
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { setLoading(false); return; }
      const allUsers = await res.json();

      const list: UserEval[] = allUsers
        .filter((u: { role: string }) => u.role === 'USER')
        .map((u: { id: number; username: string; evaluations?: any[]; profile?: { avatarUrl?: string | null } }) => {
          // listUsers endpoint'i zaten her kullanıcının değerlendirmelerini (evaluations) getiriyor
          const ev = u.evaluations && u.evaluations.length > 0 ? u.evaluations[0] : null;
          return {
            id: u.id, username: u.username,
            avatarUrl: u.profile?.avatarUrl ? `${API_URL}${u.profile.avatarUrl}` : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(u.username)}`,
            evaluation: ev,
          };
        });
      setUsers(list);
    } catch { /**/ } finally { setLoading(false); }
  }

  function openModal(user: UserEval) {
    setSelected(user);
    setMsg('');
    if (user.evaluation) {
      setRatings({ kalite: user.evaluation.kalite, sorumluluk: user.evaluation.sorumluluk, birligi: user.evaluation.birligi, zaman: user.evaluation.zaman });
      setComment(user.evaluation.yorumlar || '');
    } else {
      setRatings({ kalite: 3, sorumluluk: 3, birligi: 3, zaman: 3 });
      setComment('');
    }
  }

  async function submitEval(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    const token = localStorage.getItem('token');
    const avg = ((ratings.kalite + ratings.sorumluluk + ratings.birligi + ratings.zaman) / 4).toFixed(1);
    try {
      const res = await fetch(`${API_URL}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: selected.id, ...ratings, yorumlar: comment, ortalama: parseFloat(avg) }),
      });
      if (res.ok) { setMsg('Değerlendirme kaydedildi!'); loadUsers(); setTimeout(() => setSelected(null), 1200); }
      else { setMsg('Hata oluştu.'); }
    } catch { setMsg('Sunucuya bağlanılamadı.'); }
    setSaving(false);
  }

  const avg = ((ratings.kalite + ratings.sorumluluk + ratings.birligi + ratings.zaman) / 4).toFixed(1);

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <AdminSidebar />
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px' }}>
          <div><h2>Yetkinlik Analizi</h2><p>Hoşgeldiniz, {adminName}</p></div>
          <div className="icon-btn" onClick={toggleTheme}><i className="fa-solid fa-moon"></i></div>
        </header>

        <div style={{ padding: '30px 40px' }}>
          <p style={{ color: '#888', marginBottom: 24 }}>Değerlendirmek istediğiniz kullanıcıyı seçin</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Yükleniyor...</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
              <i className="fa-solid fa-users-slash" style={{ fontSize: '3rem', display: 'block', marginBottom: 15 }}></i>
              <h3>Henüz kullanıcı yok</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {users.map(u => {
                const hasEval = !!u.evaluation;
                const uAvg = hasEval ? ((u.evaluation!.kalite + u.evaluation!.sorumluluk + u.evaluation!.birligi + u.evaluation!.zaman) / 4).toFixed(1) : null;
                return (
                  <div key={u.id} style={{ background: 'var(--card-bg)', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => openModal(u)} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')} onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <img src={u.avatarUrl} alt={u.username} style={{ width: 50, height: 50, borderRadius: '50%' }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.username}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{hasEval ? 'Değerlendirildi' : 'Değerlendirilmedi'}</div>
                      </div>
                      {hasEval && <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '1.3rem', color: '#4fc3f7' }}>{uAvg}</div>}
                    </div>
                    {hasEval && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {criteria.map(c => (
                          <div key={c.key} style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#888' }}><i className={`fa-solid ${c.icon}`} style={{ color: c.color, marginRight: 4 }}></i>{c.label}</span>
                            <div style={{ background: '#e8e8e8', borderRadius: 6, height: 6, marginTop: 3 }}>
                              <div style={{ width: `${(u.evaluation![c.key as keyof typeof u.evaluation] as number) / 5 * 100}%`, height: '100%', background: c.color, borderRadius: 6 }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasEval && (
                      <button style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #1a4fba, #4fc3f7)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                        <i className="fa-solid fa-clipboard-check"></i> Değerlendir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelected(null)}>
            <div style={{ background: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: 16, padding: 32, maxWidth: 520, width: '90%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3><i className="fa-solid fa-clipboard-check"></i> Performans Değerlendirmesi</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                <img src={selected.avatarUrl} alt={selected.username} style={{ width: 44, height: 44, borderRadius: '50%' }} />
                <strong>{selected.username}</strong>
              </div>
              <form onSubmit={submitEval}>
                {criteria.map(c => (
                  <div key={c.key} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
                      <i className={`fa-solid ${c.icon}`} style={{ color: c.color }}></i> {c.label}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="range" min={1} max={5} value={ratings[c.key as keyof typeof ratings]}
                        onChange={e => setRatings(r => ({ ...r, [c.key]: parseInt(e.target.value) }))}
                        style={{ flex: 1, accentColor: c.color }} />
                      <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'right' }}>{ratings[c.key as keyof typeof ratings]}/5</span>
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center', margin: '16px 0', padding: 12, background: '#f0f9ff', borderRadius: 10 }}>
                  <span style={{ color: '#888' }}>Ortalama Puan: </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4fc3f7' }}>{avg}</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}><i className="fa-solid fa-comment"></i> Yönetici Yorumları</label>
                  <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Çalışan hakkındaki görüşlerinizi yazın..."
                    style={{ width: '100%', padding: 10, border: '2px solid var(--border-color, #e5e7eb)', background: 'var(--input-bg, var(--card-bg))', color: 'var(--text-color)', borderRadius: 8, fontSize: '0.9rem', outline: 'none' }}></textarea>
                </div>
                {msg && <div style={{ textAlign: 'center', marginBottom: 12, color: msg.includes('kaydedildi') ? 'green' : 'red', fontWeight: 600 }}>{msg}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setSelected(null)} style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>İptal</button>
                  <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#1a4fba,#4fc3f7)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
                    <i className="fa-solid fa-save"></i> {saving ? 'Kaydediliyor...' : 'Kaydet ve Gönder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
