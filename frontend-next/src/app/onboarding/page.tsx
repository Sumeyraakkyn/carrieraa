'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS = [
  {
    key: 'welcome',
    icon: 'fa-hand-wave',
    color: '#1a4fba',
    title: 'Carriera\'ya Hoş Geldin!',
    desc: 'Kariyer yolculuğuna başlamak için birkaç adımı tamamlaman yeterli. Sadece 3 dakika sürer.',
  },
  {
    key: 'profile',
    icon: 'fa-user-pen',
    color: '#8b5cf6',
    title: 'Profilini Doldur',
    desc: 'İsmin, kariyer hedefin ve deneyimlerin YZ analizinin temelini oluşturur. Ne kadar eksiksiz olursa, öneriler o kadar isabetli olur.',
  },
  {
    key: 'cv',
    icon: 'fa-file-arrow-up',
    color: '#10b981',
    title: 'CV\'ni Yükle',
    desc: 'YZ motorumuz CV\'ni analiz ederek skill gap\'lerini tespit eder ve kariyer hedefinle uyum skorunu hesaplar.',
  },
  {
    key: 'done',
    icon: 'fa-rocket',
    color: '#f59e0b',
    title: 'Hazırsın!',
    desc: 'Artık yetkinlik analizine, eğitimlere ve kişisel gelişim takibine erişebilirsin.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=welcome, 1=profile, 2=cv, 3=done
  const [username, setUsername] = useState('');
  const [profileDone, setProfileDone] = useState(false);
  const [cvDone, setCvDone] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser') || '';
    setUsername(user);

    if (!token) { router.replace('/login'); return; }

    // Onboarding zaten tamamlandıysa dashboard'a yönlendir
    if (localStorage.getItem('onboardingDone') === 'true') {
      router.replace('/dashboard');
      return;
    }

    // Mevcut durumu kontrol et
    Promise.all([
      fetch(`${API_URL}/api/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/api/documents/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : []),
    ]).then(([profile, docs]) => {
      const hasProfile = !!(profile?.fullName && profile?.careerGoal);
      const hasCv = Array.isArray(docs) && docs.some((d: any) => d.type === 'CV');
      setProfileDone(hasProfile);
      setCvDone(hasCv);

      // Kaldığı adımdan devam et
      const savedStep = localStorage.getItem('onboardingStep');
      if (savedStep === 'cv' || hasProfile) setStep(hasCv ? 3 : 2);
      else setStep(1);

      setChecking(false);
    }).catch(() => setChecking(false));
  }, [router]);

  function handleProfileStep() {
    localStorage.setItem('onboardingStep', 'profile');
    router.push('/profile');
  }

  function handleCvStep() {
    localStorage.setItem('onboardingStep', 'cv');
    router.push('/cv-upload');
  }

  function handleFinish() {
    localStorage.setItem('onboardingDone', 'true');
    localStorage.removeItem('onboardingStep');
    router.push('/dashboard');
  }

  function skipOnboarding() {
    localStorage.setItem('onboardingDone', 'true');
    localStorage.removeItem('onboardingStep');
    router.push('/dashboard');
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTop: '4px solid #1a4fba', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const currentStep = STEPS[step] || STEPS[0];

  return (
    <div style={{ minHeight: '100vh', width: '100vw', boxSizing: 'border-box', flex: '0 0 100vw', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/img/logo.png" alt="Carriera" style={{ height: 48 }} />
        </div>

        {/* Adım göstergesi */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i < step ? '#10b981' : i === step ? s.color : '#e5e7eb',
                color: i <= step ? '#fff' : '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.3s',
              }}>
                {i < step ? <i className="fa-solid fa-check"></i> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 40, height: 2, background: i < step ? '#10b981' : '#e5e7eb', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Kart */}
        <div style={{ background: '#fff', borderRadius: 24, padding: '48px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.08)', textAlign: 'center' }}>

          {/* İkon */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${currentStep.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '2rem', color: currentStep.color }}>
            <i className={`fa-solid ${currentStep.icon}`}></i>
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
            {step === 0 ? `Hoş geldin, ${username.split('@')[0]}!` : currentStep.title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7, marginBottom: 36 }}>
            {currentStep.desc}
          </p>

          {/* Adım 0: Karşılama */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(26,79,186,0.3)' }}
              >
                Başlayalım <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
              </button>
              <button onClick={skipOnboarding} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', padding: 8 }}>
                Şimdi değil, atla
              </button>
            </div>
          )}

          {/* Adım 1: Profil */}
          {step === 1 && (
            <div>
              {/* Durum göstergesi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: profileDone ? '#f0fdf4' : '#fef9c3', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
                <i className={`fa-solid ${profileDone ? 'fa-circle-check' : 'fa-circle-info'}`} style={{ color: profileDone ? '#10b981' : '#eab308', fontSize: '1.2rem' }}></i>
                <span style={{ fontSize: '0.9rem', color: profileDone ? '#166534' : '#854d0e', fontWeight: 500 }}>
                  {profileDone ? 'Profilin tamamlandı! Devam edebilirsin.' : 'Profil bilgilerin henüz eksik.'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={handleProfileStep}
                  style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}
                >
                  {profileDone ? 'Profili Güncelle' : 'Profili Doldur'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
                </button>
                {profileDone && (
                  <button onClick={() => setStep(2)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                    Sonraki Adım <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
                  </button>
                )}
                <button onClick={skipOnboarding} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem', padding: 8 }}>
                  Şimdi değil, atla
                </button>
              </div>
            </div>
          )}

          {/* Adım 2: CV */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: cvDone ? '#f0fdf4' : '#fef9c3', borderRadius: 12, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
                <i className={`fa-solid ${cvDone ? 'fa-circle-check' : 'fa-circle-info'}`} style={{ color: cvDone ? '#10b981' : '#eab308', fontSize: '1.2rem' }}></i>
                <span style={{ fontSize: '0.9rem', color: cvDone ? '#166534' : '#854d0e', fontWeight: 500 }}>
                  {cvDone ? 'CV\'n yüklendi! YZ analizi hazır.' : 'Henüz CV yüklemedin.'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={handleCvStep}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
                >
                  {cvDone ? 'CV Sayfasına Git' : 'CV Yükle'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
                </button>
                <button onClick={() => setStep(3)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                  {cvDone ? 'Sonraki Adım' : 'Şimdi değil, atla'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
                </button>
              </div>
            </div>
          )}

          {/* Adım 3: Bitti */}
          {step === 3 && (
            <div>
              {/* Özet */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Profil', done: profileDone, icon: 'fa-user-pen', color: '#8b5cf6' },
                  { label: 'CV', done: cvDone, icon: 'fa-file-arrow-up', color: '#10b981' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '14px 16px', borderRadius: 12, background: item.done ? `${item.color}10` : '#f9fafb', border: `1.5px solid ${item.done ? item.color + '30' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className={`fa-solid ${item.done ? 'fa-circle-check' : 'fa-circle'}`} style={{ color: item.done ? item.color : '#d1d5db', fontSize: '1.1rem' }}></i>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: item.done ? '#1f2937' : '#9ca3af' }}>{item.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleFinish}
                style={{ width: '100%', background: 'linear-gradient(135deg, #1a4fba, #8b5cf6)', color: '#fff', border: 'none', padding: '18px 32px', borderRadius: 12, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(26,79,186,0.3)' }}
              >
                Dashboard'a Git <i className="fa-solid fa-rocket" style={{ marginLeft: 8 }}></i>
              </button>
            </div>
          )}
        </div>

        {/* Alt bilgi */}
        {step > 0 && step < 3 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: 16 }}>
            İstediğin zaman bu adımları <a href="/dashboard" style={{ color: '#1a4fba', textDecoration: 'none' }}>dashboard</a>'dan tamamlayabilirsin.
          </p>
        )}
      </div>
    </div>
  );
}
