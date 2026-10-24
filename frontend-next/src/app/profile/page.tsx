'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Doğal Dil Kariyer Hedefi Bileşeni ───────────────────────────────────────
function CareerGoalInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError: boolean }) {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<'text' | 'select'>('select');

  // Seçili değeri input'a yansıt
  useEffect(() => { if (value) setInputText(value); }, [value]);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (text.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ai/match-career`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        if (data.bestMatch && data.confidence === 'high') {
          onChange(data.bestMatch);
        }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [onChange]);

  // Debounce
  useEffect(() => {
    if (mode !== 'text') return;
    const t = setTimeout(() => fetchSuggestions(inputText), 400);
    return () => clearTimeout(t);
  }, [inputText, mode, fetchSuggestions]);

  if (mode === 'select') {
    return (
      <div>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ borderColor: hasError ? '#ef4444' : undefined, width: '100%' }}>
          <option value="">Lütfen bir alan seçiniz..</option>
          {careerGoals.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button type="button" onClick={() => setMode('text')}
          style={{ marginTop: 6, background: 'none', border: 'none', color: '#1a4fba', cursor: 'pointer', fontSize: '0.8rem', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="fa-solid fa-wand-magic-sparkles"></i> Serbest yaz, YZ eşleştirsin
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={inputText}
            onChange={e => { setInputText(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            placeholder='Örn: "yazılım mühendisi olmak istiyorum"'
            style={{ width: '100%', borderColor: hasError ? '#ef4444' : undefined, paddingRight: 32 }}
            autoComplete="off"
          />
          {loading && (
            <i className="fa-solid fa-spinner fa-spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}></i>
          )}
        </div>
        <button type="button" onClick={() => setMode('select')}
          style={{ background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
          Listeden seç
        </button>
      </div>

      {/* Seçili değer rozeti */}
      {value && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
            <i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>{value}
          </span>
          <button type="button" onClick={() => { onChange(''); setInputText(''); }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
        </div>
      )}

      {/* Öneri dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: '#9ca3af', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 4, color: '#8b5cf6' }}></i>YZ Önerileri
          </div>
          {suggestions.map(s => (
            <div key={s} onClick={() => { onChange(s); setInputText(s); setShowDropdown(false); }}
              style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.9rem', color: '#374151', borderBottom: '1px solid #f9fafb' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const cities = ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir','Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'];
const careerGoals = ['Yazılım Mühendisi','Proje Yöneticisi','Ürün Yöneticisi','Veri Bilimcisi','UI/UX Tasarımcı','İnsan Kaynakları Uzmanı','Pazarlama Uzmanı','Finans Analisti','Operasyon Yöneticisi','Girişimci','Müşteri Deneyimi Uzmanı','Danışman','İş Geliştirme Uzmanı','Lojistik Koordinatör','Hukuk Uzmanı'];
const skillsList = ['İletişim','Figma','Takım Çalışması','Zaman Yönetimi','C#','JavaScript','Python','React','Node.js','SQL','Liderlik','Proje Yönetimi','Veri Analizi','Müzakere','Sunum Becerileri'];
const degreeList = ['Ön Lisans','Lisans','Yüksek Lisans','Doktora','Lise'];
const languagesList = ['İngilizce','Almanca','Fransızca','İspanyolca','İtalyanca','Portekizce','Rusça','Arapça','Çince','Japonca','Korece','Felemenkçe','Lehçe','Ukraynaca','İsveççe','Norveççe','Danca','Fince','Yunanca','İbranice','Hintçe','Bengalce','Urduca','Farsça','Türkçe','Azerbaycanca','Gürcüce','Ermenice','Bulgarca','Romence','Sırpça','Hırvatça','Boşnakça','Çekçe','Slovakça','Macarca','Endonezce','Malayca','Vietnamca','Tayca','Svahili','Latince'];
const languageLevels = ['A1','A2','B1','B2','C1','C2','Anadil'];

interface Experience { company: string; position: string; startDate: string; endDate: string; currentJob: boolean; description: string }
interface Education { school: string; department: string; degree: string; startYear: string; graduationYear: string }
interface Project { name: string; technologies: string; role: string; duration: string; teamSize: string; link: string; description: string }
interface Certificate { name: string; issuer: string; date: string; link: string }
interface Language { language: string; level: string }

const STEPS = ['Kişisel Bilgiler', 'Deneyim & Eğitim', 'Yetenekler & Projeler', 'Sertifikalar & Diller'];

export default function ProfilePage({ mode = 'profile' }: { mode?: 'profile' | 'cv' }) {
  useAuthGuard('USER');
  const pathname = usePathname();
  const isCvBuilder = mode === 'cv' || pathname === '/cv-builder';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Adım 1 validasyonu
  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'İsim - Soyisim zorunludur.';
    if (!careerGoal) errs.careerGoal = 'Kariyer hedefi seçiniz.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Geçerli bir e-posta giriniz.';
    if (phone && !/^[0-9\s\-\+\(\)]{7,15}$/.test(phone)) errs.phone = 'Geçerli bir telefon numarası giriniz.';
    if (linkedin && !/^https?:\/\/.+/.test(linkedin)) errs.linkedin = 'URL http:// veya https:// ile başlamalıdır.';
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Adım 2 validasyonu
  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    educations.forEach((edu, i) => {
      if (edu.school && !edu.department) errs[`edu_${i}_dept`] = `${i + 1}. eğitimde bölüm giriniz.`;
    });
    experiences.forEach((exp, i) => {
      if (exp.company && !exp.position) errs[`exp_${i}_pos`] = `${i + 1}. deneyimde pozisyon giriniz.`;
    });
    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToStep(n: number) {
    if (n > step) {
      if (step === 1 && !validateStep1()) return;
      if (step === 2 && !validateStep2()) return;
    }
    setStepErrors({});
    setStep(n);
  }

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([{ company: '', position: '', startDate: '', endDate: '', currentJob: false, description: '' }]);
  const [educations, setEducations] = useState<Education[]>([{ school: '', department: '', degree: '', startYear: '', graduationYear: '' }]);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('Orta');
  const addSkill = (skillName: string) => {
    const clean = skillName.trim();
    if (clean) {
      const cleanSkillNames = skills.map(s => s.split(':')[0]);
      if (!cleanSkillNames.includes(clean)) {
        setSkills(p => [...p, `${clean}:${skillLevel}`]);
      }
    }
  };
  const [projects, setProjects] = useState<Project[]>([{ name: '', technologies: '', role: '', duration: '', teamSize: '', link: '', description: '' }]);
  const [certificates, setCertificates] = useState<Certificate[]>([{ name: '', issuer: '', date: '', link: '' }]);
  const [languages, setLanguages] = useState<Language[]>([{ language: '', level: 'B2' }]);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (!p) return;
          setFullName(p.fullName || ''); setEmail(p.email || ''); setPhone(p.phone || '');
          setBirthDate(p.birthDate || ''); setCity(p.city || ''); setLinkedin(p.linkedin || '');
          setCareerGoal(p.careerGoal || '');
          if (p.experiences?.length) setExperiences(p.experiences);
          if (p.educations?.length) setEducations(p.educations);
          if (p.skills?.length) setSkills(p.skills.filter((s: string) => s && s.trim() !== ''));
          if (p.projects?.length) setProjects(p.projects);
          if (p.certificates?.length) setCertificates(p.certificates);
          if (p.languages?.length) setLanguages(p.languages);
        }).catch(() => {});
    }  }, []);

  async function save() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    const body = { fullName, email, phone, birthDate, city, linkedin, careerGoal, experiences, educations, skills, projects, certificates, languages };
    try {
      const endpoint = isCvBuilder ? `${API_URL}/api/profile/cv-builder` : `${API_URL}/api/profile`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) {
        localStorage.setItem('userProfile', JSON.stringify(body));
        // Onboarding akışından geliyorsa oraya geri dön
        const fromOnboarding = localStorage.getItem('onboardingStep') === 'profile';
        if (fromOnboarding) {
          localStorage.setItem('onboardingStep', 'cv');
          window.location.href = '/onboarding';
        } else {
          setMsg(isCvBuilder ? 'CV başarıyla oluşturuldu ve kaydedildi!' : 'Profil başarıyla kaydedildi!');
          setTimeout(() => window.location.href = isCvBuilder ? '/profile/view' : '/profile/view', 1500);
        }
      }
      else { setMsg('Kayıt sırasında hata oluştu.'); }
    } catch { setMsg('Sunucuya bağlanılamadı.'); }
    setLoading(false);
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/profil.css" />
      {isCvBuilder && <link rel="stylesheet" href="/styles/cv-builder.css" />}
      <UserSidebar />
      <div className={`main-content${isCvBuilder ? ' cv-builder-page' : ''}`}>
        <TopHeader />

        <h1 className="page-title">{isCvBuilder ? 'CV OLUŞTUR' : 'PROFİL DÜZENLE'}</h1>

        <div className="content-container">
          {!isCvBuilder && (
            <div className="stepper">
              {STEPS.map((label, i) => (
                <div key={i}>
                  <div className={`step${step > i ? ' active' : ''}`} onClick={() => goToStep(i + 1)}>
                    <div className="step-number">{i + 1}</div>
                    <div className="step-label">{label}</div>
                  </div>
                  {i < STEPS.length - 1 && <div className="step-line"></div>}
                </div>
              ))}
            </div>
          )}

          {/* Form */}
          <div className="form-container">
            {isCvBuilder && (
              <div className="cv-builder-progress" aria-live="polite">
                <span>ADIM {step} / {STEPS.length}</span>
                <strong>{STEPS[step - 1]}</strong>
                <div className="cv-builder-progress-track">
                  <span style={{ width: `${(step / STEPS.length) * 100}%` }}></span>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="form-step">
                <h2 className="section-title"><i className="fa-solid fa-user"></i> Kişisel Bilgiler</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label>İsim - Soyisim <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ad Soyad"
                      style={{ borderColor: stepErrors.fullName ? '#ef4444' : undefined }} />
                    {stepErrors.fullName && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-circle-exclamation"></i>{stepErrors.fullName}</p>}
                  </div>
                  <div className="form-group">
                    <label>E-posta <i className="fa-solid fa-envelope"></i></label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
                      style={{ borderColor: stepErrors.email ? '#ef4444' : undefined }} />
                    {stepErrors.email && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-circle-exclamation"></i>{stepErrors.email}</p>}
                  </div>
                  <div className="form-group">
                    <label>Telefon <i className="fa-solid fa-phone"></i></label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XXXXXXXXX"
                      style={{ borderColor: stepErrors.phone ? '#ef4444' : undefined }} />
                    {stepErrors.phone && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-circle-exclamation"></i>{stepErrors.phone}</p>}
                  </div>
                  <div className="form-group">
                    <label>Doğum Tarihi <i className="fa-regular fa-calendar"></i></label>
                    <input type="text" value={birthDate} onChange={e => setBirthDate(e.target.value)} placeholder="GG/AA/YYYY" />
                  </div>
                  <div className="form-group">
                    <label>Şehir</label>
                    <select value={city} onChange={e => setCity(e.target.value)}>
                      <option value="">Şehir seçiniz..</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row single">
                  <div className="form-group full-width">
                    <label>LinkedIn / Portfolyo <i className="fa-brands fa-linkedin"></i></label>
                    <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..."
                      style={{ borderColor: stepErrors.linkedin ? '#ef4444' : undefined }} />
                    {stepErrors.linkedin && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-circle-exclamation"></i>{stepErrors.linkedin}</p>}
                  </div>
                </div>
                <div className="form-row single">
                  <div className="form-group full-width">
                    <label>Kariyer Hedefi / Başvurulan Pozisyon <span style={{ color: '#ef4444' }}>*</span></label>
                    {/* Doğal dil girişi */}
                    <CareerGoalInput
                      value={careerGoal}
                      onChange={setCareerGoal}
                      hasError={!!stepErrors.careerGoal}
                    />
                    {stepErrors.careerGoal && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><i className="fa-solid fa-circle-exclamation"></i>{stepErrors.careerGoal}</p>}
                  </div>
                </div>
                <div className="form-navigation">
                  <span></span>
                  <button className="btn-next" onClick={() => goToStep(2)}>İleri <i className="fa-solid fa-arrow-right"></i></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-step">
                <h2 className="section-title"><i className="fa-solid fa-graduation-cap"></i> Eğitim Bilgileri</h2>
                {educations.map((edu, i) => (
                  <div key={i} className="education-item">
                    <div className="form-row">
                      <div className="form-group"><label>Okul Adı</label><input value={edu.school} onChange={e => { const a = [...educations]; a[i].school = e.target.value; setEducations(a); }} placeholder="Üniversite adı" /></div>
                      <div className="form-group"><label>Bölüm</label><input value={edu.department} onChange={e => { const a = [...educations]; a[i].department = e.target.value; setEducations(a); }} placeholder="Bölüm" /></div>
                      <div className="form-group"><label>Eğitim Türü</label>
                        <select value={edu.degree} onChange={e => { const a = [...educations]; a[i].degree = e.target.value; setEducations(a); }}>
                          {degreeList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group"><label>Başlangıç</label><input value={edu.startYear} onChange={e => { const a = [...educations]; a[i].startYear = e.target.value; setEducations(a); }} placeholder="2020" /></div>
                      <div className="form-group"><label>Mezuniyet</label><input value={edu.graduationYear} onChange={e => { const a = [...educations]; a[i].graduationYear = e.target.value; setEducations(a); }} placeholder="2024" /></div>
                    </div>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setEducations(p => [...p, { school: '', department: '', degree: '', startYear: '', graduationYear: '' }])}><i className="fa-solid fa-plus"></i> Eğitim Ekle</button>

                <h2 className="section-title" style={{ marginTop: 30 }}><i className="fa-solid fa-briefcase"></i> İş Deneyimi</h2>
                {experiences.map((exp, i) => (
                  <div key={i} className="experience-item">
                    <div className="form-row">
                      <div className="form-group"><label>Şirket Adı</label><input value={exp.company} onChange={e => { const a = [...experiences]; a[i].company = e.target.value; setExperiences(a); }} placeholder="Şirket" /></div>
                      <div className="form-group"><label>Pozisyon</label><input value={exp.position} onChange={e => { const a = [...experiences]; a[i].position = e.target.value; setExperiences(a); }} placeholder="Pozisyon" /></div>
                      <div className="form-group"><label>Başlangıç</label><input value={exp.startDate} onChange={e => { const a = [...experiences]; a[i].startDate = e.target.value; setExperiences(a); }} placeholder="2022" /></div>
                      <div className="form-group"><label>Bitiş</label><input value={exp.endDate} onChange={e => { const a = [...experiences]; a[i].endDate = e.target.value; setExperiences(a); }} placeholder="2024" disabled={exp.currentJob} /></div>
                    </div>
                    <label className="checkbox-label"><input type="checkbox" checked={exp.currentJob} onChange={e => { const a = [...experiences]; a[i].currentJob = e.target.checked; setExperiences(a); }} /> Hâlâ çalışıyorum</label>
                    <div className="form-row single" style={{ marginTop: 10 }}>
                      <div className="form-group full-width"><label>İş Tanımı</label><textarea rows={3} value={exp.description} onChange={e => { const a = [...experiences]; a[i].description = e.target.value; setExperiences(a); }}></textarea></div>
                    </div>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setExperiences(p => [...p, { company: '', position: '', startDate: '', endDate: '', currentJob: false, description: '' }])}><i className="fa-solid fa-plus"></i> Deneyim Ekle</button>
                <div className="form-navigation"><button className="btn-prev" onClick={() => goToStep(1)}><i className="fa-solid fa-arrow-left"></i> Geri</button><button className="btn-next" onClick={() => goToStep(3)}>İleri <i className="fa-solid fa-arrow-right"></i></button></div>
              </div>
            )}

            {step === 3 && (
              <div className="form-step">
                <h2 className="section-title"><i className="fa-solid fa-code"></i> Yetenekler</h2>
                <div className="form-row single" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <select onChange={e => { if (e.target.value) { addSkill(e.target.value); (e.target as HTMLSelectElement).value = ''; } }} style={{ width: '100%' }}>
                      <option value="">Listeden yetenek seç...</option>
                      {skillsList.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: '1 1 200px', display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Veya elle yeni yetenek yazın..."
                      value={customSkill}
                      onChange={e => setCustomSkill(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 120px' }}>
                    <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} style={{ width: '100%' }}>
                      <option value="Başlangıç">Başlangıç</option>
                      <option value="Orta">Orta</option>
                      <option value="İleri">İleri</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => { addSkill(customSkill); setCustomSkill(''); }}
                    style={{ background: '#1a4fba', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Ekle
                  </button>
                </div>
                <div className="skills-tags" style={{ marginTop: 15, marginBottom: 20 }}>
                  {skills.map((s, i) => {
                    const parts = s.split(':');
                    const name = parts[0];
                    const lvl = parts[1] || 'Orta';
                    return (
                      <span key={`${s}-${i}`} className="skill-tag">
                        {name} ({lvl}){' '}
                        <i className="fa-solid fa-xmark" style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setSkills(p => p.filter(x => x !== s))}></i>
                      </span>
                    );
                  })}
                </div>

                <h2 className="section-title" style={{ marginTop: 30 }}><i className="fa-solid fa-folder-open"></i> Projeler</h2>
                {projects.map((proj, i) => (
                  <div key={i} className="project-item">
                    <div className="form-row">
                      <div className="form-group"><label>Proje Adı</label><input value={proj.name} onChange={e => { const a = [...projects]; a[i].name = e.target.value; setProjects(a); }} placeholder="Proje adı" /></div>
                      <div className="form-group"><label>Teknolojiler</label><input value={proj.technologies} onChange={e => { const a = [...projects]; a[i].technologies = e.target.value; setProjects(a); }} placeholder="React, Node.js..." /></div>
                      <div className="form-group"><label>Rol</label><input value={proj.role} onChange={e => { const a = [...projects]; a[i].role = e.target.value; setProjects(a); }} placeholder="Proje Yöneticisi" /></div>
                    </div>
                    <div className="form-row single" style={{ marginTop: 10 }}>
                      <div className="form-group full-width"><label>Proje Linki</label><input value={proj.link} onChange={e => { const a = [...projects]; a[i].link = e.target.value; setProjects(a); }} placeholder="github.com/..." /></div>
                    </div>
                    <div className="form-row single" style={{ marginTop: 10 }}>
                      <div className="form-group full-width"><label>Açıklama</label><textarea rows={3} value={proj.description} onChange={e => { const a = [...projects]; a[i].description = e.target.value; setProjects(a); }}></textarea></div>
                    </div>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setProjects(p => [...p, { name: '', technologies: '', role: '', duration: '', teamSize: '', link: '', description: '' }])}><i className="fa-solid fa-plus"></i> Proje Ekle</button>
                <div className="form-navigation"><button className="btn-prev" onClick={() => goToStep(2)}><i className="fa-solid fa-arrow-left"></i> Geri</button><button className="btn-next" onClick={() => goToStep(4)}>İleri <i className="fa-solid fa-arrow-right"></i></button></div>
              </div>
            )}

            {step === 4 && (
              <div className="form-step">
                <h2 className="section-title"><i className="fa-solid fa-certificate"></i> Sertifikalar</h2>
                {certificates.map((cert, i) => (
                  <div key={i} className="certificate-item">
                    <div className="form-row">
                      <div className="form-group"><label>Sertifika Adı</label><input value={cert.name} onChange={e => { const a = [...certificates]; a[i].name = e.target.value; setCertificates(a); }} placeholder="Sertifika adı" /></div>
                      <div className="form-group"><label>Veren Kurum</label><input value={cert.issuer} onChange={e => { const a = [...certificates]; a[i].issuer = e.target.value; setCertificates(a); }} placeholder="Microsoft, Google..." /></div>
                      <div className="form-group"><label>Alınan Tarih</label><input value={cert.date} onChange={e => { const a = [...certificates]; a[i].date = e.target.value; setCertificates(a); }} placeholder="GG/AA/YYYY" /></div>
                      <div className="form-group"><label>Sertifika Linki / ID</label><input value={cert.link} onChange={e => { const a = [...certificates]; a[i].link = e.target.value; setCertificates(a); }} placeholder="coursera.org/verify/..." /></div>
                    </div>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setCertificates(p => [...p, { name: '', issuer: '', date: '', link: '' }])}><i className="fa-solid fa-plus"></i> Sertifika Ekle</button>

                <h2 className="section-title" style={{ marginTop: 30 }}><i className="fa-solid fa-language"></i> Diller</h2>
                {languages.map((lang, i) => (
                  <div key={i} className="language-item">
                    <select value={lang.language} onChange={e => { const a = [...languages]; a[i].language = e.target.value; setLanguages(a); }}>
                      <option value="">Dil seçiniz</option>
                      {languagesList.map(language => <option key={language} value={language}>{language}</option>)}
                    </select>
                    <select value={lang.level} onChange={e => { const a = [...languages]; a[i].level = e.target.value; setLanguages(a); }}>
                      {languageLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <button className="btn-add" onClick={() => setLanguages(p => [...p, { language: '', level: 'B2' }])}><i className="fa-solid fa-plus"></i> Dil Ekle</button>

                {msg && <div style={{ textAlign: 'center', marginTop: 15, color: msg.includes('başarı') ? 'green' : 'red', fontWeight: 600 }}>{msg}</div>}
                <div className="form-navigation">
                  <button className="btn-prev" onClick={() => goToStep(3)}><i className="fa-solid fa-arrow-left"></i> Geri</button>
                  <button className="btn-next" onClick={save} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet ve Bitir'}</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
