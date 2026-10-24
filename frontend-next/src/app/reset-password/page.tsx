'use client';
import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setMsg('Şifreler eşleşmiyor! Lütfen tekrar deneyin.'); return; }
    if (newPassword.length < 8) { setMsg('Şifre en az 8 karakter olmalı!'); return; }
    setMsg('');
    const resetToken = sessionStorage.getItem('resetToken');
    if (!resetToken) { window.location.href = '/forgot-password'; return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || 'Şifre güncellenemedi.'); return; }
      sessionStorage.removeItem('resetToken');
      sessionStorage.removeItem('resetEmail');
      setSuccess(true);
      setTimeout(() => window.location.href = '/login', 1800);
    } catch {
      setMsg('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="password-flow-page">
      <link rel="stylesheet" href="/styles/password-flow.css" />
      <section className="password-flow-card">
        <div className="password-brand"><i className="fa-solid fa-shield-halved" /> CARRIERA GÜVENLİK</div>
        <div className="password-steps"><span className="password-step active" /><span className="password-step active" /><span className="password-step active" /></div>
        <h1>Yeni şifreni oluştur</h1>
        <p className="password-lead">Güçlü ve daha önce kullanmadığın bir şifre seç.</p>
        {success ? (
          <div className="password-success">
            <i className="fa-solid fa-circle-check" />
            <strong>Şifren başarıyla değiştirildi.</strong><br /><small>Giriş sayfasına yönlendiriliyorsun...</small>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {msg && <div className="password-alert">{msg}</div>}
            <div className="password-field"><label htmlFor="new-password">Yeni şifre</label><div className="password-input-wrap"><i className="fa-solid fa-lock" /><input type={showNew ? 'text' : 'password'} id="new-password" placeholder="En az 8 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={8} /><button type="button" className="password-toggle" aria-label="Şifre görünürlüğünü değiştir" onClick={() => setShowNew(p => !p)}><i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'}`} /></button></div></div>
            <div className="password-field"><label htmlFor="confirm-password">Yeni şifre tekrar</label><div className="password-input-wrap"><i className="fa-solid fa-lock" /><input type={showConfirm ? 'text' : 'password'} id="confirm-password" placeholder="Şifreni tekrar gir" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required minLength={8} /><button type="button" className="password-toggle" aria-label="Şifre görünürlüğünü değiştir" onClick={() => setShowConfirm(p => !p)}><i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`} /></button></div></div>
            <p className="password-requirement"><i className="fa-solid fa-circle-info" /> En az 8 karakter kullan.</p>
            <button type="submit" className="password-primary" disabled={loading}>{loading ? 'Şifre güncelleniyor...' : 'Şifreyi yenile'} <i className="fa-solid fa-check" /></button>
          </form>
        )}
        <Link href="/login" className="password-back">← Giriş sayfasına dön</Link>
      </section>
    </main>
  );
}
