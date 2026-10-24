'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formReady, setFormReady] = useState(false);

  // Şifre yöneticileri inputa React yüklenmeden düğüm ekleyebiliyor.
  // Formu ilk hydration tamamlandıktan sonra çizmek, bu eklenti kaynaklı farkı önler.
  useEffect(() => setFormReady(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Kod gönderilemedi.');
        return;
      }
      sessionStorage.setItem('resetEmail', email.trim().toLowerCase());
      window.location.href = '/verify';
    } catch {
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="password-flow-page">
      <link rel="stylesheet" href="/styles/password-flow.css" />
      <section className="password-flow-card">
        <div className="password-brand"><i className="fa-solid fa-shield-halved" /> CARRIERA GÜVENLİK</div>
        <div className="password-steps"><span className="password-step active" /><span className="password-step" /><span className="password-step" /></div>
        <h1>Şifreni güvenle yenile</h1>
        <p className="password-lead">Hesabına bağlı e-posta adresini gir; sana tek kullanımlık doğrulama kodu gönderelim.</p>
        {formReady ? <form onSubmit={handleSubmit}>
          <div className="password-field"><label htmlFor="email">E-posta adresin</label><div className="password-input-wrap"><i className="fa-solid fa-envelope" /><input type="email" id="email" placeholder="ornek@eposta.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div></div>
          {error && <div className="password-alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
          <button type="submit" className="password-primary" disabled={loading}>{loading ? 'Kod gönderiliyor...' : 'Doğrulama kodu gönder'} <i className="fa-solid fa-arrow-right" /></button>
        </form> : <div className="password-form-placeholder" aria-hidden="true"><span /><span /></div>}
        <div className="password-security-note"><i className="fa-solid fa-lock" /><span>Güvenlik için kodun 3 dakika geçerlidir ve yalnızca bir kez kullanılabilir.</span></div>
        <Link href="/login" className="password-back">← Şifreni hatırladın mı? Giriş yap</Link>
      </section>
    </main>
  );
}
