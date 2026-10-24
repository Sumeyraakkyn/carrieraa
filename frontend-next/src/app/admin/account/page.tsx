'use client';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminAccountPage() {
  useAuthGuard('ADMIN');
  const [adminName, setAdminName] = useState('Yönetici');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    setAdminName(localStorage.getItem('currentAdmin') || 'Yönetici');  }, []);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    if (newPassword.length < 6) {
      setMsg('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: password, newPassword })
      });

      if (res.ok) {
        setMsg('Şifreniz başarıyla güncellendi.');
        setPassword('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setMsg(data.error || 'Şifre güncellenirken bir hata oluştu.');
      }
    } catch {
      setMsg('Sunucuya bağlanılamadı.');
    }
    setLoading(false);
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
          <div>
            <h2>Hesap Ayarları</h2>
            <p>Hoşgeldiniz, {adminName}</p>
          </div>
          <div className="icon-btn" onClick={toggleTheme}>
            <i className="fa-solid fa-moon"></i>
          </div>
        </header>

        <div style={{ padding: '30px 40px', maxWidth: '600px' }}>
          <div style={{ background: 'var(--card-bg, #fff)', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--primary-color, #1a4fba)' }}><i className="fa-solid fa-lock"></i> Şifre Değiştir</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mevcut Şifre</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mevcut şifrenizi girin"
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Yeni Şifre</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre belirleyin"
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px' }}
                />
              </div>
              
              {msg && <p style={{ color: msg.includes('başarı') ? 'green' : 'red', marginBottom: '15px', fontWeight: 'bold' }}>{msg}</p>}

              <button type="submit" disabled={loading} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #1a4fba, #4fc3f7)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
