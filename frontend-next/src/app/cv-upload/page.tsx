'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface CvAnalysis {
  documentId: number;
  alignmentScore: number;
  detectedSkills: {
    technical: string[];
    softSkills: string[];
    languages: string[];
    certificates: string[];
    languageDetails?: { language: string; level: string }[];
    certificateDetails?: { name: string; source: string }[];
    links?: { linkedin: string | null; github: string | null; portfolio: string | null; urls: string[] };
    extractionQuality?: { wordCount: number; characterCount: number; confidence: 'low' | 'medium' | 'high'; warning: string | null };
    experience?: { years: number; label: string; source?: 'explicit' | 'not_specified' };
    education?: { level: string; score: number };
    qualityScore?: { score: number; grade: string; breakdown: Record<string, { score: number; max: number; detail: string }>; tips: string[] };
    resumeFeedback?: {
      targetRole: string;
      projectSuggestions: string[];
      keywordSuggestions: string[];
      actionPlan: string[];
    };
  };
  skillGap: string[];
  analysisVersion: string;
  updatedAt: string;
}

export default function CvUploadPage() {
  useAuthGuard('USER');
  const [cvUploadStatus, setCvUploadStatus] = useState('');
  const [cvUploadColor, setCvUploadColor] = useState('#333');
  const [myCVs, setMyCVs] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<Record<number, CvAnalysis | 'loading' | 'none'>>({});
  const [expandedSkills, setExpandedSkills] = useState<Record<number, boolean>>({});
  const [expandedGap, setExpandedGap] = useState<Record<number, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/documents/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then(docs => {
          const cvs = docs.filter((d: any) => d.type === 'CV');
          setMyCVs(cvs);
          // Her CV için analiz çek
          cvs.forEach((cv: any) => fetchAnalysis(cv.id, token));
        })
        .catch(() => {});
    }  }, []);

  async function fetchAnalysis(documentId: number, token: string) {
    setAnalyses(prev => ({ ...prev, [documentId]: 'loading' }));
    try {
      const res = await fetch(`${API_URL}/api/ai/cv-analysis/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyses(prev => ({ ...prev, [documentId]: data }));
      } else {
        setAnalyses(prev => ({ ...prev, [documentId]: 'none' }));
      }
    } catch {
      setAnalyses(prev => ({ ...prev, [documentId]: 'none' }));
    }
  }

  async function pollAnalysis(documentId: number, token: string, attempts = 5) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const res = await fetch(`${API_URL}/api/ai/cv-analysis/${documentId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalyses(prev => ({ ...prev, [documentId]: data }));
          return;
        }
      } catch { /* sonraki denemede tekrar kontrol et */ }
      if (attempt < attempts - 1) await new Promise(resolve => setTimeout(resolve, 2000));
    }
    setAnalyses(prev => ({ ...prev, [documentId]: 'none' }));
  }

  async function reanalyzeCv(documentId: number) {
    const token = localStorage.getItem('token');
    if (!token) return;
    setAnalyses(prev => ({ ...prev, [documentId]: 'loading' }));
    try {
      const res = await fetch(`${API_URL}/api/documents/${documentId}/reanalyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [documentId]: res.ok ? data.analysis : 'none' }));
      if (!res.ok) {
        setCvUploadStatus(data.error || 'CV yeniden analiz edilemedi.');
        setCvUploadColor('#f44336');
      }
    } catch {
      setAnalyses(prev => ({ ...prev, [documentId]: 'none' }));
    }
  }

  async function handleFileUpload(file: File) {
    setCvUploadStatus('Yükleniyor... Lütfen bekleyin.');
    setCvUploadColor('#1a4fba');
    const token = localStorage.getItem('token');
    if (!token) { setCvUploadStatus('Lütfen önce giriş yapın!'); setCvUploadColor('red'); return; }
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', 'CV');
    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (res.ok) {
        setCvUploadStatus('Tebrikler! CV dosyanız başarıyla yüklendi. YZ analizi arka planda başlatıldı...');
        setCvUploadColor('#4CAF50');
        setMyCVs(prev => [data.document, ...prev]);
        window.dispatchEvent(new Event('carriera:achievements-refresh'));
        setAnalyses(prev => ({ ...prev, [data.document.id]: 'loading' }));
        // Arka plan analizi tamamlanana kadar kısa aralıklarla kontrol et.
        setTimeout(() => pollAnalysis(data.document.id, token), 1500);
      } else {
        setCvUploadStatus('Hata: ' + data.error);
        setCvUploadColor('#f44336');
      }
    } catch {
      setCvUploadStatus('Sunucu ile bağlantı kurulamadı!');
      setCvUploadColor('#f44336');
    }
  }

  function getScoreColor(score: number) {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  function asExternalUrl(value: string) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/cv-yukle.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', padding: '0 20px' }}>
          <div style={{ maxWidth: '760px', width: '100%' }}>

            {/* Başlık */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ color: 'var(--text-color)', fontSize: '2rem', fontWeight: 700 }}>Özgeçmişini Yükle</h1>
              <p style={{ color: 'var(--text-color)', marginTop: '10px' }}>CV'niz yüklendikten sonra YZ motoru otomatik olarak beceri analizi yapar ve kariyer hedefinizle uyum skorunu hesaplar.</p>
            </div>

            {/* Upload Alanı */}
            <div
              style={{ border: '2px dashed #1a4fba', borderRadius: '16px', background: 'var(--card-bg)', padding: '50px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => document.getElementById('cv-upload-input')?.click()}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(26, 79, 186, 0.05)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--card-bg)')}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '4rem', color: '#1a4fba', marginBottom: '20px' }}></i>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '10px' }}>Dosya Seç veya Sürükle Bırak</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>Desteklenen formatlar: .pdf, .docx, .doc (Maksimum 5MB)</p>
              <button type="button" style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '30px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                Bilgisayarından Seç
              </button>
              <input type="file" id="cv-upload-input" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={e => e.target.files && handleFileUpload(e.target.files[0])} />
            </div>

            {cvUploadStatus && (
              <div style={{ marginTop: '20px', padding: '15px 20px', borderRadius: '8px', background: cvUploadColor === '#4CAF50' ? '#e8f5e9' : cvUploadColor === '#f44336' ? '#ffebee' : '#f5f5f5', color: cvUploadColor, fontWeight: 600, textAlign: 'center', borderLeft: `4px solid ${cvUploadColor}` }}>
                {cvUploadStatus}
              </div>
            )}

            {/* CV Listesi */}
            <div style={{ marginTop: '50px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 600, borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <i className="fa-regular fa-folder-open" style={{ marginRight: '10px', color: '#1a4fba' }}></i>Yüklenen Özgeçmişlerim
              </h3>

              {myCVs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: '#888' }}>Henüz yüklenmiş bir CV bulunmamaktadır.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {myCVs.map(cv => {
                    const analysis = analyses[cv.id];
                    const isLoading = analysis === 'loading';
                    const hasAnalysis = analysis && analysis !== 'loading' && analysis !== 'none';
                    const ana = hasAnalysis ? (analysis as CvAnalysis) : null;

                    return (
                      <div key={cv.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden', borderLeft: cv.status === 'approved' ? '4px solid #4CAF50' : cv.status === 'rejected' ? '4px solid #f44336' : '4px solid #FF9800', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>

                        {/* CV Satırı */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: 45, height: 45, borderRadius: 8, background: 'rgba(229, 57, 53, 0.1)', color: '#e53935', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                              <i className="fa-solid fa-file-pdf"></i>
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <a href={`${API_URL}${cv.fileUrl}`} target="_blank" rel="noreferrer" style={{ color: '#1a4fba', textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem' }}>
                                  {cv.fileName}
                                </a>
                                <button
                                  onClick={() => setPreviewUrl(`${API_URL}${cv.fileUrl}`)}
                                  title="Dosyayı önizle"
                                  style={{ background: 'rgba(26, 79, 186, 0.1)', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', color: '#1a4fba', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                  <i className="fa-solid fa-eye"></i> Önizle
                                </button>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(cv.createdAt).toLocaleDateString('tr-TR')} tarihinde yüklendi</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              onClick={() => reanalyzeCv(cv.id)}
                              disabled={isLoading}
                              title="CV'yi güncel analiz kurallarıyla tekrar işle"
                              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 9px', cursor: isLoading ? 'wait' : 'pointer', fontSize: '0.74rem', fontWeight: 600, opacity: isLoading ? 0.65 : 1 }}
                            >
                              <i className="fa-solid fa-rotate-right" style={{ marginRight: 4 }}></i> Yeniden analiz et
                            </button>
                            {/* YZ Skoru rozeti */}
                            {isLoading && (
                              <span style={{ fontSize: '0.78rem', color: '#888', background: '#f3f4f6', padding: '4px 10px', borderRadius: 20 }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 4 }}></i>Analiz ediliyor...
                              </span>
                            )}
                            {ana && (
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, background: `${getScoreColor(ana.alignmentScore)}15`, color: getScoreColor(ana.alignmentScore), padding: '4px 12px', borderRadius: 20, border: `1px solid ${getScoreColor(ana.alignmentScore)}30` }}>
                                <i className="fa-solid fa-brain" style={{ marginRight: 4 }}></i>YZ: %{ana.alignmentScore}
                              </span>
                            )}
                            <div style={{ padding: '6px 15px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, background: cv.status === 'approved' ? '#e8f5e9' : cv.status === 'rejected' ? '#ffebee' : '#fff3e0', color: cv.status === 'approved' ? '#4CAF50' : cv.status === 'rejected' ? '#f44336' : '#FF9800' }}>
                              {cv.status === 'approved' ? 'Onaylandı' : cv.status === 'rejected' ? 'Reddedildi' : 'İnceleniyor'}
                            </div>
                          </div>
                        </div>

                        {/* YZ Analiz Detayı */}
                        {ana && (
                          <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px', background: 'var(--bg-color)' }}>

                            {/* Deneyim & Eğitim bilgi satırı */}
                            {(ana.detectedSkills.experience || ana.detectedSkills.education) && (
                              <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                                {ana.detectedSkills.experience && ana.detectedSkills.experience.label !== 'Belirtilmemiş' && (
                                  <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                    <i className="fa-solid fa-briefcase" style={{ marginRight: 5 }}></i>
                                    Deneyim: {ana.detectedSkills.experience.label}
                                  </span>
                                )}
                                {ana.detectedSkills.education && ana.detectedSkills.education.level !== 'Belirtilmemiş' && (
                                  <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                    <i className="fa-solid fa-graduation-cap" style={{ marginRight: 5 }}></i>
                                    Eğitim: {ana.detectedSkills.education.level}
                                  </span>
                                )}
                                <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 }}>
                                  <i className="fa-solid fa-brain" style={{ marginRight: 5 }}></i>
                                  Analiz v{ana.analysisVersion}
                                </span>
                                {ana.detectedSkills.qualityScore && (
                                  <span style={{
                                    padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                                    background: ana.detectedSkills.qualityScore.score >= 75 ? '#d1fae5' : ana.detectedSkills.qualityScore.score >= 50 ? '#fef9c3' : '#fee2e2',
                                    color: ana.detectedSkills.qualityScore.score >= 75 ? '#065f46' : ana.detectedSkills.qualityScore.score >= 50 ? '#78350f' : '#991b1b',
                                  }}>
                                    <i className="fa-solid fa-star" style={{ marginRight: 5 }}></i>
                                    CV Kalitesi: {ana.detectedSkills.qualityScore.grade} ({ana.detectedSkills.qualityScore.score}/100)
                                  </span>
                                )}
                              </div>
                            )}

                            {ana.detectedSkills.extractionQuality && (
                              <div style={{ marginBottom: 14, padding: '9px 12px', borderRadius: 9, fontSize: '0.76rem', background: ana.detectedSkills.extractionQuality.confidence === 'low' ? '#fff7ed' : '#eff6ff', color: ana.detectedSkills.extractionQuality.confidence === 'low' ? '#9a3412' : '#1e40af', border: `1px solid ${ana.detectedSkills.extractionQuality.confidence === 'low' ? '#fed7aa' : '#bfdbfe'}` }}>
                                <i className={`fa-solid ${ana.detectedSkills.extractionQuality.confidence === 'low' ? 'fa-triangle-exclamation' : 'fa-file-lines'}`} style={{ marginRight: 6 }}></i>
                                Metin okuma güveni: <strong>{ana.detectedSkills.extractionQuality.confidence === 'high' ? 'Yüksek' : ana.detectedSkills.extractionQuality.confidence === 'medium' ? 'Orta' : 'Düşük'}</strong> · {ana.detectedSkills.extractionQuality.wordCount} kelime
                                {ana.detectedSkills.extractionQuality.warning && <> · {ana.detectedSkills.extractionQuality.warning}</>}
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                              {/* Tespit Edilen Beceriler */}
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                                  <i className="fa-solid fa-check-circle" style={{ color: '#10b981', marginRight: 6 }}></i>
                                  Tespit Edilen Beceriler
                                  <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>
                                    ({(ana.detectedSkills.technical?.length || 0) + (ana.detectedSkills.languages?.length || 0) + (ana.detectedSkills.certificates?.length || 0) + (ana.detectedSkills.softSkills?.length || 0)} adet)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {/* Teknik beceriler */}
                                  {(expandedSkills[cv.id]
                                    ? (ana.detectedSkills.technical || [])
                                    : (ana.detectedSkills.technical || []).slice(0, 6)
                                  ).map(s => (
                                    <span key={s} style={{ background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>
                                  ))}
                                  {/* Soft skills */}
                                  {(expandedSkills[cv.id] ? (ana.detectedSkills.softSkills || []) : (ana.detectedSkills.softSkills || []).slice(0, 3)).map(s => (
                                    <span key={s} style={{ background: '#fce7f3', color: '#9d174d', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>
                                  ))}
                                  {/* Diller */}
                                  {(ana.detectedSkills.languageDetails || ana.detectedSkills.languages || []).map(item => {
                                    const detail = typeof item === 'string' ? { language: item, level: '' } : item;
                                    return <span key={detail.language} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}>{detail.language}{detail.level && detail.level !== 'Seviye belirtilmemiş' ? ` · ${detail.level}` : ''}</span>;
                                  })}
                                  {/* Sertifikalar — ilk üçü her zaman görünür */}
                                  {(expandedSkills[cv.id] ? (ana.detectedSkills.certificates || []) : (ana.detectedSkills.certificates || []).slice(0, 3)).map(s => (
                                    <span key={s} style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}><i className="fa-solid fa-certificate" style={{ marginRight: 4 }}></i>{s}</span>
                                  ))}
                                  {/* Genişlet/Daralt butonu */}
                                  {((ana.detectedSkills.technical?.length || 0) > 6 || (ana.detectedSkills.softSkills?.length || 0) > 3 || (ana.detectedSkills.certificates?.length || 0) > 3) && (
                                    <button
                                      onClick={() => setExpandedSkills(prev => ({ ...prev, [cv.id]: !prev[cv.id] }))}
                                      style={{ background: '#e5e7eb', color: '#374151', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                      {expandedSkills[cv.id] ? '▲ Daha az göster' : '+ Daha fazla göster'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Eksik Beceriler */}
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f59e0b', marginRight: 6 }}></i>
                                  Eksik Beceriler (Skill Gap)
                                  {ana.skillGap.length > 0 && (
                                    <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>({ana.skillGap.length} adet)</span>
                                  )}
                                </div>
                                {ana.skillGap.length === 0 ? (
                                  <span style={{ fontSize: '0.82rem', color: '#10b981' }}>Kariyer hedefi için tüm beceriler mevcut!</span>
                                ) : (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {(expandedGap[cv.id] ? ana.skillGap : ana.skillGap.slice(0, 5)).map(s => (
                                      <span key={s} style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>
                                    ))}
                                    {ana.skillGap.length > 5 && (
                                      <button
                                        onClick={() => setExpandedGap(prev => ({ ...prev, [cv.id]: !prev[cv.id] }))}
                                        style={{ background: '#e5e7eb', color: '#374151', padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        {expandedGap[cv.id]
                                          ? '▲ Daha az göster'
                                          : `+${ana.skillGap.length - 5} daha göster`}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {ana.detectedSkills.links && (ana.detectedSkills.links.linkedin || ana.detectedSkills.links.github || ana.detectedSkills.links.portfolio) && (
                              <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 8 }}>
                                  <i className="fa-solid fa-link" style={{ color: '#2563eb', marginRight: 6 }}></i>CV&apos;den Tespit Edilen Bağlantılar
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {ana.detectedSkills.links.linkedin && <a href={asExternalUrl(ana.detectedSkills.links.linkedin)} target="_blank" rel="noreferrer" style={{ color: '#0a66c2', background: '#e0f2fe', padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}><i className="fa-brands fa-linkedin" style={{ marginRight: 5 }}></i>LinkedIn&apos;i aç</a>}
                                  {ana.detectedSkills.links.github && <a href={asExternalUrl(ana.detectedSkills.links.github)} target="_blank" rel="noreferrer" style={{ color: '#111827', background: '#e5e7eb', padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}><i className="fa-brands fa-github" style={{ marginRight: 5 }}></i>GitHub&apos;ı aç</a>}
                                  {ana.detectedSkills.links.portfolio && <a href={asExternalUrl(ana.detectedSkills.links.portfolio)} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', background: '#f3e8ff', padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}><i className="fa-solid fa-globe" style={{ marginRight: 5 }}></i>Portföyü aç</a>}
                                </div>
                                {(ana.detectedSkills.certificates || []).length === 0 && (
                                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, fontSize: '0.73rem', lineHeight: 1.4 }}>
                                    <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }}></i>
                                    Sertifika, PDF&apos;nin seçilebilir metninde tespit edilemedi. Sertifika görsel/taranmış bir bölümdeyse OCR&apos;lı PDF veya DOCX yükleyin; metin içindeyse “Sertifikalar” başlığı altında yazın.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Uyum Skoru Çubuğu */}
                            <div style={{ marginTop: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: 4 }}>
                                <span>Kariyer Hedefi Uyum Skoru</span>
                                <span style={{ fontWeight: 700, color: getScoreColor(ana.alignmentScore) }}>%{ana.alignmentScore}</span>
                              </div>
                              <div style={{ background: '#e5e7eb', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                                <div style={{ width: `${ana.alignmentScore}%`, height: '100%', background: getScoreColor(ana.alignmentScore), borderRadius: 8, transition: 'width 1s ease' }}></div>
                              </div>
                            </div>

                            {/* CV Kalite Detayları */}
                            {ana.detectedSkills.qualityScore && (
                              <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 10 }}>
                                  <i className="fa-solid fa-chart-bar" style={{ color: '#6366f1', marginRight: 6 }}></i>
                                  CV Kalite Analizi
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                                  {Object.entries(ana.detectedSkills.qualityScore.breakdown).map(([key, val]) => {
                                    const labels: Record<string, string> = { length: 'Uzunluk', sections: 'Bölümler', technical: 'Teknik', softSkills: 'Soft Skill', certificates: 'Sertifika', languages: 'Dil', actionVerbs: 'Eylem Fiili' };
                                    const pct = Math.round((val.score / val.max) * 100);
                                    return (
                                      <div key={key} style={{ background: 'var(--bg-color)', borderRadius: 8, padding: '8px 10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#888', marginBottom: 4 }}>
                                          <span>{labels[key] || key}</span>
                                          <span style={{ fontWeight: 700, color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{val.score}/{val.max}</span>
                                        </div>
                                        <div style={{ background: '#e5e7eb', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 4 }}></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {ana.detectedSkills.qualityScore.tips.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {ana.detectedSkills.qualityScore.tips.map((tip, i) => (
                                      <div key={i} style={{ fontSize: '0.75rem', color: '#b45309', background: 'rgba(217, 119, 6, 0.1)', padding: '5px 10px', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                                        <i className="fa-solid fa-lightbulb" style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }}></i>
                                        {tip}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* YZ Özgeçmiş İyileştirme Önerileri */}
                            {ana.detectedSkills.resumeFeedback && (
                              <div style={{ marginTop: 14, padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#10b981' }}></i>
                                  YZ Özgeçmiş İyileştirme Önerileri ({ana.detectedSkills.resumeFeedback.targetRole || 'Hedef Rol'})
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
                                  {/* Proje Önerileri */}
                                  <div style={{ background: 'var(--card-bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 6 }}>
                                      <i className="fa-solid fa-code" style={{ marginRight: 6, color: '#10b981' }}></i>Önerilen Projeler
                                    </div>
                                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: '0.74rem', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {ana.detectedSkills.resumeFeedback.projectSuggestions?.map((proj: string, idx: number) => (
                                        <li key={idx}>{proj}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Anahtar Kelime Önerileri */}
                                  <div style={{ background: 'var(--card-bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 6 }}>
                                      <i className="fa-solid fa-tags" style={{ marginRight: 6, color: '#10b981' }}></i>CV Anahtar Kelimeleri (ATS)
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {ana.detectedSkills.resumeFeedback.keywordSuggestions?.map((kw: string, idx: number) => (
                                        <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600 }}>{kw}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Yol Haritası / Aksiyon Planı */}
                                <div style={{ background: 'var(--card-bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 6 }}>
                                    <i className="fa-solid fa-map-location-dot" style={{ marginRight: 6, color: '#10b981' }}></i>Aksiyon Planı
                                  </div>
                                  <ol style={{ paddingLeft: 16, margin: 0, fontSize: '0.74rem', color: 'var(--text-color)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {ana.detectedSkills.resumeFeedback.actionPlan?.map((act: string, idx: number) => (
                                      <li key={idx} style={{ fontWeight: 500 }}>{act}</li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {analysis === 'none' && (
                          <div style={{ borderTop: '1px solid #f0f0f0', padding: '12px 20px', background: '#fafafa', fontSize: '0.82rem', color: '#9ca3af' }}>
                            <i className="fa-solid fa-clock" style={{ marginRight: 6 }}></i>YZ analizi henüz tamamlanmadı. Birkaç saniye içinde yenileyin.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dosya Önizleme Modalı ── */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}
          >
            {/* Modal başlık */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f8faff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <i className="fa-solid fa-file-pdf" style={{ color: '#e53935', fontSize: '1.3rem' }}></i>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>Dosya Önizleme</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> Yeni Sekmede Aç
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            </div>
            {/* iframe önizleme */}
            <iframe
              src={previewUrl}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title="CV Önizleme"
            />
          </div>
        </div>
      )}
    </>
  );
}
