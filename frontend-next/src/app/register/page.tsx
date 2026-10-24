'use client';
import { useEffect } from 'react';

export default function RegisterPage() {
  useEffect(() => {  }, []);

  return (
    <div className="container">
      <link rel="stylesheet" href="/styles/hesap-sec.css" />
      <div className="logo-section">
        <img src="/img/logo.png" alt="Carriera Logo" className="logo-img" />
        <div className="brand-name">CARRIERA</div>
      </div>
      <div className="button-group">
        <a href="/register/user" className="btn-select">Kullanıcı Hesabı</a>
        <a href="/register/admin" className="btn-select">Yönetici Hesabı</a>
      </div>
      <a href="/login" className="back-btn">
        <i className="fa-solid fa-arrow-left"></i> Geri Dön
      </a>
    </div>
  );
}
