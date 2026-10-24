'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const setAdminMode = useAuthStore(s => s.setAdminMode);

  function setMode(mode: string) {
    const container = document.getElementById('toggleContainer')!;
    const btnKullanici = document.getElementById('btnKullanici')!;
    const btnYonetici = document.getElementById('btnYonetici')!;
    const labelUsername = document.getElementById('labelUsername')!;
    if (mode === 'yonetici') {
      container.classList.add('yonetici-mode');
      btnYonetici.classList.add('active');
      btnKullanici.classList.remove('active');
      labelUsername.innerText = 'Yönetici Adı:';
    } else {
      container.classList.remove('yonetici-mode');
      btnKullanici.classList.add('active');
      btnYonetici.classList.remove('active');
      labelUsername.innerText = 'Kullanıcı Adı:';
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Giriş başarısız.');
        setLoading(false);
        return;
      }

      // Zustand store'a kaydet
      setAuth({
        token: data.token,
        username: data.user.username,
        role: data.user.role,
        userId: String(data.user.id),
      });

      // Eski kodların çalışması için raw localStorage'a da yaz
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', data.user.username);
      localStorage.setItem('userRole', data.user.role);

      if (data.user.role === 'ADMIN') {
        setAdminMode(data.user.username);
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Sunucuya bağlanılamadı.');
      setLoading(false);
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/giris.css" />
      <div className="toggle-container" id="toggleContainer">
        <div className="slider"></div>
        <button className="toggle-btn active" id="btnKullanici" onClick={() => setMode('kullanici')}>Kullanıcı</button>
        <button className="toggle-btn" id="btnYonetici" onClick={() => setMode('yonetici')}>Yönetici</button>
      </div>

      <div className="logo-section">
        <img src="/img/logo.png" alt="Carriera Logo" className="logo-img" />
      </div>

      <form className="login-form" onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="username" id="labelUsername">Kullanıcı Adı:</label>
          <input type="text" id="username" required />
        </div>
        <div className="input-group">
          <label htmlFor="password">Şifre:</label>
          <input type="password" id="password" required />
        </div>
        {error && <div style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: 8 }}>{error}</div>}
        <a href="/forgot-password" className="forgot-password">Şifremi Unuttum?</a>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      <div className="signup-text">
        Hesabın yok mu? <a href="/register" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}>Üye ol!</a>
      </div>
    </>
  );
}
