'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CVUser {
  id: number;
  username: string;
  fullName: string;
  status: string;
  submittedAt: string;
  type: string;
  avatarUrl: string;
  fileUrl: string;
  fileName: string;
  aiScore: number | null;
  skillGapSummary: string[];
  cvData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    city?: string;
    careerGoal?: string;
    skills?: string[];
    experiences?: unknown[];
    educations?: unknown[];
    projects?: unknown[];
    certificates?: unknown[];
    languages?: unknown[];
  };
}

export default function AdminCvReviewPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yönetici');
  const [cvList, setCvList] = useState<CVUser[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CVUser | null>(null);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    setAdminName(localStorage.getItem('currentAdmin') || 'Yönetici');
    loadCVs();  }, []);

  function loadCVs() {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/admin/cvs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setCvList(data))
    .catch(err => console.error(err));
  }

  function updateStatus(documentId: number, status: string) {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/admin/cvs/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ documentId, status })
    }).then(res => {
      if (res.ok) {
        toast.success(status === 'approved' ? 'CV onaylandı!' : 'CV reddedildi.');
        loadCVs();
        setSelected(null);
      } else {
        toast.error('İşlem başarısız.');
      }
    }).catch(() => toast.error('Sunucuya bağlanılamadı.'));
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  const filtered = cvList.filter(c => !search || c.fullName.toLowerCase().includes(search.toLowerCase()));
  const pending = cvList.filter(c => c.status === 'pending').length;
  const approved = cvList.filter(c => c.status === 'approved').length;

  return (
    <>
      <AdminSidebar />
      <div className="main-content">
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px' }}>
          <div><h2>CV İnceleme</h2><p>Hoşgeldiniz, {adminName}</p></div>
          <div className="icon-btn" onClick={toggleTheme}><i className="fa-solid fa-moon"></i></div>
        </header>

        <div style={{ padding: '30px 40px' }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
            {[{ label: 'Bekleyen CV', count: pending, color: '#FF9800', icon: 'fa-clock' }, { label: 'Onaylanan CV', count: approved, color: '#4CAF50', icon: 'fa-check-circle' }, { label: 'Toplam CV', count: cvList.length, color: '#4fc3f7', icon: 'fa-file-alt' }].map(s => (
              <div key={s.label} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <i className={`fa-solid ${s.icon}`}></i>
                </div>
                <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.count}</div><div style={{ fontSize: '0.85rem', color: '#888' }}>{s.label}</div></div>
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
            <input type="text" placeholder="İsim Ara..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 40px 10px 16px', border: '2px solid var(--border-color, #e0e0e0)', background: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: 10, fontSize: '0.9rem', outline: 'none' }} />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
          </div>

          {filtered.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: '#888' }}><i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '3rem', marginBottom: 15, display: 'block' }}></i><p>İncelenecek CV bulunmamaktadır</p></div>
            : filtered.map(cv => (
              <div key={cv.id} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '16px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={cv.avatarUrl} alt={cv.fullName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{cv.fullName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {cv.type === 'uploaded' ? 'PDF Yüklendi' : 'Form Dolduruldu'} · {cv.submittedAt ? new Date(cv.submittedAt).toLocaleDateString('tr-TR') : '-'}
                    </div>
                  </div>

                  {/* YZ Skoru rozeti */}
                  {cv.aiScore !== null && cv.aiScore !== undefined ? (
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                      background: cv.aiScore >= 70 ? '#d1fae5' : cv.aiScore >= 40 ? '#fef3c7' : '#fee2e2',
                      color: cv.aiScore >= 70 ? '#065f46' : cv.aiScore >= 40 ? '#92400e' : '#991b1b',
                    }}>
                      <i className="fa-solid fa-brain" style={{ marginRight: 4 }}></i>YZ: %{cv.aiScore}
                    </span>
                  ) : (
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', background: '#f3f4f6', color: '#9ca3af' }}>
                      Analiz yok
                    </span>
                  )}

                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, background: cv.status === 'approved' ? '#e8f5e9' : cv.status === 'rejected' ? '#ffebee' : '#fff3e0', color: cv.status === 'approved' ? '#4CAF50' : cv.status === 'rejected' ? '#f44336' : '#FF9800' }}>
                    {cv.status === 'approved' ? 'Onaylandı' : cv.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                  <button onClick={() => setSelected(cv)} style={{ padding: '8px 16px', background: '#4fc3f7', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>İncele</button>
                </div>

                {/* Skill Gap özeti */}
                {cv.skillGapSummary && cv.skillGapSummary.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Eksik beceriler:</span>
                    {cv.skillGapSummary.map(s => (
                      <span key={s} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: 16, padding: 30, maxWidth: 560, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: 4 }}>{selected.fullName} - CV Detayı</h3>
              <p style={{ color: '#888', marginBottom: 20, fontSize: '0.85rem' }}>Tür: {selected.type === 'uploaded' ? 'PDF Yüklendi' : 'Form Dolduruldu'}</p>

              {/* YZ Analiz Detayı */}
              {selected.aiScore !== null && selected.aiScore !== undefined && (
                <div style={{ background: '#f8faff', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #dbeafe' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12, color: '#1e40af' }}>
                    <i className="fa-solid fa-brain" style={{ marginRight: 8 }}></i>YZ Ön Değerlendirmesi
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: selected.aiScore >= 70 ? '#10b981' : selected.aiScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                      %{selected.aiScore}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: '#e5e7eb', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${selected.aiScore}%`, height: '100%', background: selected.aiScore >= 70 ? '#10b981' : selected.aiScore >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 8 }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>Kariyer Hedefi Uyum Skoru</div>
                    </div>
                  </div>
                  {selected.skillGapSummary && selected.skillGapSummary.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Eksik Beceriler:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selected.skillGapSummary.map(s => (
                          <span key={s} style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 500 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selected.type === 'form' && selected.cvData && (
                <div style={{ display: 'grid', gap: 12, marginBottom: 22 }}>
                  {(() => { const cvData = selected.cvData; return <>
                  <div style={{ background: '#fffaf0', border: '1px solid #ead9b8', borderRadius: 10, padding: 14 }}>
                    <strong style={{ display: 'block', marginBottom: 8, color: '#79551c' }}>CV bilgileri</strong>
                    <div style={{ display: 'grid', gap: 5, fontSize: '0.86rem' }}>
                      <span><b>Hedef:</b> {cvData.careerGoal || '-'}</span>
                      <span><b>E-posta:</b> {cvData.email || '-'}</span>
                      <span><b>Telefon:</b> {cvData.phone || '-'}</span>
                      <span><b>Şehir:</b> {cvData.city || '-'}</span>
                      <span><b>Yetenekler:</b> {cvData.skills?.join(', ') || '-'}</span>
                    </div>
                  </div>
                  {(['educations', 'experiences', 'projects', 'certificates', 'languages'] as const).map((field) => (
                    <details key={field} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{field === 'educations' ? 'Eğitim' : field === 'experiences' ? 'İş Deneyimi' : field === 'projects' ? 'Projeler' : field === 'certificates' ? 'Sertifikalar' : 'Diller'}</summary>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#6b7280', margin: '10px 0 0' }}>{JSON.stringify(cvData[field] || [], null, 2)}</pre>
                    </details>
                  ))}
                  </>; })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {selected.fileUrl && <a href={`${API_URL}${selected.fileUrl}`} target="_blank" rel="noreferrer" style={{ padding: '10px 20px', background: '#1a4fba', color: '#fff', textDecoration: 'none', borderRadius: 8, marginRight: 'auto' }}>
                  <i className="fa-solid fa-download"></i> Görüntüle / İndir
                </a>}
                <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Kapat</button>
                <button onClick={() => updateStatus(selected.id, 'rejected')} style={{ padding: '10px 20px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Reddet</button>
                <button onClick={() => updateStatus(selected.id, 'approved')} style={{ padding: '10px 20px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Onayla</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
