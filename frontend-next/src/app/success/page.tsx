'use client';
import { useEffect } from 'react';

export default function SuccessPage() {
  useEffect(() => {  }, []);

  return (
    <div className="success-container">
      <link rel="stylesheet" href="/styles/olustu.css" />
      <div className="outer-circle">
        <div className="check-icon">
          <i className="fa-solid fa-check"></i>
        </div>
        <div className="congrats-card">
          <h1>TEBRİKLER !</h1>
          <img src="https://cdn-icons-png.flaticon.com/512/10435/10435133.png" alt="confetti" className="confetti-img" />
        </div>
        <p className="success-msg">Başarıyla tamamladınız...</p>
        <a href="/dashboard" className="btn-home">Ana Sayfaya Dön</a>
      </div>
    </div>
  );
}
