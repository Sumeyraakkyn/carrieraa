'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AiRecommendationCard() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [modelR2, setModelR2] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/python-ai/recommendation`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : Promise.reject('Recommendation failed')),
      
      fetch(`${API_URL}/api/python-ai/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.ok ? r.json() : Promise.reject('Performance failed'))
    ])
    .then(([recData, perfData]) => {
      setRecommendations(recData.recommended_trainings || []);
      setReasoning(recData.reasoning || '');
      setPerformanceScore(perfData.predicted_performance_score || null);
      setModelR2(typeof perfData.prediction_confidence === 'number' ? perfData.prediction_confidence : null);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Yapay zeka analizleri şu an alınamıyor.');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
        <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite', marginRight: '16px' }}></div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>Yapay zeka sizin için en uygun kariyer analizini hazırlıyor...</p>
      </div>
    );
  }

  if (error) {
    return null; // Hata varsa kartı gizle
  }

  // 1-5 arası skoru (perfData'dan gelen) 100 üzerinden yansıtmak için
  const score100 = performanceScore ? Math.round(performanceScore * 20) : 0;

  return (
    <div style={{ background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderRadius: '16px', padding: '24px', marginBottom: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#3b82f6', color: 'white', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
          <i className="fa-solid fa-brain"></i>
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Sana Özel Eğitim Önerileri</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0 0' }}>Yapay Zeka (Random Forest) Destekli Kariyer Analizi</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Sol Taraf: Öneriler ve Açıklanabilirlik (XAI) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
              <i className="fa-solid fa-lightbulb"></i> Sistem Neden Bu Eğitimleri Önerdi? (XAI)
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: 1.6, margin: 0 }}>
              {reasoning}
            </p>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '12px', margin: '0 0 12px 0' }}>Önerilen Eğitimler:</h4>
            {recommendations.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.map((rec, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: '#d1fae5', color: '#10b981', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                      <i className="fa-solid fa-arrow-trend-up"></i>
                    </div>
                    {rec}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ padding: '16px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontSize: '0.9rem' }}>Şu an için yeni bir öneri bulunmuyor.</div>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Performans Tahmini */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 24px 0', textAlign: 'center' }}>
            Tahmini Gelecek Performans Skoru
          </p>
          
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: `conic-gradient(#10b981 ${performanceScore ? score100 * 3.6 : 0}deg, #f1f5f9 0deg)`, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'absolute', width: '136px', height: '136px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{performanceScore ? score100 : '--'}</span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>/ 100 Puan</span>
            </div>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '24px 0 0 0', textAlign: 'center', lineHeight: 1.5 }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
            {modelR2 !== null
              ? `Modelin test verisindeki açıklayıcılık metriği (R²): ${modelR2.toFixed(4)}.`
              : 'Model metriği şu anda alınamıyor.'}
          </p>
        </div>
      </div>
    </div>
  );
}
