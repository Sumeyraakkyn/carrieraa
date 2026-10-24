'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', icon: 'fa-house', label: 'Anasayfa' },
  { href: '/profile/view', icon: 'fa-user', label: 'Profil' },
  { href: '/education', icon: 'fa-layer-group', label: 'Eğitim ve Öneriler' },
  { href: '/skills', icon: 'fa-lightbulb', label: 'Yetkinlik Analizi' },
  { href: '/rewards', icon: 'fa-medal', label: 'Ödül & Başarı Puanlama' },
  { href: '/progress', icon: 'fa-chart-bar', label: 'İlerleme & Gelişim Takibi' },
  { href: '/potential', icon: 'fa-star', label: 'Potansiyelini Keşfet' },
  { href: '/cv-builder', icon: 'fa-file-pen', label: 'CV Oluştur' },
  { href: '/created-cvs', icon: 'fa-folder-open', label: 'Oluşturulan CV\'leri Gör' },
];

export default function UserSidebar() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.add('user-layout');
    return () => {
      document.body.classList.remove('user-layout');
    };
  }, []);

  function toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
    document.querySelector('.menu-toggle')?.classList.toggle('active');
  }

  function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminMode');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  }

  return (
    <>
      <button className="menu-toggle" onClick={toggleSidebar}>
        <span></span><span></span><span></span>
      </button>
      <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/img/logo.png" alt="Carriera Logo" />
          <div className="brand-text">CARRIERA</div>
        </div>
        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
            </a>
          ))}
          <a href="#" className="nav-item logout-btn" style={{ marginTop: 'auto' }} onClick={(e) => { e.preventDefault(); logout(); }}>
            <i className="fa-solid fa-sign-out-alt"></i>
            <span>Çıkış Yap</span>
          </a>
        </nav>
      </div>
    </>
  );
}
