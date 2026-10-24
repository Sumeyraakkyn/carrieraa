'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const questions = [
  { id: 1, question: "Büyük bir projede beklenmedik bir sorun çıktığında ilk tepkin ne olur?", options: [{ value: "A", text: "Hemen ekibi toplar ve çözüm stratejisi geliştiririm.", score: "10" }, { value: "B", text: "Sorunu analiz eder, en mantıklı çözümü tek başıma bulmaya çalışırım.", score: "5" }, { value: "C", text: "Durumu üstlerime bildirir ve yönergelerini beklerim.", score: "2" }] },
  { id: 2, question: "Ekip içindeki bir tartışmada nasıl bir yol izlersin?", options: [{ value: "A", text: "Herkesi dinler, ortak bir zemin bulup uzlaşma sağlarım.", score: "10" }, { value: "B", text: "Haklı olan tarafı verilerle destekler, mantıklı olanı seçerim.", score: "5" }, { value: "C", text: "Tartışmadan uzak durur, kendi işime odaklanırım.", score: "2" }] },
  { id: 3, question: "Yeni ve zor bir görev aldığında tutumun ne olur?", options: [{ value: "A", text: "Bunu bir gelişim fırsatı olarak görür, heyecanla kabul ederim.", score: "10" }, { value: "B", text: "Önce riskleri değerlendirir, yapabileceğime inanırsam kabul ederim.", score: "5" }, { value: "C", text: "Daha önce yapmadığım için çekinir, başkasına devretmeyi tercih ederim.", score: "2" }] },
  { id: 4, question: "Zaman daraldığında ve işler yetişmediğinde ne yaparsın?", options: [{ value: "A", text: "Görevleri önceliklendirir, ekiple iş bölümü yaparak hızlanırım.", score: "10" }, { value: "B", text: "Mesaiye kalır, işi tek başıma bitirmeye odaklanırım.", score: "5" }, { value: "C", text: "Paniklerim ve işin kalitesinden ödün vermek zorunda kalırım.", score: "2" }] },
  { id: 5, question: "Geri bildirim (eleştiri) aldığında nasıl tepki verirsin?", options: [{ value: "A", text: "Teşekkür eder, kendimi geliştirmek için notlar alırım.", score: "10" }, { value: "B", text: "Sadece haklı bulduğum eleştirileri dikkate alırım.", score: "5" }, { value: "C", text: "Savunmaya geçer ve eleştiriyi kişisel algılarım.", score: "2" }] },
  { id: 6, question: "Şirketin yeni bir yazılım/sistem kullanmaya başlayacağını öğrendiğinde ne yaparsın?", options: [{ value: "A", text: "Hemen araştırmaya başlar, ekibe de öğrenme sürecinde öncülük ederim.", score: "10" }, { value: "B", text: "Eğitim verilmesini bekler, verildiğinde öğrenirim.", score: "5" }, { value: "C", text: "Eski sistemin daha iyi olduğunu düşünür, değişime direnirim.", score: "2" }] },
  { id: 7, question: "Bir iş arkadaşın sürekli olarak düşük performans gösteriyorsa ne yaparsın?", options: [{ value: "A", text: "Onunla özel olarak konuşur, nerede zorlandığını sorar ve yardım teklif ederim.", score: "10" }, { value: "B", text: "Durumu yöneticime bildiririm.", score: "5" }, { value: "C", text: "Benim sorunum değil diyerek görmezden gelirim.", score: "2" }] },
  { id: 8, question: "Uzun vadeli bir hedefe ulaşmak için nasıl plan yaparsın?", options: [{ value: "A", text: "Hedefi küçük, ölçülebilir kilometre taşlarına böler ve düzenli takip ederim.", score: "10" }, { value: "B", text: "Genel bir plan yapıp, duruma göre esnek ilerlerim.", score: "5" }, { value: "C", text: "Çok detaylı plan yapmam, akışına bırakırım.", score: "2" }] },
  { id: 9, question: "Müşteriden/Yöneticiden çok acil ve zor bir talep geldiğinde ilk adımın ne olur?", options: [{ value: "A", text: "Talebi netleştirmek için doğru soruları sorar, hızlıca aksiyon planı çıkarırım.", score: "10" }, { value: "B", text: "Kendi yöntemlerimle hemen çözmeye çalışırım.", score: "5" }, { value: "C", text: "Talebin çok zor olduğunu belirterek ek süre isterim.", score: "2" }] },
  { id: 10, question: "Başarısızlıkla sonuçlanan bir işin ardından ne hissedersin?", options: [{ value: "A", text: "Hatalarımı analiz eder ve bir dahaki sefere neyi farklı yapacağımı belirlerim.", score: "10" }, { value: "B", text: "Üzülürüm ama kısa sürede toparlanmaya çalışırım.", score: "5" }, { value: "C", text: "Motivasyonum çok düşer, uzun süre etkisinden çıkamam.", score: "2" }] },
  { id: 11, question: "Ekip içinde yeni bir fikir ortaya atıldığında yaklaşımın nedir?", options: [{ value: "A", text: "Fikri destekler ve nasıl daha iyi hale getirebileceğimizi tartışırım.", score: "10" }, { value: "B", text: "Fikrin sadece mantıklı olan kısımlarını kabul ederim.", score: "5" }, { value: "C", text: "Geleneksel yöntemlerin daha güvenli olduğunu savunurum.", score: "2" }] },
  { id: 12, question: "Kendini en çok hangi rolde başarılı hissedersin?", options: [{ value: "A", text: "İnsanları yönlendiren, motive eden ve strateji kuran rolde.", score: "10" }, { value: "B", text: "Verileri analiz eden ve teknik/mantıksal çözümler üreten rolde.", score: "5" }, { value: "C", text: "Verilen görevleri eksiksiz ve zamanında yerine getiren rolde.", score: "2" }] }
];

