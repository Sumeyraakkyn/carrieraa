'use client';
import { useEffect, useState } from 'react';
import { useFormValidation, rules } from '@/hooks/useFormValidation';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Şifre gücü hesapla (0-4)
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: '', color: '#e5e7eb' },
    { label: 'Çok Zayıf', color: '#ef4444' },
    { label: 'Zayıf', color: '#f97316' },
    { label: 'Orta', color: '#eab308' },
    { label: 'Güçlü', color: '#22c55e' },
    { label: 'Çok Güçlü', color: '#10b981' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

export default function UserRegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const setAuth = useAuthStore(s => s.setAuth);
  const setOnboardingDone = useOnboardingStore(s => s.setOnboardingDone);

  const pwStrength = getPasswordStrength(password);

  const { onBlur, onChange, validateAll, errorMsg, isInvalid } = useFormValidation({
    username: [rules.required('Kullanıcı adı'), rules.minLength(3), rules.maxLength(30), rules.noSpaces()],
    email:    [rules.required('E-posta adresi'), rules.email()],
    password: [rules.required('Şifre'), rules.passwordStrength()],
  });

  // Bazı tarayıcı eklentileri (şifre yöneticileri gibi) form alanlarını React
  // hydrate olmadan önce değiştirebiliyor. Formu ilk istemci renderından sonra
  // göstermek, sunucu HTML'i ile istemci DOM'unun uyuşmazlığını engeller.
  useEffect(() => { setIsHydrated(true); }, []);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const valid = validateAll({ username, email, password });
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, isAdmin: false }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || 'Kayıt başarısız.'); setLoading(false); return; }

      // Otomatik giriş
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        setAuth({
          token: loginData.token,
          username: loginData.user.username,
          role: loginData.user.role,
          userId: String(loginData.user.id),
        });
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('currentUser', loginData.user.username);
        localStorage.setItem('userRole', loginData.user.role);
        setOnboardingDone(false);
      }
      window.location.href = '/onboarding';
    } catch {
      setServerError('Sunucuya bağlanılamadı.');
      setLoading(false);
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1.5px solid ${isInvalid(field) ? '#ef4444' : '#d1d5db'}`,
    fontSize: '0.95rem',
    color: '#000',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  const errStyle: React.CSSProperties = {
    color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
  };

  if (!isHydrated) {
    return (
      <div className="auth-container" aria-busy="true">
        <link rel="stylesheet" href="/styles/kullanici-hesap.css" />
        <p style={{ textAlign: 'center' }}>Kayıt formu hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <link rel="stylesheet" href="/styles/kullanici-hesap.css" />
      <form onSubmit={createAccount} noValidate>
        {/* Kullanıcı Adı */}
        <div className="form-group">
          <label htmlFor="username">Kullanıcı Adı <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            id="username"
            type="text"
            placeholder="En az 3 karakter, boşluk olmadan"
            value={username}
            onChange={e => { setUsername(e.target.value); onChange('username', e.target.value); }}
            onBlur={() => onBlur('username', username)}
            style={inputStyle('username')}
            autoComplete="username"
          />
          {errorMsg('username') && (
            <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('username')}</p>
          )}
        </div>

        {/* E-posta */}
        <div className="form-group">
          <label htmlFor="email">E-posta <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            id="email"
            type="email"
            placeholder="ornek@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); onChange('email', e.target.value); }}
            onBlur={() => onBlur('email', email)}
            style={inputStyle('email')}
            autoComplete="email"
            required
          />
          {errorMsg('email') && (
            <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('email')}</p>
          )}
        </div>

        {/* Şifre */}
        <div className="form-group">
          <label htmlFor="password">Şifre <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="En az 6 karakter"
              value={password}
              onChange={e => { setPassword(e.target.value); onChange('password', e.target.value); }}
              onBlur={() => onBlur('password', password)}
              style={{ ...inputStyle('password'), paddingRight: 40 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '0.9rem' }}
            >
              <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          {/* Şifre güç göstergesi */}
          {password.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength.score ? pwStrength.color : '#e5e7eb', transition: 'background 0.3s' }} />
                ))}
              </div>
              {pwStrength.label && (
                <p style={{ fontSize: '0.75rem', color: pwStrength.color, margin: 0 }}>{pwStrength.label}</p>
              )}
            </div>
          )}

          {errorMsg('password') && (
            <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('password')}</p>
          )}
        </div>

        {/* Sunucu hatası */}
        {serverError && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 10, background: '#fff0f0', padding: '8px 12px', borderRadius: 6, border: '1px solid #fcc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-triangle-exclamation"></i> {serverError}
          </div>
        )}

        <button type="submit" className="btn-create" disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
        </button>
      </form>

      <a href="/register" className="back-link">
        <i className="fa-solid fa-arrow-left"></i> Geri Dön
      </a>
    </div>
  );
}
