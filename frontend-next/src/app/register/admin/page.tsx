'use client';
import { useEffect, useState } from 'react';
import { useFormValidation, rules } from '@/hooks/useFormValidation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminRegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminSetupKey, setAdminSetupKey] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { onBlur, onChange, validateAll, errorMsg, isInvalid } = useFormValidation({
    username:        [rules.required('Kullanıcı adı'), rules.minLength(3), rules.maxLength(30), rules.noSpaces()],
    password:        [rules.required('Şifre'), rules.passwordStrength()],
    confirmPassword: [rules.required('Şifre tekrar'), rules.match(password)],
  });

  useEffect(() => {  }, []);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: `1.5px solid ${isInvalid(field) ? '#ef4444' : '#d1d5db'}`,
    fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  });

  const errStyle: React.CSSProperties = {
    color: '#ef4444', fontSize: '0.78rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4,
  };

  async function createAdminAccount(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');

    const valid = validateAll({ username, password, confirmPassword });
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, isAdmin: true, adminSetupKey }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error || 'Kayıt başarısız.'); setLoading(false); return; }
      window.location.href = '/login';
    } catch {
      setServerError('Sunucuya bağlanılamadı.');
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <link rel="stylesheet" href="/styles/yonetici-hesap.css" />
      <form onSubmit={createAdminAccount} noValidate>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a4fba' }}>Yönetici Hesabı Oluştur</h2>
          <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '6px' }}>
            Bu sayfa yalnızca sistem yöneticileri tarafından kullanılmalıdır.
          </p>
        </div>

        <div className="form-group">
          <label>Yönetici Kullanıcı Adı <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            id="admin-username" type="text" placeholder="En az 3 karakter"
            value={username}
            onChange={e => { setUsername(e.target.value); onChange('username', e.target.value); }}
            onBlur={() => onBlur('username', username)}
            style={inputStyle('username')} autoComplete="off"
          />
          {errorMsg('username') && <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('username')}</p>}
        </div>

        <div className="form-group">
          <label>Yönetici Kurulum Anahtarı <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            id="admin-setup-key" type="password" placeholder="Sistem yöneticisinden alın"
            value={adminSetupKey} onChange={e => setAdminSetupKey(e.target.value)}
            style={inputStyle('adminSetupKey')} autoComplete="off" required
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 5 }}>Bu anahtar, herkese açık kayıttan yönetici oluşturulmasını engeller.</p>
        </div>

        <div className="form-group">
          <label>Şifre <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              id="admin-password" type={showPw ? 'text' : 'password'} placeholder="En az 6 karakter"
              value={password}
              onChange={e => { setPassword(e.target.value); onChange('password', e.target.value); }}
              onBlur={() => onBlur('password', password)}
              style={{ ...inputStyle('password'), paddingRight: 40 }} autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {errorMsg('password') && <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('password')}</p>}
        </div>

        <div className="form-group">
          <label>Şifre Tekrar <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            id="admin-confirm-password" type="password" placeholder="Şifreyi tekrar girin"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); onChange('confirmPassword', e.target.value); }}
            onBlur={() => onBlur('confirmPassword', confirmPassword)}
            style={inputStyle('confirmPassword')} autoComplete="new-password"
          />
          {errorMsg('confirmPassword') && <p style={errStyle}><i className="fa-solid fa-circle-exclamation"></i>{errorMsg('confirmPassword')}</p>}
        </div>

        {serverError && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 10, background: '#fff0f0', padding: '8px 12px', borderRadius: 6, border: '1px solid #fcc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-triangle-exclamation"></i> {serverError}
          </div>
        )}

        <button type="submit" className="btn-create" disabled={loading}>
          {loading ? 'Oluşturuluyor...' : 'Yönetici Hesabı Oluştur'}
        </button>
      </form>
      <a href="/register" className="back-link"><i className="fa-solid fa-arrow-left"></i> Geri Dön</a>
    </div>
  );
}
