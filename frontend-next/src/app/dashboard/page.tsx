'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import TopHeader from '@/components/TopHeader';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AiRecommendationCard from '@/components/AiRecommendationCard';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DashboardPage() {
  useAuthGuard('USER');
  const [username, setUsername] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<{
    profileDone: boolean;
    cvDone: boolean;
    show: boolean;
  }>({ profileDone: true, cvDone: true, show: false });

  const token = useAuthStore(s => s.token);
  const currentUser = useAuthStore(s => s.currentUser);

  useEffect(() => {
    setUsername(currentUser || '');

    const onboardingDone = localStorage.getItem('onboardingDone') === 'true';

    if (token && !onboardingDone) {
      Promise.all([
        fetch(`${API_URL}/api/profile/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : null),
        fetch(`${API_URL}/api/documents/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []),
      ]).then(([profile, docs]) => {
        const profileDone = !!(profile?.fullName && profile?.careerGoal);
        const cvDone = Array.isArray(docs) && docs.some((d: any) => d.type === 'CV');
        const allDone = profileDone && cvDone;
        if (allDone) localStorage.setItem('onboardingDone', 'true');
        setOnboardingStatus({ profileDone, cvDone, show: !allDone });
        setPageLoading(false);
      }).catch(() => setPageLoading(false));
    } else {
      setTimeout(() => setPageLoading(false), 300);
    }  }, [token, currentUser]);

  const cards = [
    { img: '/img/ai_head.jpg', label: 'YETKİNLİK ANALİZİ', href: '/skills' },
    { img: '/img/idea.jpg', label: 'EĞİTİMLER & ÖNERİ', href: '/education' },
    { img: '/img/target.jpg', label: 'ÖDÜL & BAŞARI PUANLAMA', href: '/rewards' },
    { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', label: 'İLERLEME & GELİŞİM TAKİP', href: '/progress' },
    { img: '/img/handshake.jpg', label: 'POTANSİYELİNİ KEŞFET', href: '/potential' },
    { img: '/img/diploma.jpg', label: 'CV YÜKLE', href: '/cv-upload' },
    { img: '/img/cv.jpg', label: 'CV OLUŞTUR', href: '/cv-builder' },
  ];

  // Tamamlanma yüzdesi
  const doneCount = [onboardingStatus.profileDone, onboardingStatus.cvDone].filter(Boolean).length;
  const totalSteps = 2;
  const pct = Math.round((doneCount / totalSteps) * 100);

  return (
    <>
      <UserSidebar />
      <div className="main-content">
        <TopHeader />

        <div className="page-content" style={{ display: 'block', paddingTop: '20px' }}>
          <div className="dashboard-grid">
            {cards.map((c, i) => (
                <div key={i} className={`card${c.href === '/cv-builder' ? ' cv-create-card' : ''}`} onClick={() => window.location.href = c.href}>
                <div className="card-image-wrapper">
                  <img src={c.img} alt={c.label} />
                </div>
                <div className="card-content">
                  <button className="card-btn" onClick={(e) => { e.stopPropagation(); window.location.href = c.href; }}>{c.label}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
