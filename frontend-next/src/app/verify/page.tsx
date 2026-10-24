'use client';
import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function VerifyPage() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 dakika
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function handleDigitChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val.slice(-1);
    setDigits(newDigits);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) { setError('Lutfen 6 haneli kodu girin.'); return; }

    const email = sessionStorage.getItem('resetEmail');
    if (!email) { window.location.href = '/forgot-password'; return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gecersiz kod.'); setLoading(false); return; }

      sessionStorage.setItem('resetToken', data.resetToken);
      window.location.href = '/reset-password';
    } catch {
      setError('Sunucuya baglanılamadı.');
      setLoading(false);
    }
  }

  async function resendCode() {
    const email = sessionStorage.getItem('resetEmail');
    if (!email) { window.location.href = '/forgot-password'; return; }
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setTimeLeft(180);
        setExpired(false);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => { if (prev <= 1) { clearInterval(timerRef.current!); setExpired(true); return 0; } return prev - 1; });
        }, 1000);
      }
    } catch { /* empty */ }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <main className="password-flow-page">
      <link rel="stylesheet" href="/styles/password-flow.css" />
      <section className="password-flow-card">
        <div className="password-brand"><i className="fa-solid fa-shield-halved" /> CARRIERA GÜVENLİK</div>
        <div className="password-steps"><span className="password-step active" /><span className="password-step active" /><span className="password-step" /></div>
        <h1>E-postanı kontrol et</h1>
        <p className="password-lead">Gönderdiğimiz altı haneli kodu gir. Kod 3 dakika boyunca geçerli.</p>
        <div className="code-email-chip"><i className="fa-solid fa-envelope-circle-check" /> Doğrulama kodu e-posta adresine gönderildi</div>
        <form onSubmit={handleVerify}>
          <div className="code-inputs">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              maxLength={1}
              value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="code-box"
              inputMode="numeric"
              aria-label={`${i + 1}. kod hanesi`}
            />
          ))}
          </div>
          {error && <div className="password-alert">{error}</div>}
          <button type="submit" className="password-primary" disabled={loading || expired}>{loading ? 'Doğrulanıyor...' : 'Kodu doğrula'} <i className="fa-solid fa-arrow-right" /></button>
        </form>
        <div className="password-resend">{expired ? <button type="button" onClick={resendCode}>Yeni kod gönder</button> : <>Kod gelmedi mi? <span className="countdown">{mins}:{secs}</span> sonra yeniden isteyebilirsin.</>}</div>
      </section>
    </main>
  );
}
