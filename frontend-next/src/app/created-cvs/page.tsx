'use client';

import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import TopHeader from '@/components/TopHeader';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type CvDocument = { id: number; type: string; fileName: string; status: string; createdAt: string };
type CvProfile = {
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  careerGoal?: string;
  skills?: string[];
  experiences?: Array<Record<string, string | boolean>>;
  educations?: Array<Record<string, string>>;
  projects?: Array<Record<string, string>>;
  certificates?: Array<Record<string, string>>;
  languages?: Array<Record<string, string>>;
};

function DataSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="created-cv-section">
      <h2><i className={`fa-solid ${icon}`} /> {title}</h2>
      {children}
    </section>
  );
}

function Value({ value }: { value?: string | boolean }) {
  return <>{value ? String(value) : '-'}</>;
}

export default function CreatedCvsPage() {
  useAuthGuard('USER');
  const [profile, setProfile] = useState<CvProfile>({});
  const [documents, setDocuments] = useState<CvDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_URL}/api/profile/me`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : {}),
      fetch(`${API_URL}/api/documents/me`, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.ok ? res.json() : []),
    ]).then(([profileData, documentData]) => {
      setProfile(profileData || {});
      setDocuments((documentData || []).filter((doc: CvDocument) => doc.type === 'CV_FORM'));
    }).finally(() => setLoading(false));
  }, []);

  const latestDocument = documents[0];
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('tr-TR') : '-';

  return (
    <>
      <link rel="stylesheet" href="/styles/created-cvs.css" />
      <UserSidebar />
      <div className="main-content created-cvs-page">
        <TopHeader />
        <div className="created-cvs-shell">
          <div className="created-cvs-heading">
            <div>
              <span className="created-cvs-eyebrow"><i className="fa-solid fa-file-circle-check" /> Kişisel CV arşivin</span>
              <h1>Oluşturulan CV&apos;ler</h1>
              <p>CV oluşturma formunda kaydettiğin bilgileri buradan görüntüleyebilirsin.</p>
            </div>
            <a className="created-cvs-create" href="/cv-builder"><i className="fa-solid fa-file-pen" /> CV&apos;yi Güncelle</a>
          </div>

          {loading ? <div className="created-cvs-empty">CV bilgilerin yükleniyor...</div> : !latestDocument ? (
            <div className="created-cvs-empty">
              <i className="fa-solid fa-file-circle-plus" />
              <h2>Henüz oluşturulmuş CV yok</h2>
              <p>Profesyonel CV bilgilerini tamamlamak için CV oluşturma formunu başlat.</p>
              <a href="/cv-builder">CV Oluşturmaya Başla <i className="fa-solid fa-arrow-right" /></a>
            </div>
          ) : (
            <div className="created-cv-document">
              <div className="created-cv-meta">
                <div><span>Son güncelleme</span><strong>{formatDate(latestDocument.createdAt)}</strong></div>
                <div><span>Durum</span><strong className={`status-${latestDocument.status}`}>{latestDocument.status === 'approved' ? 'Onaylandı' : latestDocument.status === 'rejected' ? 'Revizyon gerekli' : 'İncelemede'}</strong></div>
                <div><span>Belge türü</span><strong>Form CV</strong></div>
              </div>

              <DataSection title="Kişisel Bilgiler" icon="fa-user">
                <div className="created-cv-grid">
                  <div><span>Ad Soyad</span><strong><Value value={profile.fullName} /></strong></div>
                  <div><span>E-posta</span><strong><Value value={profile.email} /></strong></div>
                  <div><span>Telefon</span><strong><Value value={profile.phone} /></strong></div>
                  <div><span>Şehir</span><strong><Value value={profile.city} /></strong></div>
                  <div className="created-cv-wide"><span>LinkedIn / Portfolyo</span><strong><Value value={profile.linkedin} /></strong></div>
                  <div className="created-cv-wide"><span>Kariyer hedefi</span><strong><Value value={profile.careerGoal} /></strong></div>
                </div>
              </DataSection>

              <DataSection title="Yetenekler" icon="fa-code">
                <div className="created-cv-tags">{profile.skills?.length ? profile.skills.map((skill) => <span key={skill}>{skill}</span>) : <em>Yetenek eklenmemiş.</em>}</div>
              </DataSection>

              <DataSection title="Eğitim" icon="fa-graduation-cap">
                {profile.educations?.length ? profile.educations.map((education, index) => <div className="created-cv-item" key={index}><strong><Value value={education.school} /></strong><span><Value value={education.department} /> · <Value value={education.degree} /></span><small><Value value={education.startYear} /> - <Value value={education.graduationYear} /></small></div>) : <em>Eğitim bilgisi eklenmemiş.</em>}
              </DataSection>

              <DataSection title="İş Deneyimi" icon="fa-briefcase">
                {profile.experiences?.length ? profile.experiences.map((experience, index) => <div className="created-cv-item" key={index}><strong><Value value={experience.position} /></strong><span><Value value={experience.company} /> · <Value value={experience.startDate} /> - {experience.currentJob ? 'Devam ediyor' : <Value value={experience.endDate} />}</span><p><Value value={experience.description} /></p></div>) : <em>İş deneyimi eklenmemiş.</em>}
              </DataSection>

              <DataSection title="Projeler" icon="fa-folder-open">
                {profile.projects?.length ? profile.projects.map((project, index) => <div className="created-cv-item" key={index}><strong><Value value={project.name} /></strong><span><Value value={project.role} /> · <Value value={project.technologies} /></span><p><Value value={project.description} /></p></div>) : <em>Proje eklenmemiş.</em>}
              </DataSection>

              <div className="created-cv-columns">
                <DataSection title="Sertifikalar" icon="fa-certificate">
                  {profile.certificates?.length ? profile.certificates.map((certificate, index) => <div className="created-cv-compact-item" key={index}><strong><Value value={certificate.name} /></strong><span><Value value={certificate.issuer} /> · <Value value={certificate.date} /></span></div>) : <em>Sertifika eklenmemiş.</em>}
                </DataSection>
                <DataSection title="Diller" icon="fa-language">
                  {profile.languages?.length ? profile.languages.map((language, index) => <div className="created-cv-compact-item" key={index}><strong><Value value={language.language} /></strong><span>Seviye: <Value value={language.level} /></span></div>) : <em>Dil eklenmemiş.</em>}
                </DataSection>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
