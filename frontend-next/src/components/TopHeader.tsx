'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { useSocket } from '@/hooks/useSocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function TopHeader() {
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState('user');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/adventurer/svg?seed=user');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gerçek zamanlı bildirim — Socket.io
  useSocket((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setNotifCount(prev => prev + 1);
  });

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem('currentUser') || 'user';
    setUsername(user);
    setAvatarUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user)}`);

    const token = localStorage.getItem('token');
    if (token) {
      // Profil avatarı
      fetch(`${API_URL}/api/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p?.avatarUrl) {
            const url = p.avatarUrl.startsWith('http') ? p.avatarUrl : `${API_URL}${p.avatarUrl}`;
            setAvatarUrl(url);
          }
        })
        .catch(() => {});

      // Mevcut bildirimleri çek (sayfa yüklendiğinde)
      fetch(`${API_URL}/api/notifications/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          setNotifications(data);
          setNotifCount(data.filter((n: any) => !n.read).length);
        })
        .catch(() => {});
    }
  }, []);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        notifPanelRef.current && !notifPanelRef.current.contains(target) &&
        bellRef.current && !bellRef.current.contains(target)
      ) {
        setShowNotifPanel(false);
      }
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        avatarRef.current && !avatarRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function handleNotifClick() {
    setShowNotifPanel(prev => !prev);
    setShowDropdown(false);
  }

  function handleDropdownClick() {
    setShowDropdown(prev => !prev);
    setShowNotifPanel(false);
  }

  function markAllAsRead() {
    const token = localStorage.getItem('token');
    if (token && notifCount > 0) {
      fetch(`${API_URL}/api/notifications/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => {
        setNotifCount(0);
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }).catch(() => {});
    }
  }

  function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminMode');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  }

  // Portal ile render edilecek bildirim paneli
  const notifPortal = mounted && showNotifPanel && createPortal(
    <div
      ref={notifPanelRef}
      style={{
        position: 'fixed',
        top: '70px',
        right: '80px',
        zIndex: 2147483647,
        background: '#fff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        borderRadius: '12px',
        width: '320px',
        padding: '15px',
        color: '#333',
        border: '1px solid #eee',
        animation: 'fadeInDown 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Bildirimler</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {notifCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{ background: 'none', border: 'none', color: '#1a4fba', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Tümünü Okundu İşaretle
            </button>
          )}
          <i
            className="fa-solid fa-xmark"
            onClick={() => setShowNotifPanel(false)}
            style={{ cursor: 'pointer', fontSize: '1.1rem', color: '#888' }}
          />
        </div>
      </div>
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '20px 0', margin: 0 }}>
            Henüz bildirim bulunmamaktadır
          </p>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id || i}
              style={{
                padding: '12px',
                borderBottom: '1px solid #f0f0f0',
                background: n.read ? 'transparent' : '#f0f8ff',
                borderRadius: '8px',
                marginBottom: '6px',
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '3px' }}>{n.title}</strong>
              <span style={{ fontSize: '0.82rem', color: '#555' }}>{n.message}</span>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );

  // Portal ile render edilecek profil dropdown
  const dropdownPortal = mounted && showDropdown && createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        zIndex: 2147483647,
        background: '#fff',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        borderRadius: '12px',
        minWidth: '200px',
        overflow: 'hidden',
        border: '1px solid #eee',
        animation: 'fadeInDown 0.15s ease',
      }}
    >
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="fa-solid fa-circle-user" style={{ fontSize: '1.5rem', color: '#555' }} />
        <span style={{ fontWeight: 600, color: '#333' }}>{username.split('@')[0]}</span>
      </div>
      <a
        href="/profile/view"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}
        onClick={() => setShowDropdown(false)}
      >
        <i className="fa-solid fa-user" style={{ width: '18px' }} /> Profilim
      </a>
      <a
        href="/profile"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '0.9rem' }}
        onClick={() => setShowDropdown(false)}
      >
        <i className="fa-solid fa-user-pen" style={{ width: '18px' }} /> Profili Düzenle
      </a>
      <div style={{ height: '1px', background: '#eee', margin: '4px 0' }} />
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); logout(); }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', color: '#e53935', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
      >
        <i className="fa-solid fa-sign-out-alt" style={{ width: '18px' }} /> Çıkış Yap
      </a>
    </div>,
    document.body
  );

  return (
    <>
      <header className="top-header">
        {/* Tema Değiştir */}
        <div className="icon-btn" id="themeToggle" onClick={toggleTheme} title={mounted && theme === 'dark' ? 'Açık Mod'  : 'Koyu Mod'}>
          <i className={mounted && theme === 'dark' ? 'fa-solid fa-sun'  : 'fa-solid fa-moon'} />
        </div>

        {/* Bildirim Zili */}
        <div ref={bellRef} className="notif-container" style={{ position: 'relative' }}>
          <div
            className="icon-btn"
            onClick={handleNotifClick}
            style={{ cursor: 'pointer', position: 'relative' }}
            aria-label="Bildirimler"
          >
            <i className="fa-solid fa-bell" />
            {notifCount > 0 && (
              <span className="notification-badge">{notifCount}</span>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div ref={avatarRef} className="user-dropdown-container" style={{ position: 'relative' }}>
          <div
            className="icon-btn profile-avatar-btn"
            onClick={handleDropdownClick}
            style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
            aria-label="Profil menüsü"
          >
            <img
              src={avatarUrl}
              alt="Profil"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username || 'user')}`;
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
        </div>
      </header>

      {/* Paneller — createPortal ile doğrudan <body>'ye */}
      {notifPortal}
      {dropdownPortal}
    </>
  );
}