export default function PotentialPage() {
  useAuthGuard('USER');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(12).fill(null));
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [warningTarget, setWarningTarget] = useState(0);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    
    setUsername(localStorage.getItem('currentUser') || '');  }, []);

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'true' : 'false');
  }

  function selectOption(qIndex: number, oIndex: number) {
    const a = [...answers];
    a[qIndex] = oIndex;
    setAnswers(a);
    if (qIndex < 11) {
      setTimeout(() => setCurrentQ(qIndex + 1), 300);
    }
  }

  async function finishTest() {
    const isComplete = answers.every(a => a !== null);
    if (!isComplete) {
      const firstUnanswered = answers.findIndex(a => a === null);
      setWarningMsg(`Lütfen ${firstUnanswered + 1}. soruyu cevaplayınız.`);
      setWarningTarget(firstUnanswered);
      setShowWarning(true);
      return;
    }

    let liderlik = 0, iletisim = 0, analitik = 0;
    answers.forEach((ans, i) => {
      const val = parseInt(questions[i].options[ans as number].score);
      if (i < 4) liderlik += val;
      else if (i < 8) iletisim += val;
      else analitik += val;
    });

    const results = { liderlik, iletisim, analitik };

    // Sonuç ekranı cevapların hangi seçeneklerden oluştuğuna göre
    // yetkinlik dağılımını hesaplar. Cevapları saklamazsak sonuç ekranı
    // tüm soruları ilk seçenekmiş gibi değerlendirir.
    localStorage.setItem('potentialAnswers', JSON.stringify(answers));
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${API_URL}/api/profile/potential-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ scores: results })
        });
      } catch (err) {
        console.error('Failed to save results', err);
      }
    }

    localStorage.setItem('potentialResults', JSON.stringify(results));
    window.location.href = '/skills/result';
  }

  return (
    <>
      <link rel="stylesheet" href="/styles/potansiyel.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="page-content">
          <div className="welcome-section">
            <h1 className="welcome-text">Hoş geldin, <span className="highlight-name">{username}</span>!</h1>
            <p className="subtitle">Liderlik, iletişim ve analitik becerilerini keşfetmek için test sorularını yanıtla.</p>
          </div>
          <div className="progress-bar-container">
            <div className="progress-track">
              {questions.map((_, i) => (
                <span key={i} className="dot-wrapper">
                  <div className={`dot${i === currentQ ? ' active' : ''}${answers[i] !== null ? ' answered' : ''}`} onClick={() => setCurrentQ(i)} title={`Soru ${i + 1}`}></div>
                  {i < 11 && <div className={`dot-line${i < currentQ ? ' completed' : ''}`}></div>}
                </span>
              ))}
            </div>
            <div className="progress-text"><span>{currentQ + 1}</span>/12 Soru</div>
          </div>
          <div className="quiz-container">
            <div className="question-slide">
              <div className="question-box"><p>{questions[currentQ].id}- {questions[currentQ].question}</p></div>
              <div className="options-container">
                {questions[currentQ].options.map((opt, i) => (
                  <div key={i} className={`option-btn${answers[currentQ] === i ? ' selected' : ''}`} onClick={() => selectOption(currentQ, i)}>
                    {opt.value}) {opt.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="nav-buttons">
            <button className="btn-nav btn-prev" style={{ visibility: currentQ === 0 ? 'hidden' : 'visible' }} onClick={() => setCurrentQ(q => Math.max(0, q - 1))}>
              <i className="fa-solid fa-arrow-left"></i> Önceki Soru
            </button>
            {currentQ < 11 ? (
              <button
                className="btn-nav btn-next"
                onClick={() => setCurrentQ(q => Math.min(11, q + 1))}
                disabled={answers[currentQ] === null}
                aria-disabled={answers[currentQ] === null}
                title={answers[currentQ] === null ? 'Devam etmek için bir yanıt seçiniz.' : undefined}
              >
                Sonraki Soru <i className="fa-solid fa-arrow-right"></i>
              </button>
            ) : null}
          </div>
          {currentQ === 11 && (
            <button className="btn-finish" onClick={finishTest}>
              <i className="fa-solid fa-chart-pie"></i> Testi Bitir ve Analizi Gör
            </button>
          )}
          <button className="btn-clear" onClick={() => { const a = [...answers]; a[currentQ] = null; setAnswers(a); }}>Yanıtımı Sil</button>
        </div>
        {showWarning && (
          <div className="warning-modal-overlay" style={{ display: 'flex' }}>
            <div className="warning-modal">
              <div className="warning-icon"><i className="fa-solid fa-exclamation-triangle"></i></div>
              <h3>Eksik Cevap!</h3>
              <p>{warningMsg}</p>
              <button className="warning-btn" onClick={() => { setCurrentQ(warningTarget); setShowWarning(false); }}><i className="fa-solid fa-arrow-right"></i> Soruya Git</button>
              <button className="warning-close-btn" onClick={() => setShowWarning(false)}>Kapat</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
