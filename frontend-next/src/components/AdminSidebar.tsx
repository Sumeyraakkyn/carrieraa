'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', icon: 'fa-chart-line', label: 'Dashboard' },
  { href: '/admin/education', icon: 'fa-graduation-cap', label: 'Eğitim ve Öneriler' },
  { href: '/admin/achievements', icon: 'fa-trophy', label: 'Başarı & Puanlama' },
  { href: '/admin/skills', icon: 'fa-star', label: 'Yetkinlik Analizi' },
  { href: '/admin/progress', icon: 'fa-chart-bar', label: 'İlerleme & Gelişim' },
  { href: '/admin/cv-review', icon: 'fa-file-lines', label: 'Oluşturulan CV\'ler' },
  { href: '/admin/ai-analytics', icon: 'fa-brain', label: 'YZ Analitik' },
  { href: '/admin/account', icon: 'fa-user-gear', label: 'Hesap Ayarları' },
];

type AdminSidebarProps = {
  onCollapsedChange?: (collapsed: boolean) => void;
};

export default function AdminSidebar({ onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedValue = localStorage.getItem('adminSidebarCollapsed');
    if (savedValue === 'true') setIsCollapsed(true);
    document.body.classList.add('admin-shell');
    return () => document.body.classList.remove('admin-shell', 'admin-sidebar-collapsed');
  }, []);

  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
    document.body.classList.toggle('admin-sidebar-collapsed', isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      localStorage.setItem('adminSidebarCollapsed', String(next));
      return next;
    });
  }

  function closeMobileMenu() {
    setIsOpen(false);
  }

  function logout() {
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('adminMode');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/login';
  }

  return (
    <>
      <button
        type="button"
        className="admin-menu-toggle"
        aria-label="Yönetim menüsünü aç"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <i className="fa-solid fa-bars" />
      </button>
      <button
        type="button"
        className={`admin-sidebar-overlay${isOpen ? ' is-visible' : ''}`}
        aria-label="Yönetim menüsünü kapat"
        onClick={closeMobileMenu}
      />
      <aside className={`admin-sidebar${isOpen ? ' is-open' : ''}${isCollapsed ? ' is-collapsed' : ''}`}>
        <div className="admin-sidebar-top">
          <a href="/admin" className="admin-sidebar-brand" aria-label="Carriera yönetim merkezi">
            <img src="/img/logo.png" alt="Carriera" />
            <span>CARRIERA</span>
          </a>
          <button type="button" className="admin-sidebar-collapse" onClick={toggleCollapsed} aria-label={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}>
            <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`} />
          </button>
        </div>
        <div className="admin-sidebar-badge"><i className="fa-solid fa-shield-halved" /><span>Yönetici Alanı</span></div>
        <nav className="admin-nav-links" aria-label="Yönetim menüsü">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={`admin-nav-item${pathname === item.href ? ' active' : ''}`} onClick={closeMobileMenu} title={isCollapsed ? item.label : undefined}>
              <i className={`fa-solid ${item.icon}`} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <button type="button" className="admin-nav-item admin-logout-btn" onClick={logout} title={isCollapsed ? 'Çıkış Yap' : undefined}>
          <i className="fa-solid fa-arrow-right-from-bracket" />
          <span>Çıkış Yap</span>
        </button>
      </aside>
    </>
  );
}
