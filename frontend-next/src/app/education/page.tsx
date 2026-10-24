'use client';
import { useEffect, useState } from 'react';
import UserSidebar from '@/components/UserSidebar';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import TopHeader from '@/components/TopHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Question { question: string; options: string[]; answer: number; }
interface CoursePage { title: string; content: string; }
interface Course { id: string; title: string; duration: string; rating: string; instructor: string; description: string; icon: string; color: string; content: string; pages?: CoursePage[]; questions: Question[]; }

const courseData: Record<string, { name: string; courses: Course[] }> = {
  liderlik: {
    name: 'Liderlik Gelişimi',
    courses: [
      { 
        id: 'liderlik-1', title: 'Modern Liderlik & Çatışma Yönetimi', duration: '4 Modül (1.5 saat)', rating: '4.7', instructor: 'Mehmet Dönmez', description: 'Ekibinizi motive etme ve zorlu durumları çözme becerileri.', icon: 'fa-people-group', color: '#4dd0e1',
        content: 'Modern liderlik, ekipleri kontrol etmekten ziyade onlara vizyon kazandırmak ve rehberlik etmektir. Çatışma yönetimi ise farklı fikirlerin yıkıcı değil yapıcı bir sinerjiye dönüştürülmesi sürecidir. Bir lider, eleştirileri dinlemeli ve çözüm odaklı yaklaşmalıdır.',
        pages: [
          { title: 'Bölüm 1: Modern Liderlik Nedir?', content: 'Modern liderlik, 21. yüzyılın dinamik iş dünyasında ekipleri kontrol etmekten ziyade onlara vizyon kazandırmak ve rehberlik etmektir. Geleneksel "komuta ve kontrol" anlayışının yerini "ilham ver ve güçlendir" yaklaşımı almıştır. Bir lider artık en iyi teknik uzman olmak zorunda değildir; asıl görevi doğru insanları bir araya getirmek, onlara net bir yön göstermek ve önlerindeki engelleri kaldırmaktır. Araştırmalar, çalışanların %70\'inin işten ayrılma kararını doğrudan yöneticileri nedeniyle verdiğini ortaya koymaktadır. Bu istatistik, liderlik kalitesinin kurumsal başarı için ne denli kritik olduğunu açıkça göstermektedir.' },
          { title: 'Bölüm 2: Çatışma Yönetimi', content: 'Çatışma, farklı bakış açılarına sahip insanların bir arada çalıştığı her ortamda kaçınılmazdır. Önemli olan çatışmayı yok saymak değil, onu yapıcı bir güce dönüştürmektir. Thomas-Kilmann modelinde beş çatışma yönetimi stili tanımlanmıştır: Rekabetçi (kendi çıkarını ön planda tutar), İşbirlikçi (her iki tarafın da kazandığı çözüm arar), Uzlaşmacı (orta yol bulur), Kaçınmacı (çatışmadan uzak durur) ve Uyumcu (karşı tarafın isteklerine boyun eğer). Etkili liderler duruma göre bu stilleri esnek biçimde kullanabilir; ancak uzun vadede işbirlikçi yaklaşım en sürdürülebilir sonuçları üretir.' },
          { title: 'Bölüm 3: Liderlik Stilleri', content: 'Daniel Goleman\'ın araştırmaları altı temel liderlik stilini ortaya koymuştur: Vizyoner (uzun vadeli yön gösterir), Koçluk yapan (bireysel gelişimi destekler), Uyumcu (duygusal bağ kurar), Demokratik (katılımı teşvik eder), Hız belirleyen (yüksek standartlar koyar) ve Otoriter (kriz anında hızlı karar alır). En etkili liderler tek bir stile bağlı kalmaz; ekibin ihtiyacına ve durumun gerekliliklerine göre bu stilleri harmanlayarak kullanır. Özellikle kriz dönemlerinde otoriter, gelişim süreçlerinde ise koçluk yapan stil ön plana çıkmalıdır.' },
          { title: 'Bölüm 4: Güven İnşası ve Psikolojik Güvenlik', content: 'Google\'ın yürüttüğü "Project Aristotle" araştırması, yüksek performanslı ekiplerin en belirgin özelliğinin teknik yetkinlik değil, psikolojik güvenlik olduğunu ortaya koymuştur. Psikolojik güvenlik; ekip üyelerinin fikir önerebileceği, hata yapabileceği ve soru sorabileceği, bunun için yargılanmayacağını hissettiği bir ortamdır. Lider bu ortamı yaratmak için önce kendisi savunmasız olmayı göze almalı, hatalarını kabul etmeli ve merakı ödüllendirmelidir. Güven inşası zaman alır ancak bir kez kırıldığında yeniden kazanılması çok daha uzun sürer.' },
        ],
        questions: [
          { question: "Modern liderliğin temel amacı nedir?", options: ["Sadece emir vermek", "Ekibe vizyon kazandırmak ve rehberlik etmek", "Tüm hataları cezalandırmak", "Her işi kendisi yapmak"], answer: 1 },
          { question: "Çatışma yönetimi için en doğru yaklaşım hangisidir?", options: ["Görmezden gelmek", "Taraflardan birini kovmak", "Farklı fikirleri yapıcı sinerjiye dönüştürmek", "Konuyu anında kapatmak"], answer: 2 },
          { question: "İyi bir lider eleştirilere karşı nasıl davranmalıdır?", options: ["Dinlemeli ve çözüm odaklı yaklaşmalı", "Savunmaya geçmeli", "Eleştirenleri susturmalı", "Kişisel algılayıp küsmeli"], answer: 0 },
          { question: "Google'ın Project Aristotle araştırmasına göre yüksek performanslı ekiplerin en belirgin özelliği nedir?", options: ["Teknik yetkinlik", "Yüksek maaş", "Psikolojik güvenlik", "Uzun çalışma saatleri"], answer: 2 },
          { question: "Thomas-Kilmann modelinde uzun vadede en sürdürülebilir sonuçları hangi çatışma stili üretir?", options: ["Rekabetçi", "Kaçınmacı", "Uyumcu", "İşbirlikçi"], answer: 3 }
        ]
      },
      { 
        id: 'liderlik-2', title: 'Çevik (Agile) Dönüşüm ve Ekip Yönetimi', duration: '5 Modül (2 saat)', rating: '4.8', instructor: 'Enes Sulak', description: 'Hızlı değişime uyum, Scrum/Kanban metodolojileri ve uzaktan ekip liderliği.', icon: 'fa-video', color: '#4fc3f7',
        content: 'Çevik (Agile) yönetim, müşteri odaklılığı ve hızlı adaptasyonu merkeze alır. Geleneksel şelale metodunun aksine iteratif döngülerle (sprint) çalışır. Bu sayede riskler azalır ve değişen pazar koşullarına hızla yanıt verilir.',
        pages: [
          { title: 'Bölüm 1: Agile Manifestosu', content: 'Agile Manifesto, 2001 yılında 17 yazılım geliştirici tarafından Utah\'da imzalanmıştır. Dört temel değer üzerine inşa edilmiştir: Süreçler ve araçlar yerine bireyler ve etkileşimler; kapsamlı dokümantasyon yerine çalışan yazılım; sözleşme müzakereleri yerine müşteri işbirliği; bir plana uymak yerine değişime yanıt vermek. Bu değerler, geleneksel "şelale" (waterfall) modelinin katı ve öngörülemeyen değişikliklere kapalı yapısına bir alternatif olarak doğmuştur. Agile bugün yazılımın çok ötesine geçerek pazarlama, İK ve ürün geliştirme gibi alanlarda da yaygın biçimde uygulanmaktadır.' },
          { title: 'Bölüm 2: Scrum Framework', content: 'Scrum, Agile\'ın en yaygın kullanılan çerçevesidir. Üç temel rol içerir: Product Owner (ürün sahibi — neyin yapılacağına karar verir), Scrum Master (sürecin kolaylaştırıcısı — engelleri kaldırır) ve Development Team (geliştirme ekibi — işi yapanlar). Çalışma döngüleri "Sprint" adı verilen 1-4 haftalık periyotlara bölünür. Her Sprint başında Sprint Planning, her gün 15 dakikalık Daily Scrum, Sprint sonunda Sprint Review ve Retrospective toplantıları yapılır. Bu yapı, ekibin sürekli öğrenmesini ve iyileştirmesini sağlar.' },
          { title: 'Bölüm 3: Uzaktan Ekip Yönetimi', content: 'Pandemi sonrası dünyada uzaktan ve hibrit çalışma modelleri kalıcı hale gelmiştir. Uzaktan ekip yönetiminde en büyük zorluk güven ve iletişim boşluklarıdır. Etkili uzaktan liderler için kritik pratikler şunlardır: Asenkron iletişimi (Slack, Notion, Loom) etkin kullanmak; haftalık 1-on-1 görüşmelerle bireysel bağlantıyı korumak; çıktı odaklı değerlendirme yapmak (saate değil, sonuca bakmak); ve ekip kültürünü dijital ortamda yaşatmak için sanal sosyal etkinlikler düzenlemek. Uzaktan çalışmada "görünürlük" kaygısı çalışanları aşırı çalışmaya itebilir; lider bu dengeyi korumakla yükümlüdür.' },
        ],
        questions: [
          { question: "Çevik yönetimin merkezinde ne vardır?", options: ["Aşırı detaylı planlama", "Hızlı adaptasyon ve müşteri odaklılık", "Sadece üst yönetimin kararları", "Değişime tamamen kapalı olmak"], answer: 1 },
          { question: "Agile metodolojide döngüsel çalışma süreçlerine ne ad verilir?", options: ["Sprint", "Maraton", "Waterfall", "Timeline"], answer: 0 },
          { question: "Çevik dönüşümün en büyük avantajı nedir?", options: ["Hiç toplantı yapmamak", "Riskleri azaltıp değişime hızla yanıt vermek", "Bütçeyi sınırsız kullanmak", "Müşteri ile iletişimi kesmek"], answer: 1 },
          { question: "Scrum'da Product Owner'ın temel sorumluluğu nedir?", options: ["Kodu yazmak", "Neyin yapılacağına karar vermek", "Toplantıları iptal etmek", "Ekibi işe almak"], answer: 1 },
          { question: "Uzaktan ekip yönetiminde çıktı odaklı değerlendirme ne anlama gelir?", options: ["Çalışanın kaç saat çalıştığına bakmak", "Sonuçlara ve üretilen değere odaklanmak", "Kameradan gözetlemek", "Sadece raporlara bakmak"], answer: 1 }
        ]
      },
      { 
        id: 'liderlik-3', title: 'Etkili İletişim ve Motivasyon Teknikleri', duration: '3 Modül (1 saat)', rating: '4.6', instructor: 'Ayşe Kaya', description: 'Ekip üyeleriyle etkili iletişim kurma ve motivasyon stratejileri.', icon: 'fa-comments', color: '#4dd0e1',
        content: 'Etkili iletişim, sadece konuşmak değil, aktif dinlemeyi de içerir. Ekip motivasyonu, kişisel hedeflerle kurum hedeflerinin hizalanmasıyla sağlanır. Geribildirim (feedback) süreçleri tek yönlü değil, iki yönlü açık bir diyalog olmalıdır.',
        questions: [
          { question: "Etkili iletişim hangi unsuru mutlaka barındırmalıdır?", options: ["Sürekli konuşmayı", "Aktif dinlemeyi", "Sesini yükseltmeyi", "Söz kesmeyi"], answer: 1 },
          { question: "Ekip motivasyonu sağlamada hangi yöntem daha etkilidir?", options: ["Kişisel ve kurum hedeflerini hizalamak", "Sadece maaş artışı", "Fazla mesaiye zorlamak", "Tehdit etmek"], answer: 0 },
          { question: "Geribildirim süreci nasıl işlemelidir?", options: ["Sadece yöneticiden çalışana", "Senede bir kez kapalı zarfta", "İki yönlü açık bir diyalog şeklinde", "Sadece hatalar olunca"], answer: 2 }
        ]
      },
    ],
  },
  stratejik: {
    name: 'Stratejik Planlama',
    courses: [
      { 
        id: 'stratejik-1', title: 'Stratejik Düşünme ve Planlama', duration: '6 Modül (2.5 saat)', rating: '4.9', instructor: 'Prof. Dr. Ali Yıldız', description: 'Uzun vadeli hedefler belirleme ve stratejik yol haritası oluşturma.', icon: 'fa-chess', color: '#66BB6A',
        content: 'Stratejik planlama, organizasyonun "Neredeyiz?", "Nereye ulaşmak istiyoruz?" ve "Oraya nasıl gideriz?" sorularına cevap aradığı makro vizyon sürecidir. PESTEL ve SWOT analizleri bu aşamada kritik önem taşır.',
        pages: [
          { title: 'Bölüm 1: Stratejik Düşünmenin Temelleri', content: 'Stratejik düşünme, günlük operasyonel kaygıların ötesine geçerek büyük resmi görebilme yetisidir. Bir organizasyonun stratejik planlaması üç temel soruya cevap arar: "Neredeyiz?" (mevcut durum analizi), "Nereye ulaşmak istiyoruz?" (vizyon ve hedefler) ve "Oraya nasıl gideceğiz?" (strateji ve eylem planı). Stratejik düşünürler, kısa vadeli baskılara rağmen uzun vadeli değer yaratmaya odaklanır. Bunu başarabilmek için hem analitik hem de yaratıcı düşünme becerilerini bir arada kullanmak gerekir.' },
          { title: 'Bölüm 2: SWOT ve PESTEL Analizleri', content: 'SWOT analizi, organizasyonun iç güçlü yönlerini (Strengths), zayıf yönlerini (Weaknesses), dış fırsatlarını (Opportunities) ve tehditlerini (Threats) sistematik biçimde değerlendirir. PESTEL analizi ise makro çevreyi altı boyutta inceler: Politik, Ekonomik, Sosyal, Teknolojik, Çevresel (Environmental) ve Yasal (Legal). Bu iki araç birlikte kullanıldığında hem iç hem de dış faktörlerin kapsamlı bir haritası çıkarılmış olur. Stratejik kararlar bu analizlerin ışığında alındığında çok daha sağlam bir temele oturur.' },
          { title: 'Bölüm 3: OKR ve Hedef Belirleme', content: 'OKR (Objectives and Key Results), Google ve Intel gibi şirketlerin benimsediği hedef belirleme çerçevesidir. Objective (Hedef): İlham verici, niteliksel bir yön belirler. Key Results (Temel Sonuçlar): Hedefe ulaşıldığını ölçen 3-5 adet sayısal göstergedir. OKR\'ların en önemli özelliği şeffaflıktır; tüm çalışanlar şirketin, ekibin ve birbirlerinin hedeflerini görebilir. Bu şeffaflık hizalamayı güçlendirir ve herkesin aynı yönde kürek çekmesini sağlar. OKR\'lar genellikle üç aylık dönemlerle belirlenir ve %70 başarı oranı "iyi" kabul edilir — %100 başarı hedeflerin yeterince zorlu olmadığına işaret eder.' },
        ],
        questions: [
          { question: "Stratejik planlama hangi soruyu sormaz?", options: ["Neredeyiz?", "Oraya nasıl gideriz?", "Öğle yemeğinde ne yiyeceğiz?", "Nereye ulaşmak istiyoruz?"], answer: 2 },
          { question: "Hangi analiz stratejik planlamanın temel bir parçasıdır?", options: ["Kan Testi", "SWOT Analizi", "Trafik Analizi", "A/B Testi"], answer: 1 },
          { question: "Stratejik vizyon hangi vadeyi kapsar?", options: ["Günlük", "Saatlik", "Haftalık", "Uzun Vadeli Makro"], answer: 3 },
          { question: "OKR'da 'Key Results' ne anlama gelir?", options: ["Temel Kaynaklar", "Temel Sonuçlar (ölçülebilir göstergeler)", "Kilit Raporlar", "Kritik Riskler"], answer: 1 },
          { question: "PESTEL analizinde 'E' harfi neyi temsil eder?", options: ["Eğitim", "Ekonomik ve Çevresel faktörler", "Etik", "Ekip"], answer: 1 }
        ]
      },
      { 
        id: 'stratejik-2', title: 'Veri Odaklı Karar Verme Sanatı', duration: '3 Modül (1 saat)', rating: '4.5', instructor: 'Merve Yılmaz', description: 'Büyük veriyi anlama, temel analitik raporları yorumlama ve kararları içgörülere dayandırma.', icon: 'fa-chart-pie', color: '#81C784',
        content: 'Günümüz dünyasında kararlar sezgilere değil, verilere dayanmalıdır. Büyük veri (Big Data) doğru analiz edildiğinde gizli trendleri ortaya çıkarır. Karar destek sistemleri, veriyi eyleme dönüştürülebilir içgörülere çevirir.',
        pages: [
          { title: 'Bölüm 1: Veri Okuryazarlığı', content: 'Veri okuryazarlığı, verileri okuma, anlama, oluşturma ve iletme yeteneğidir. Günümüzde her yöneticinin temel bir veri okuryazarlığına sahip olması beklenmektedir. Temel kavramlar: Ortalama (mean), medyan (median) ve mod (mode) arasındaki farkı bilmek; korelasyon ile nedensellik arasındaki kritik ayrımı kavramak; ve örneklem büyüklüğünün sonuçların güvenilirliğine etkisini anlamak. Bir veri setine bakarken her zaman şu soruyu sormak gerekir: "Bu veri nasıl toplandı ve hangi önyargıları taşıyor olabilir?"' },
          { title: 'Bölüm 2: Analitik Araçlar ve Raporlama', content: 'Veri analizi için kullanılan araçlar basit Excel tablolarından karmaşık BI (Business Intelligence) platformlarına kadar uzanır. Power BI ve Tableau, verileri görsel ve etkileşimli dashboardlara dönüştüren en yaygın araçlardır. Etkili bir rapor; hedef kitleye uygun dil kullanmalı, en önemli içgörüyü öne çıkarmalı ve eyleme yönlendirici bir sonuçla bitmelidir. "Veri bolluğu, içgörü kıtlığı" tuzağına düşmemek için raporlarda az ama öz metrik kullanmak kritik önem taşır.' },
          { title: 'Bölüm 3: Önyargılar ve Veri Etiği', content: 'Veri odaklı karar vermede en büyük tehlike, verilerin yanlış yorumlanması veya seçici kullanılmasıdır. Onaylama önyargısı (confirmation bias), insanların mevcut inançlarını destekleyen verileri arama eğilimidir. Hayatta kalma önyargısı (survivorship bias) ise sadece başarılı örneklere bakarak genel sonuçlar çıkarmaktır. Veri etiği açısından: Kişisel verilerin gizliliğine saygı göstermek, verileri manipüle etmemek ve analizlerin sınırlılıklarını şeffaf biçimde paylaşmak temel sorumluluklardır.' },
        ],
        questions: [
          { question: "Modern organizasyonlarda kararlar neye dayanmalıdır?", options: ["Sadece sezgilere", "Astrolojiye", "Verilere ve analizlere", "Rastgele tahminlere"], answer: 2 },
          { question: "Veri analizinin temel amacı nedir?", options: ["Disk alanı doldurmak", "Veriyi eyleme dönüştürülebilir içgörülere çevirmek", "Tabloları renklendirmek", "Sadece arşivlemek"], answer: 1 },
          { question: "Büyük veri (Big Data) bize ne sağlar?", options: ["Gizli trendleri bulmayı", "İnternet hızını artırmayı", "Bilgisayarı yavaşlatmayı", "Sadece karmaşa"], answer: 0 },
          { question: "Onaylama önyargısı (confirmation bias) nedir?", options: ["Verileri silmek", "Mevcut inançları destekleyen verileri arama eğilimi", "Tüm verileri kabul etmek", "Veri toplamayı reddetmek"], answer: 1 },
          { question: "Etkili bir veri raporunun temel özelliği nedir?", options: ["Mümkün olduğunca uzun olması", "Az ama öz metrik ve eyleme yönlendirici sonuç", "Sadece grafiklerden oluşması", "Teknik jargon kullanması"], answer: 1 }
        ]
      },
      { 
        id: 'stratejik-3', title: 'Risk Yönetimi ve Senaryo Analizi', duration: '4 Modül (1.5 saat)', rating: '4.7', instructor: 'Burak Özdemir', description: 'Potansiyel riskleri belirleme ve alternatif senaryolar geliştirme.', icon: 'fa-shield-halved', color: '#66BB6A',
        content: 'Risk yönetimi, gelecekteki belirsizliklerin kurum üzerindeki potansiyel etkilerini proaktif olarak yönetmektir. Senaryo analizleri "En kötü durum" (Worst Case) planlarını da kapsar ve kriz anında dayanıklılık (resilience) sağlar.',
        pages: [
          { title: 'Bölüm 1: Risk Yönetiminin Temelleri', content: 'Risk, belirsizliğin hedefler üzerindeki etkisidir. Risk yönetimi döngüsü dört aşamadan oluşur: Tanımlama (hangi riskler var?), Değerlendirme (olasılık ve etki ne kadar büyük?), Yanıt (riski azalt, transfer et, kabul et veya kaçın) ve İzleme (sürekli takip). Riskler iki boyutta değerlendirilir: Olasılık (ne kadar muhtemel?) ve Etki (gerçekleşirse ne kadar zarar verir?). Bu iki boyutun çarpımı "risk skoru"nu verir ve önceliklendirmeyi sağlar.' },
          { title: 'Bölüm 2: Senaryo Analizi', content: 'Senaryo analizi, geleceğin farklı olasılıklarını sistematik biçimde keşfetme yöntemidir. Üç temel senaryo hazırlanır: En iyi durum (Best Case), Temel durum (Base Case) ve En kötü durum (Worst Case). Her senaryo için ayrı eylem planları hazırlanır. Bu yaklaşım, kriz anında "ne yapacağız?" sorusunu önceden yanıtlamış olmayı sağlar. Özellikle tedarik zinciri, finansal planlama ve proje yönetiminde senaryo analizi kritik bir araçtır.' },
          { title: 'Bölüm 3: Kurumsal Dayanıklılık (Resilience)', content: 'Dayanıklılık, bir organizasyonun beklenmedik olaylardan hızla toparlanma ve hatta bu süreçten daha güçlü çıkma kapasitesidir. COVID-19 pandemisi, dijital dönüşüme hazırlıklı olan şirketlerin çok daha hızlı adapte olduğunu göstermiştir. Dayanıklı organizasyonların ortak özellikleri: Çeşitlendirilmiş tedarik zincirleri, güçlü nakit rezervleri, esnek iş modelleri ve kriz iletişim planlarıdır. Dayanıklılık bir maliyet değil, uzun vadeli bir yatırımdır.' },
        ],
        questions: [
          { question: "Risk yönetiminin doğası nasıldır?", options: ["Reaktif", "Proaktif", "Kaderci", "Umursamaz"], answer: 1 },
          { question: "Senaryo analizinde hangi durum planlanır?", options: ["Sadece En İyi Durum", "Sadece Normal Durum", "En Kötü Durum dahil tüm alternatifler", "Geçmiş durumlar"], answer: 2 },
          { question: "Kriz anında kuruma ne sağlar?", options: ["Dayanıklılık (Resilience)", "Panik", "Zaman kaybı", "İflas"], answer: 0 },
          { question: "Risk skoru nasıl hesaplanır?", options: ["Gelir - Gider", "Olasılık x Etki", "Çalışan sayısı / Bütçe", "Sadece tahminle"], answer: 1 },
          { question: "Dayanıklı organizasyonların ortak özelliği nedir?", options: ["Tek tedarikçiye bağımlılık", "Çeşitlendirilmiş tedarik zincirleri ve esnek iş modelleri", "Sıfır nakit rezervi", "Değişime kapalı olmak"], answer: 1 }
        ]
      },
    ],
  },
  butce: {
    name: 'Bütçe Yönetimi',
    courses: [
      { 
        id: 'butce-1', title: 'Temel Bütçe Planlama ve Kontrol', duration: '5 Modül (2 saat)', rating: '4.6', instructor: 'Fatma Demir', description: 'Departman bütçesi oluşturma, takip etme ve raporlama teknikleri.', icon: 'fa-calculator', color: '#FFB74D',
        content: 'Bütçe, kurumun hedeflerine ulaşması için kaynakların rakamsal tahsisidir. Gelir ve gider dengesinin kurulması hayati önem taşır. Etkili bir bütçe esnek olmalı, ancak kontrol mekanizmalarıyla düzenli takip edilmelidir.',
        pages: [
          { title: 'Bölüm 1: Bütçe Nedir ve Neden Önemlidir?', content: 'Bütçe, bir organizasyonun belirli bir dönem için gelir ve giderlerini önceden planladığı finansal bir belgedir. Bütçe olmadan kaynak tahsisi rastgele yapılır, öncelikler belirsizleşir ve finansal kontrol kaybedilir. Bütçe türleri: Faaliyet bütçesi (günlük operasyonlar), Sermaye bütçesi (uzun vadeli yatırımlar) ve Nakit bütçesi (nakit akışı yönetimi). Sıfır tabanlı bütçeleme (Zero-Based Budgeting) yaklaşımında her dönem bütçe sıfırdan başlanarak oluşturulur; bu yöntem israfı önlemede etkilidir ancak zaman alıcıdır.' },
          { title: 'Bölüm 2: Bütçe Hazırlama Süreci', content: 'Bütçe hazırlama süreci genellikle şu adımları izler: Geçmiş dönem verilerinin analizi, stratejik hedeflerin belirlenmesi, departman bazlı tahminlerin toplanması, konsolidasyon ve onay. Bütçe hazırlarken dikkat edilmesi gereken noktalar: Gerçekçi gelir tahminleri yapmak (iyimser senaryolara kapılmamak), sabit ve değişken giderleri ayrıştırmak, beklenmedik giderler için %10-15 tampon bırakmak. Bütçe bir kez hazırlandıktan sonra aylık olarak gerçekleşen rakamlarla karşılaştırılmalı ve sapmalar analiz edilmelidir.' },
          { title: 'Bölüm 3: Bütçe Kontrolü ve Sapma Analizi', content: 'Bütçe kontrolü, planlanan ile gerçekleşen rakamlar arasındaki farkları (sapmaları) düzenli olarak izleme sürecidir. Olumlu sapma: Gelirler bütçenin üzerinde veya giderler bütçenin altında gerçekleşmiştir. Olumsuz sapma: Gelirler bütçenin altında veya giderler bütçenin üzerinde gerçekleşmiştir. Sapma analizi yapılırken sadece "ne kadar saptı?" değil, "neden saptı?" sorusu da yanıtlanmalıdır. Bu analiz, gelecek dönem bütçelerinin daha isabetli hazırlanmasına katkı sağlar.' },
        ],
        questions: [
          { question: "Bütçe en basit tanımıyla nedir?", options: ["Sadece masrafları yazmak", "Kaynakların rakamsal olarak tahsisi", "Bankadan kredi çekmek", "Faturaları ödemek"], answer: 1 },
          { question: "Etkili bir bütçe nasıl olmalıdır?", options: ["Kesinlikle değiştirilemez", "Esnek ama kontrol altında", "Sadece tahminden ibaret", "Tamamen serbest"], answer: 1 },
          { question: "Bütçede dengesi kurulması gereken iki ana unsur nedir?", options: ["Gece ve Gündüz", "Müşteri ve Personel", "Gelir ve Gider", "Renk ve Şekil"], answer: 2 },
          { question: "Sıfır tabanlı bütçeleme (Zero-Based Budgeting) ne anlama gelir?", options: ["Hiç bütçe yapmamak", "Her dönem bütçeyi sıfırdan başlatmak", "Sadece giderleri sıfırlamak", "Geçen yılın bütçesini kopyalamak"], answer: 1 },
          { question: "Bütçe hazırlarken beklenmedik giderler için ne kadar tampon bırakılması önerilir?", options: ["%1-2", "%5", "%10-15", "%50"], answer: 2 }
        ]
      },
      { 
        id: 'butce-2', title: 'Finansal Analiz ve Raporlama', duration: '4 Modül (1.5 saat)', rating: '4.8', instructor: 'Ahmet Çelik', description: 'Finansal tabloları okuma, analiz etme ve yönetim raporları hazırlama.', icon: 'fa-file-invoice-dollar', color: '#FFA726',
        content: 'Finansal analiz; bilanço, gelir tablosu ve nakit akış tablosunun incelenmesidir. Nakit akışı (Cash Flow) işletmenin kan dolaşımıdır; kâr etmek her zaman kasada nakit olduğu anlamına gelmez.',
        pages: [
          { title: 'Bölüm 1: Temel Finansal Tablolar', content: 'Üç temel finansal tablo vardır: Bilanço (Balance Sheet): Belirli bir tarihteki varlıkları, yükümlülükleri ve öz kaynakları gösterir. Gelir Tablosu (Income Statement): Belirli bir dönemdeki gelirleri, giderleri ve net kârı gösterir. Nakit Akış Tablosu (Cash Flow Statement): Nakit girişlerini ve çıkışlarını üç kategoride gösterir: Operasyonel, Yatırım ve Finansman faaliyetleri. Bu üç tablo birlikte okunduğunda şirketin finansal sağlığı hakkında kapsamlı bir tablo ortaya çıkar.' },
          { title: 'Bölüm 2: Finansal Oranlar', content: 'Finansal oranlar, ham rakamları anlamlı karşılaştırmalara dönüştürür. Likidite oranları (Cari Oran, Asit-Test Oranı): Kısa vadeli yükümlülükleri karşılama kapasitesini ölçer. Kârlılık oranları (Brüt Kâr Marjı, Net Kâr Marjı, ROE, ROA): Varlıkların ve öz kaynakların ne kadar verimli kullanıldığını gösterir. Borçluluk oranları (Borç/Öz Kaynak): Finansal kaldıraç düzeyini ölçer. Bu oranlar tek başına değil, sektör ortalamaları ve geçmiş dönemlerle karşılaştırılarak yorumlanmalıdır.' },
          { title: 'Bölüm 3: Yönetim Raporları Hazırlama', content: 'Yönetim raporları, karar alıcılara doğru zamanda doğru bilgiyi sunmak için tasarlanır. İyi bir yönetim raporu: Yönetici özeti (executive summary) ile başlar, en kritik KPI\'ları öne çıkarır, sapmaları ve nedenlerini açıklar, öneriler ve sonraki adımlarla biter. Raporlarda görselleştirme (grafikler, tablolar) metinden daha etkilidir. Ancak görselleştirme yanıltıcı olmamalı; eksenler, ölçekler ve başlıklar doğru ve şeffaf biçimde sunulmalıdır.' },
        ],
        questions: [
          { question: "İşletmenin kan dolaşımı olarak nitelendirilen kavram hangisidir?", options: ["Ofis malzemeleri", "Nakit Akışı (Cash Flow)", "Kırtasiye Gideri", "Reklam Bütçesi"], answer: 1 },
          { question: "Finansal analizde hangi tablo incelenmez?", options: ["Gelir Tablosu", "Bilanço", "Yemekhane Menüsü", "Nakit Akış Tablosu"], answer: 2 },
          { question: "Bir şirketin kâr etmesi aşağıdakilerden hangisini kesin garantilemez?", options: ["Personelin mutlu olduğunu", "Kasada anında nakit olduğunu", "Pazar payının arttığını", "Rakiplerin battığını"], answer: 1 },
          { question: "Cari Oran hangi tür oranlar arasında yer alır?", options: ["Kârlılık oranları", "Borçluluk oranları", "Likidite oranları", "Büyüme oranları"], answer: 2 },
          { question: "Yönetim raporlarında görselleştirme neden önemlidir?", options: ["Raporu uzatmak için", "Bilgiyi daha hızlı ve etkili iletmek için", "Sadece estetik amaçla", "Metni gizlemek için"], answer: 1 }
        ]
      },
      { 
        id: 'butce-3', title: 'Maliyet Optimizasyonu Stratejileri', duration: '3 Modül (1 saat)', rating: '4.5', instructor: 'Zeynep Aktaş', description: 'Maliyetleri düşürme ve kaynakları verimli kullanma yöntemleri.', icon: 'fa-coins', color: '#FFB74D',
        content: 'Maliyet optimizasyonu kaliteden ödün vermeden israfı (waste) önlemektir. Yalın (Lean) yönetim prensipleri ile süreçlerdeki katma değersiz adımlar ayıklanır ve kaynaklar en verimli şekilde değerlendirilir.',
        pages: [
          { title: 'Bölüm 1: Maliyet Yapısını Anlamak', content: 'Maliyetler iki ana kategoriye ayrılır: Sabit maliyetler (kira, maaşlar gibi üretim hacminden bağımsız giderler) ve değişken maliyetler (hammadde, komisyon gibi üretimle orantılı değişen giderler). Başabaş noktası (Break-Even Point), toplam gelirlerin toplam maliyetlere eşit olduğu noktadır; bu noktanın altında zarar, üzerinde kâr oluşur. Maliyet optimizasyonuna başlamadan önce maliyet yapısını detaylı analiz etmek gerekir; neyi optimize edeceğinizi bilmeden hareket etmek verimsizdir.' },
          { title: 'Bölüm 2: Yalın (Lean) Yönetim', content: 'Yalın yönetim, Toyota Üretim Sistemi\'nden doğan ve israfı (muda) ortadan kaldırmayı hedefleyen bir felsefedir. Yedi israf türü: Aşırı üretim, Bekleme, Gereksiz taşıma, Aşırı işleme, Stok fazlası, Gereksiz hareket ve Hatalar/yeniden işleme. Kaizen (sürekli iyileştirme) felsefesiyle küçük ama sürekli iyileştirmeler yapılır. 5S metodolojisi (Sırala, Sistemleştir, Sil, Standartlaştır, Sürdür) çalışma ortamını düzenleyerek verimliliği artırır.' },
          { title: 'Bölüm 3: Tedarik Zinciri Optimizasyonu', content: 'Tedarik zinciri maliyetleri, birçok sektörde toplam maliyetlerin %50-70\'ini oluşturur. Optimizasyon stratejileri: Toplu satın alma ile birim maliyeti düşürmek, tedarikçi sayısını azaltarak ilişkileri derinleştirmek, tam zamanında (Just-In-Time) üretimle stok maliyetlerini minimize etmek ve dijital araçlarla tedarik zinciri görünürlüğünü artırmak. Ancak maliyet optimizasyonu yaparken kalite ve teslimat güvenilirliğinden ödün vermemek kritik önem taşır; en ucuz tedarikçi her zaman en iyi seçenek değildir.' },
        ],
        questions: [
          { question: "Maliyet optimizasyonunda temel kural nedir?", options: ["Kaliteyi umursamamak", "Sadece ucuz malzeme almak", "Kaliteden ödün vermeden israfı önlemek", "Tüm personeli işten çıkarmak"], answer: 2 },
          { question: "Yalın (Lean) yönetim hangi adımları ortadan kaldırmayı hedefler?", options: ["Değer katan adımları", "Katma değersiz (israf) adımları", "Zorunlu hukuki adımları", "Müşteri temas adımlarını"], answer: 1 },
          { question: "Optimizasyon kaynakların nasıl kullanılmasını sağlar?", options: ["Daha hızlı tükenmesini", "En verimli şekilde", "Tamamen durdurulmasını", "Sadece kâğıt üzerinde görünmesini"], answer: 1 },
          { question: "Başabaş noktası (Break-Even Point) nedir?", options: ["Kârın maksimum olduğu nokta", "Toplam gelirin toplam maliyete eşit olduğu nokta", "Sıfır üretim noktası", "Maksimum stok noktası"], answer: 1 },
          { question: "5S metodolojisinde 'S' harfleri neyi temsil eder?", options: ["Satış, Servis, Stok, Sistem, Süreç", "Sırala, Sistemleştir, Sil, Standartlaştır, Sürdür", "Strateji, Skor, Süre, Sayı, Sonuç", "Sadece bir S vardır"], answer: 1 }
        ]
      },
    ],
  },
  cevik: {
    name: 'Çeviklik & İnovasyon',
    courses: [
      { 
        id: 'cevik-1', title: 'Agile ve Scrum Temelleri', duration: '5 Modül (2 saat)', rating: '4.9', instructor: 'Can Yıldırım', description: 'Çevik metodolojilerin temellerini öğrenin, Scrum framework\'ünü uygulayın.', icon: 'fa-rotate', color: '#9C27B0',
        content: 'Scrum; Product Owner, Scrum Master ve Geliştirme Ekibi olmak üzere 3 temel rolden oluşur. İşler kısa döngüler (Sprint) halinde tamamlanır ve her döngü sonunda çalışan, değere sahip bir ürün parçası (Increment) ortaya çıkarılır.',
        pages: [
          { title: 'Bölüm 1: Agile Felsefesi', content: 'Agile, bir metodoloji değil; bir düşünce biçimi ve değerler setidir. Temel ilkesi: Değişim kaçınılmazdır, bu yüzden değişime direnmek yerine ona hızla uyum sağlamak gerekir. Agile\'ın 12 ilkesi arasında en kritik olanlar: Çalışan yazılım/ürün en temel ilerleme ölçütüdür; sürdürülebilir bir tempo korunmalıdır; teknik mükemmellik ve iyi tasarım çevikliği artırır; basitlik (yapılmayan işin miktarını maksimize etme sanatı) esastır.' },
          { title: 'Bölüm 2: Scrum Rolleri ve Seremoniler', content: 'Scrum\'ın üç rolü: Product Owner (PO) — müşteri değerini maksimize eder, Product Backlog\'u yönetir. Scrum Master (SM) — Scrum\'ın doğru uygulanmasını sağlar, engelleri kaldırır, bir koç gibi davranır. Development Team — kendi kendini organize eden, çapraz fonksiyonlu ekip. Beş seremon: Sprint Planning (ne yapılacak?), Daily Scrum (dün ne yaptım, bugün ne yapacağım, engel var mı?), Sprint Review (ne ürettik?), Sprint Retrospective (nasıl daha iyi çalışabiliriz?) ve Backlog Refinement (gelecek işleri hazırlama).' },
          { title: 'Bölüm 3: Scrum Artefaktları ve Ölçümler', content: 'Scrum\'ın üç artefaktı: Product Backlog (tüm isteklerin önceliklendirilmiş listesi), Sprint Backlog (bu Sprint\'te yapılacaklar) ve Increment (tamamlanan ve kullanılabilir ürün parçası). Ölçüm araçları: Velocity (ekibin Sprint başına tamamladığı iş miktarı), Burndown Chart (Sprint içinde kalan işin görsel takibi) ve Cumulative Flow Diagram (iş akışındaki darboğazları gösterir). Bu ölçümler ekibin kapasitesini anlamasına ve gelecek Sprint\'leri daha isabetli planlamasına yardımcı olur.' },
        ],
        questions: [
          { question: "Scrum çerçevesinde hangi rol yoktur?", options: ["Product Owner", "Proje Yöneticisi (Klasik)", "Scrum Master", "Geliştirici Ekip"], answer: 1 },
          { question: "Scrum'da kısa çalışma döngülerine ne ad verilir?", options: ["Sprint", "Daily", "Review", "Retrospective"], answer: 0 },
          { question: "Her döngünün (Sprint) sonunda ortaya ne çıkarılmalıdır?", options: ["Sadece 100 sayfalık döküman", "Çalışan ve değere sahip ürün parçası (Increment)", "Hiçbir şey", "Sadece slayt sunumu"], answer: 1 },
          { question: "Sprint Retrospective toplantısının amacı nedir?", options: ["Müşteriye ürünü göstermek", "Ekibin nasıl daha iyi çalışabileceğini tartışmak", "Yeni özellikler planlamak", "Bütçeyi gözden geçirmek"], answer: 1 },
          { question: "Velocity Scrum'da neyi ölçer?", options: ["Ekibin çalışma saatlerini", "Sprint başına tamamlanan iş miktarını", "Müşteri memnuniyetini", "Kod kalitesini"], answer: 1 }
        ]
      },
      { 
        id: 'cevik-2', title: 'İnovasyon ve Yaratıcı Düşünme', duration: '4 Modül (1.5 saat)', rating: '4.7', instructor: 'Dr. Elif Sarı', description: 'Yaratıcı düşünme teknikleri, Design Thinking ve inovasyon süreçleri.', icon: 'fa-lightbulb', color: '#AB47BC',
        content: 'Design Thinking (Tasarım Odaklı Düşünme), merkeze insanı koyan bir inovasyon sürecidir. Adımları: Empati Kur, Tanımla, Fikir Üret, Prototip Yap ve Test Et. Hata yapmaktan korkmamayı ve hızlı öğrenmeyi teşvik eder.',
        pages: [
          { title: 'Bölüm 1: İnovasyon Nedir?', content: 'İnovasyon, yeni fikirlerin değere dönüştürülmesidir. Sadece icat etmek değil; icadı ticarileştirmek, ölçeklendirmek ve sürdürülebilir kılmaktır. İnovasyon türleri: Artımsal inovasyon (mevcut ürün/hizmetlerin iyileştirilmesi), Radikal inovasyon (tamamen yeni bir şey yaratmak) ve Yıkıcı inovasyon (mevcut pazarı alt üst eden yeni model). Kurumsal inovasyon kültürü için üç şart: Psikolojik güvenlik (hata yapmaktan korkmamak), kaynak tahsisi (zaman ve bütçe) ve üst yönetim desteği.' },
          { title: 'Bölüm 2: Design Thinking Süreci', content: 'Design Thinking, Stanford d.school tarafından popülerleştirilen insan merkezli bir problem çözme yaklaşımıdır. Beş aşama: 1) Empati Kur — kullanıcıyı gözlemle, dinle, anla. 2) Tanımla — problemi kullanıcının bakış açısından net biçimde ifade et. 3) Fikir Üret — yargılamadan, mümkün olduğunca çok fikir üret (brainstorming). 4) Prototip Yap — fikirleri hızlı ve ucuz biçimde somutlaştır. 5) Test Et — prototipi gerçek kullanıcılarla test et, geri bildirim al, iyileştir. Bu süreç doğrusal değil, döngüseldir.' },
          { title: 'Bölüm 3: Yaratıcılığı Engelleyen Faktörler', content: 'Araştırmalar, insanların büyük çoğunluğunun çocuklukta yüksek yaratıcılık puanı alırken yetişkinlikte bu puanın dramatik biçimde düştüğünü göstermektedir. Yaratıcılığı öldüren faktörler: "Bu daha önce denendi ve işe yaramadı" düşüncesi, hata yapma korkusu, zaman baskısı ve aşırı eleştiri. Yaratıcılığı besleyen pratikler: Farklı disiplinlerden insanlarla etkileşim, merak güdümlü öğrenme, "evet, ve..." tekniği (fikirleri reddetmek yerine üzerine inşa etmek) ve düzenli "boş zaman" (Google\'ın %20 kuralı gibi).' },
        ],
        questions: [
          { question: "Design Thinking'in merkezinde ne vardır?", options: ["Makine", "Kod", "İnsan (Kullanıcı)", "Para"], answer: 2 },
          { question: "Design Thinking'in ilk adımı hangisidir?", options: ["Test Et", "Empati Kur", "Prototip Yap", "Fikir Üret"], answer: 1 },
          { question: "Tasarım odaklı düşünme neyi teşvik eder?", options: ["Hata yapmaktan korkmamayı ve hızlı öğrenmeyi", "İlk hatada pes etmeyi", "Sadece mükemmeli beklemeyi", "Farklı fikirleri cezalandırmayı"], answer: 0 },
          { question: "Yıkıcı inovasyon (Disruptive Innovation) ne anlama gelir?", options: ["Mevcut ürünü biraz iyileştirmek", "Mevcut pazarı alt üst eden yeni bir model yaratmak", "Rakipleri taklit etmek", "Sadece teknoloji geliştirmek"], answer: 1 },
          { question: "Brainstorming seansında temel kural nedir?", options: ["Sadece pratik fikirleri kabul etmek", "Fikirleri anında eleştirmek", "Yargılamadan mümkün olduğunca çok fikir üretmek", "Sadece yöneticilerin fikir söylemesi"], answer: 2 }
        ]
      },
      { 
        id: 'cevik-3', title: 'Kanban ve Sürekli İyileştirme', duration: '3 Modül (1 saat)', rating: '4.6', instructor: 'Murat Öztürk', description: 'Kanban sistemi ile iş akışı yönetimi ve Kaizen felsefesi.', icon: 'fa-clipboard-list', color: '#9C27B0',
        content: 'Kanban, iş akışını görselleştirmeye yarayan bir yöntemdir. Temel amacı, aynı anda yapılan iş (WIP - Work in Progress) limitlerini belirleyerek darboğazları (bottleneck) tespit etmektir. Kaizen ise sürekli küçük iyileştirmeler yapma felsefesidir.',
        pages: [
          { title: 'Bölüm 1: Kanban Sistemi', content: 'Kanban, Japonca "görsel kart" anlamına gelir ve Toyota\'nın üretim sisteminden doğmuştur. Temel prensipler: İş akışını görselleştir (Kanban tahtası: Yapılacak, Devam Eden, Tamamlandı), WIP limitlerini belirle (aynı anda çok fazla iş başlatmak verimliliği düşürür), akışı yönet (darboğazları tespit et ve gider), süreç politikalarını açık hale getir ve sürekli iyileştir. Kanban, Scrum\'dan farklı olarak sabit Sprint döngüleri gerektirmez; sürekli akış (continuous flow) modeliyle çalışır.' },
          { title: 'Bölüm 2: Kaizen Felsefesi', content: 'Kaizen (改善), Japonca "daha iyiye doğru değişim" anlamına gelir. Felsefenin özü: Büyük devrimsel değişimler yerine, her gün küçük iyileştirmeler yapmak. Kaizen döngüsü PDCA (Plan-Do-Check-Act) olarak bilinir: Planla (iyileştirme fırsatını belirle), Uygula (küçük ölçekte dene), Kontrol et (sonuçları ölç), Harekete geç (başarılıysa standartlaştır, değilse öğren ve tekrar planla). Kaizen kültüründe her çalışan iyileştirme önerebilir; bu yaklaşım sahiplenme duygusunu ve motivasyonu artırır.' },
          { title: 'Bölüm 3: Darboğaz Analizi', content: 'Darboğaz (bottleneck), bir süreçte akışı yavaşlatan veya durduran kısımdır. Kısıtlar Teorisi (Theory of Constraints — TOC), Eliyahu Goldratt tarafından geliştirilmiş ve her sistemde en az bir kısıt olduğunu öne sürer. TOC\'un beş adımı: Kısıtı tanımla, kısıtı sömür (mevcut kapasitesini maksimize et), diğer her şeyi kısıta tabi kıl, kısıtı kaldır (kapasiteyi artır), tekrar başa dön. Kanban tahtasında WIP limitleri aşıldığında darboğazlar görünür hale gelir ve müdahale edilebilir.' },
        ],
        questions: [
          { question: "Kanban metodunun temel amacı nedir?", options: ["Herkesi kovmak", "İş akışını görselleştirmek ve darboğazları tespit etmek", "Maaşları hesaplamak", "Sadece not tutmak"], answer: 1 },
          { question: "Kaizen felsefesi neyi ifade eder?", options: ["Büyük radikal değişim", "Sürekli ve küçük iyileştirmeler", "İşi yavaşlatma", "Kararları erteleme"], answer: 1 },
          { question: "Aynı anda yapılan işleri kısıtlayan Kanban kuralı nedir?", options: ["WIP (Work in Progress) limitleri", "VIP Limitleri", "Overtime", "Deadline"], answer: 0 },
          { question: "PDCA döngüsünde 'C' harfi neyi temsil eder?", options: ["Create (Oluştur)", "Check (Kontrol Et)", "Change (Değiştir)", "Complete (Tamamla)"], answer: 1 },
          { question: "Kısıtlar Teorisi'ne (TOC) göre her sistemde ne vardır?", options: ["Sonsuz kapasite", "En az bir kısıt (darboğaz)", "Mükemmel verimlilik", "Sıfır israf"], answer: 1 }
        ]
      },
      { 
        id: 'cevik-4', title: 'Dijital Dönüşüm ve Değişim Yönetimi', duration: '4 Modül (1.5 saat)', rating: '4.8', instructor: 'Selin Aydın', description: 'Dijital çağda organizasyonel değişim ve adaptasyon stratejileri.', icon: 'fa-arrows-rotate', color: '#AB47BC',
        content: 'Dijital dönüşüm sadece yeni yazılımlar satın almak değil, bir kültür değişimidir. Çalışanların yeni yetkinlikler kazanması (upskilling) ve süreçlerin teknoloji merkezli yeniden tasarlanması gerekir.',
        pages: [
          { title: 'Bölüm 1: Dijital Dönüşümün Boyutları', content: 'Dijital dönüşüm dört boyutta gerçekleşir: Müşteri deneyimi (dijital kanallar, kişiselleştirme), Operasyonel süreçler (otomasyon, yapay zeka), İş modeli (platform ekonomisi, abonelik modelleri) ve Kültür & Yetenek (dijital yetkinlikler, çevik çalışma). McKinsey araştırmalarına göre dijital dönüşüm girişimlerinin %70\'i başarısızlıkla sonuçlanmaktadır. Başarısızlığın en büyük nedeni teknoloji değil, insan ve kültür faktörüdür.' },
          { title: 'Bölüm 2: Değişim Yönetimi Modelleri', content: 'Kotter\'ın 8 Adımlı Değişim Modeli en yaygın kullanılan çerçevedir: 1) Aciliyet duygusu yarat, 2) Güçlü bir koalisyon oluştur, 3) Vizyon ve strateji geliştir, 4) Değişim vizyonunu ilet, 5) Geniş tabanlı eylemi güçlendir, 6) Kısa vadeli kazanımlar üret, 7) Kazanımları pekiştir ve daha fazla değişim üret, 8) Değişimi kültüre yerleştir. ADKAR modeli ise bireysel değişime odaklanır: Farkındalık, Arzu, Bilgi, Yetenek ve Pekiştirme.' },
          { title: 'Bölüm 3: Upskilling ve Reskilling', content: 'Dünya Ekonomik Forumu\'na göre 2025 yılına kadar iş gücünün %50\'si yeniden beceri kazanmak zorunda kalacaktır. Upskilling: Mevcut rolde daha ileri yetkinlikler kazanmak (örn. bir pazarlamacının veri analitiği öğrenmesi). Reskilling: Tamamen farklı bir role geçiş için yeni beceriler edinmek. Kurumlar için en etkili yaklaşım: Çalışanların kariyer hedeflerini anlamak, kişiselleştirilmiş öğrenme yolları oluşturmak ve öğrenmeyi iş akışına entegre etmek (70-20-10 modeli: %70 iş başında, %20 mentorluk, %10 formal eğitim).' },
        ],
        questions: [
          { question: "Dijital dönüşüm en doğru nasıl tanımlanır?", options: ["Sadece yeni bilgisayar almak", "Sosyal medya hesabı açmak", "Teknoloji odaklı kültürel bir değişim", "Sadece yazılım satın almak"], answer: 2 },
          { question: "Çalışanlara yeni dijital yetkinlikler kazandırma sürecine ne denir?", options: ["Upskilling", "Downsizing", "Offboarding", "Outsourcing"], answer: 0 },
          { question: "Dönüşümde odak noktası ne olmalıdır?", options: ["Sadece alet edevat", "Eski köhne sistemlerde direnmek", "Süreçlerin teknoloji merkezli yeniden tasarlanması", "Personeli bilgisayardan uzak tutmak"], answer: 2 },
          { question: "Kotter'ın değişim modelinde kaç adım vardır?", options: ["3", "5", "8", "12"], answer: 2 },
          { question: "70-20-10 öğrenme modelinde '%70' neyi temsil eder?", options: ["Formal eğitim", "Mentorluk", "İş başında öğrenme", "Online kurslar"], answer: 2 }
        ]
      },
    ],
  },
};

// Özelleştirilmiş 5 sayfalık içerik ve 20 soruluk sınav
const specialCoursePages = [
  {
    title: "Bölüm 1: Etkili İletişimin Temelleri",
    content: "Etkili iletişim, sadece konuşmak ve mesajı iletmek değil; aynı zamanda mesajın karşı taraf tarafından doğru algılandığından emin olma sürecidir. Bir organizasyonun başarısı büyük ölçüde çalışanlar arasındaki iletişimin kalitesine dayanır. İletişim süreci kaynak (gönderici), mesaj, kanal, alıcı ve geribildirim (feedback) öğelerinden oluşur. Kaynak, mesajı anlaşılır bir şekilde kodlamalı; alıcı ise bu mesajı kendi filtrelerinden geçirerek çözmelidir. İletişimin önündeki en büyük engellerden biri 'varsaymak'tır. Karşı tarafın bizi anladığını varsaymak yerine aktif sorular sorarak teyit etmek gerekir. Etkili bir iletişimde sen dili ('Sen her zaman geç kalıyorsun') yerine ben dili ('Toplantılara geç katılman projede aksamalara neden olduğu için endişeleniyorum') kullanılmalıdır. Ben dili, karşı tarafı savunmaya geçirmeden sorunu çözmeye odaklanır."
  },
  {
    title: "Bölüm 2: Aktif Dinleme ve Empati",
    content: "Aktif dinleme, iletişim sürecinin konuşmak kadar önemli olan diğer yarısıdır. İnsanlar genellikle anlamak için değil, cevap vermek için dinlerler. Aktif dinlemede ise amaç, karşı tarafın ne söylediğini, hangi duygularla söylediğini ve asıl ihtiyacının ne olduğunu anlamaktır. Göz teması kurmak, başla onaylamak, söz kesmemek ve anlatılanları özetleyerek geri yansıtmak ('Anladığım kadarıyla bu projede yalnız bırakıldığını hissediyorsun, doğru mu?') aktif dinlemenin temel adımlarıdır. Empati ise kendini karşındakinin yerine koyabilme sanatıdır. Sempatiden farklı olarak, empati kurduğunuzda karşı tarafla aynı duyguyu yaşamak zorunda değilsinizdir; sadece onun o duyguyu neden yaşadığını anlar ve saygı duyarsınız. Liderlerin empatik davranması, ekiplerde psikolojik güvenlik ortamı yaratır."
  },
  {
    title: "Bölüm 3: Sözsüz İletişim ve Beden Dili",
    content: "İletişim araştırmalarına göre, yüz yüze iletişimde mesajın sadece %7'si kelimelerle, %38'i ses tonu ve vurguyla, %55'i ise beden diliyle iletilmektedir. Bu oranlar bağlama göre değişse de sözsüz iletişimin gücünü vurgular. Kolların bağlı olması savunmacı bir tutumu, göz temasından kaçınmak güvensizliği veya saklanan bir bilgiyi işaret edebilir. Etkili liderler kendi beden dillerinin farkındadır ve bunu bilinçli yönetirler. Toplantılarda açık duruş sergilemek, konuşan kişiye doğru hafifçe eğilmek ve uygun mimikler kullanmak, güven ve samimiyet inşa eder. Dijital iletişimde (e-posta, Slack vb.) beden dili olmadığı için yanlış anlaşılma riski çok daha yüksektir. Bu yüzden dijital platformlarda kelime seçimine ekstra özen gösterilmeli, gerektiğinde emoji kullanımıyla veya kısa sesli/görüntülü aramalarla duygu durumu desteklenmelidir."
  },
  {
    title: "Bölüm 4: Motivasyon Teorileri",
    content: "Çalışan motivasyonu, performansın doğrudan belirleyicisidir. Maslow'un İhtiyaçlar Hiyerarşisi, insanların önce temel fizyolojik ve güvenlik ihtiyaçlarını karşıladığını, ardından ait olma, saygı görme ve kendini gerçekleştirme aşamalarına geçtiğini söyler. Kurumsal hayatta sadece maaş (güvenlik) motivasyon için yeterli değildir. Herzberg'in Çift Faktör Teorisi'ne göre maaş, fiziksel şartlar gibi 'Hijyen Faktörler' eksikse çalışan mutsuz olur; ancak bunların varlığı tek başına motivasyon yaratmaz. Gerçek motivasyon 'Motive Edici Faktörler' ile sağlanır: Başarı hissi, takdir edilme, sorumluluk alma ve kişisel gelişim fırsatları. Liderler, ekiplerini motive etmek için onların hangi aşamada olduğunu bilmeli ve bireyselleştirilmiş motivasyon stratejileri uygulamalıdır."
  },
  {
    title: "Bölüm 5: Çatışma Çözümü ve Geri Bildirim Kültürü",
    content: "Çatışma her iş yerinde kaçınılmazdır; önemli olan bunun yıkıcı değil, yapıcı şekilde yönetilmesidir. Çatışmalardan kaçınmak (halı altına süpürmek) ileride daha büyük patlamalara yol açar. Çatışma anında sorun kişiselleştirilmemeli, probleme odaklanılmalıdır. Uzlaşma hedeflenmeli, rekabetçi tutumlardan kaçınılmalıdır. Etkili çatışma çözümünün anahtarı düzenli geribildirim kültürüdür. Geri bildirim sandviç metodu ile verilebilir: Önce olumlu bir şey söylenir, ardından düzeltilmesi gereken alan belirtilir ve sonunda destekleyici bir kapanış yapılır. Ancak modern yaklaşım, geri bildirimin anında, şeffaf ve doğrudan (Radical Candor) olmasını savunur; yani kişiyi derinden önemsemek ve doğrudan yüzleşmek."
  }
];

const specialQuizQuestions = [
  { q: "1. İletişim sürecinde karşı tarafı suçlamadan ve savunmaya geçirmeden sorunu ifade eden dile ne ad verilir?", opts: ["Sen Dili", "Ben Dili", "Biz Dili", "O Dili"], a: 1 },
  { q: "2. Hangisi iletişimin önündeki en büyük engellerden biri olarak metinde vurgulanmıştır?", opts: ["Varsaymak", "Soru sormak", "Not almak", "Göz teması kurmak"], a: 0 },
  { q: "3. 'Anlamak için değil, cevap vermek için dinlemek' hangi dinleme türünün zıddıdır?", opts: ["Seçici Dinleme", "Yüzeysel Dinleme", "Aktif Dinleme", "Pasif Dinleme"], a: 2 },
  { q: "4. Empati ile sempati arasındaki temel fark nedir?", opts: ["Sempati üzülmektir, empati sevinmektir", "Empatide aynı duyguyu yaşamak zorunlu değildir, anlamak esastır", "İkisi aynı şeydir", "Empati sadece iş yerinde olur"], a: 1 },
  { q: "5. Aktif dinleme tekniğinde hangisi yapılmamalıdır?", opts: ["Göz teması kurmak", "Başla onaylamak", "Karşı tarafın sözünü kesip çözüm sunmak", "Anlatılanları özetlemek"], a: 2 },
  { q: "6. Yüz yüze iletişimde mesajın en büyük yüzdesi (%) ne ile iletilir?", opts: ["Kelimeler", "Ses Tonu", "Beden Dili", "Yazılı Metin"], a: 2 },
  { q: "7. Kolların bağlı olması iletişimde genellikle hangi tutumu ifade eder?", opts: ["Açıklık", "Savunmacı/Kapalı Tutum", "Saldırganlık", "Aşırı Neşe"], a: 1 },
  { q: "8. Dijital iletişimde (e-posta vb.) yanlış anlaşılma riskinin yüksek olmasının temel sebebi nedir?", opts: ["İnternetin yavaş olması", "Beden dili ve ses tonunun eksik olması", "Yazım yanlışları", "Kelime dağarcığının dar olması"], a: 1 },
  { q: "9. Maslow'un hiyerarşisinde en üst sırada yer alan ihtiyaç hangisidir?", opts: ["Güvenlik", "Ait Olma", "Kendini Gerçekleştirme", "Fizyolojik"], a: 2 },
  { q: "10. Herzberg'in Çift Faktör Teorisi'ne göre 'Maaş' nasıl bir faktördür?", opts: ["Motive Edici Faktör", "Hijyen Faktör", "Duygusal Faktör", "Gereksiz Faktör"], a: 1 },
  { q: "11. Aşağıdakilerden hangisi Herzberg'e göre gerçek bir 'Motive Edici Faktör'dür?", opts: ["Çalışma masasının konumu", "Ofis ısısı", "Takdir edilme ve sorumluluk alma", "Servis imkanı"], a: 2 },
  { q: "12. Çatışma yönetimi konusunda metinde verilen en temel tavsiye nedir?", opts: ["Çatışmadan kaçınmak", "Kişiselleştirmeden probleme odaklanmak", "Haklı çıkana kadar tartışmak", "Karşı tarafı işten çıkarmak"], a: 1 },
  { q: "13. Sandviç Metodu ne için kullanılır?", opts: ["Öğle arası planlaması", "Bütçe yapımı", "Geri bildirim (Feedback) verme", "İşe alım mülakatı"], a: 2 },
  { q: "14. Sandviç metodunun sıralaması nasıldır?", opts: ["Eleştiri - Eleştiri - Olumlu", "Olumlu - Eleştiri - Olumlu", "Olumlu - Olumlu - Eleştiri", "Sadece Olumlu"], a: 1 },
  { q: "15. 'Radical Candor' (Doğrudan Yüzleşme) yaklaşımının iki temel sütunu nedir?", opts: ["Umursamamak ve Eleştirmek", "Derinden önemsemek ve Doğrudan yüzleşmek", "Pohpohlamak ve Yalan Söylemek", "Görmezden gelmek ve Unutmak"], a: 1 },
  { q: "16. Psikolojik güvenlik ortamı (Psychological safety) kurumlarda nasıl sağlanır?", opts: ["Liderlerin empatik davranmasıyla", "Sıkı kurallar koyarak", "Her yere kamera takarak", "Ceza sistemini güçlendirerek"], a: 0 },
  { q: "17. 'Toplantılara geç katılman projede aksamalara neden olduğu için endişeleniyorum' cümlesi neye örnektir?", opts: ["Sen Dili", "Suçlama Dili", "Ben Dili", "Dolaylı İletişim"], a: 2 },
  { q: "18. Çatışmalardan sürekli kaçınmak (halı altına süpürmek) uzun vadede neye yol açar?", opts: ["Tamamen barışa", "Daha büyük patlamalara ve krizlere", "Terfi almaya", "Mutluluğa"], a: 1 },
  { q: "19. Hangi liderlik tutumu çalışan motivasyonunu kırar?", opts: ["Mikro yönetim ve güvensizlik", "Bireyselleştirilmiş motivasyon stratejisi", "Düzenli geri bildirim", "Başarıları kutlamak"], a: 0 },
  { q: "20. Etkili bir iletişim sisteminde 'Feedback' (Geri bildirim) kimler arasında olmalıdır?", opts: ["Sadece patrondan çalışana", "Sadece çalışandan çalışana", "Sadece müşteriden şirkete", "İki yönlü, açık ve şeffaf"], a: 3 }
];

type ModalState = 'CLOSED' | 'READING' | 'QUIZ' | 'RESULT';
type SpecialMode = 'NONE' | 'INTRO' | 'READING' | 'QUIZ' | 'RESULT';

export default function EducationPage() {
  useAuthGuard('USER');
  const [activeCategory, setActiveCategory] = useState('liderlik');
  const [username, setUsername] = useState('');
  const [completedMap, setCompletedMap] = useState<Record<string, string[]>>({});
  const [progressPercent, setProgressPercent] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // YZ Öneri state'i
  const [recommendations, setRecommendations] = useState<{courseId: string; category: string; title: string; reason: string; allReasons?: string[]; score: number}[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);

  // Course Player Modal States (For standard courses)
  const [modalState, setModalState] = useState<ModalState>('CLOSED');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [contentPage, setContentPage] = useState(0); // çok sayfalı içerik için

  // Special Full Page Mode (For liderlik-3)
  const [specialMode, setSpecialMode] = useState<SpecialMode>('NONE');
  const [specialPage, setSpecialPage] = useState(0);
  const [specialAnswers, setSpecialAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') document.body.classList.add('dark-mode');
    const user = localStorage.getItem('currentUser') || '';
    setUsername(user);
    loadCompleted(user);
    loadRecommendations();  }, []);

  async function loadRecommendations() {
    setRecsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setRecsLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/api/ai/course-recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch { /* empty */ } finally {
      setRecsLoading(false);
    }
  }

  async function loadCompleted(user: string) {    const map: Record<string, string[]> = {};
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const res = await fetch(`${API_URL}/api/courses/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const courses = await res.json();
          const ids = courses.map((c: any) => c.courseId);
          
          Object.keys(courseData).forEach(cat => {
            const catCourses = courseData[cat].courses.map(c => c.id);
            map[cat] = ids.filter((id: string) => catCourses.includes(id));
          });
        }
      } catch (err) {}
    }

    if (Object.keys(map).length === 0) {
      Object.keys(courseData).forEach(cat => {
        map[cat] = JSON.parse(localStorage.getItem(`completedCourses_${cat}_${user}`) || '[]');
      });
    }

    setCompletedMap(map);
    updateProgress(map, 'liderlik');
  }

  function updateProgress(map: Record<string, string[]>, cat: string) {
    const courses = courseData[cat].courses;
    const done = (map[cat] || []).length;
    setProgressPercent(courses.length > 0 ? Math.round((done / courses.length) * 100) : 0);
  }

  function switchCategory(cat: string) {
    setActiveCategory(cat);
    updateProgress(completedMap, cat);
  }

  function openCourseModal(course: Course) {
    if (course.id === 'liderlik-3') {
      setSpecialMode('INTRO');
      window.scrollTo(0, 0);
      return;
    }
    setActiveCourse(course);
    setModalState('READING');
    setQuizIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setContentPage(0);
  }

  function startQuiz() {
    setModalState('QUIZ');
  }

  function handleOptionSelect(idx: number) {
    setSelectedOpt(idx);
  }

  function nextQuestion() {
    if (!activeCourse || selectedOpt === null) return;
    if (selectedOpt === activeCourse.questions[quizIdx].answer) {
      setScore(prev => prev + 1);
    }
    
    if (quizIdx + 1 < activeCourse.questions.length) {
      setQuizIdx(prev => prev + 1);
      setSelectedOpt(null);
    } else {
      setModalState('RESULT');
    }
  }

  async function markAsCompleted(courseIdOverride?: string) {
    const courseId = courseIdOverride || (activeCourse ? activeCourse.id : null);
    if (!courseId) return;
    const cat = Object.keys(courseData).find(c => courseData[c].courses.some(x => x.id === courseId)) || activeCategory;
    const done = completedMap[cat] || [];

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/api/courses/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ courseId }),
        });
        window.dispatchEvent(new Event('carriera:achievements-refresh'));
      }
    } catch {}

    const newDone = [...done, courseId];
    const user = localStorage.getItem('currentUser') || '';
    localStorage.setItem(`completedCourses_${cat}_${user}`, JSON.stringify(newDone));
    const newMap = { ...completedMap, [cat]: newDone };
    setCompletedMap(newMap);
    updateProgress(newMap, cat);
    
    if (courseIdOverride) {
      setSpecialMode('NONE');
    } else {
      setModalState('CLOSED');
      setActiveCourse(null);
    }
  }

  const filteredCourses = courseData[activeCategory].courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCompleted = Object.values(completedMap).reduce((s, arr) => s + arr.length, 0);
  const totalCourses = Object.values(courseData).reduce((s, cat) => s + cat.courses.length, 0);
  const overallPercent = totalCourses > 0 ? Math.round((totalCompleted / totalCourses) * 100) : 0;

  function getRoleByProgress(p: number) {
    if (p === 0) return { role: '-', message: 'Eğitimleri tamamlayarak kariyer yolculuğuna başla!' };
    if (p < 25) return { role: 'Başlangıç Seviyesi', message: 'Harika bir başlangıç!' };
    if (p < 50) return { role: 'Gelişen Uzman', message: 'İyi ilerliyorsun!' };
    if (p < 75) return { role: 'Kıdemli Uzman', message: 'Yönetici seviyesine yaklaştın!' };
    if (p < 100) return { role: 'Yönetici Adayı', message: 'Son adımdasın!' };
    return { role: 'Yönetici', message: 'Tebrikler! Tüm eğitimleri tamamladın! 🎉' };
  }

  const roleInfo = getRoleByProgress(overallPercent);
  const name = username.split('@')[0];

  const passScore = activeCourse ? Math.ceil(activeCourse.questions.length * 0.6) : 0;
  const isPassed = modalState === 'RESULT' && score >= passScore;

  // --- SPECIAL MODE HANDLERS ---
  function sNextPage() {
    if (specialPage < specialCoursePages.length - 1) {
      setSpecialPage(p => p + 1);
      window.scrollTo(0, 0);
    } else {
      setSpecialMode('QUIZ');
      setQuizIdx(0);
      setSpecialAnswers({});
      window.scrollTo(0, 0);
    }
  }
  function sPrevPage() {
    if (specialPage > 0) {
      setSpecialPage(p => p - 1);
      window.scrollTo(0, 0);
    }
  }
  function sNextQuestion() {
    if (quizIdx < specialQuizQuestions.length - 1) {
      setQuizIdx(q => q + 1);
    } else {
      let s = 0;
      specialQuizQuestions.forEach((q, i) => {
        if (specialAnswers[i] === q.a) s++;
      });
      setScore(s);
      setSpecialMode('RESULT');
    }
  }
  function sPrevQuestion() {
    if (quizIdx > 0) setQuizIdx(q => q - 1);
  }
  const sPassScore = Math.ceil(specialQuizQuestions.length * 0.6); // 12
  const sIsPassed = score >= sPassScore;

  // Render Full Page Mode for liderlik-3
  if (specialMode !== 'NONE') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Poppins', sans-serif", color: '#333' }}>
        <link rel="stylesheet" href="/styles/egitim.css" />
        <div style={{ background: '#fff', padding: '15px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <button onClick={() => setSpecialMode('NONE')} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-arrow-left" style={{ color: '#64748b', fontSize: '1.1rem' }}></i>
            </button>
            <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700, color: '#0f172a' }}>Etkili İletişim ve Motivasyon Teknikleri</h1>
          </div>
          {specialMode === 'READING' && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Sayfa {specialPage + 1} / {specialCoursePages.length}</div>}
          {specialMode === 'QUIZ' && <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Soru {quizIdx + 1} / {specialQuizQuestions.length}</div>}
        </div>

        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
          {specialMode === 'INTRO' && (
            <div style={{ background: '#fff', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ width: 80, height: 80, background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#0284c7', fontSize: '2rem' }}><i className="fa-solid fa-book-open-reader"></i></div>
              <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: '#0f172a' }}>Eğitime Hoş Geldiniz</h2>
              <p style={{ fontSize: '1.1rem', color: '#64748b', lineHeight: 1.6, marginBottom: '30px' }}>
                Bu modülde, profesyonel yaşamda başarının anahtarı olan etkili iletişim becerilerini ve ekip motivasyon dinamiklerini derinlemesine inceleyeceğiz. <br/><br/>
                Modül <strong>5 sayfadan</strong> oluşmaktadır. Tamamladığınızda bilginizi ölçmek üzere <strong>20 soruluk</strong> detaylı bir sınava gireceksiniz. Geçme notu <strong>%60</strong>'tır.
              </p>
              <button onClick={() => {setSpecialMode('READING'); setSpecialPage(0);}} style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 20px rgba(26, 79, 186, 0.3)' }}>
                Modüle Başla <i className="fa-solid fa-arrow-right" style={{ marginLeft: 10 }}></i>
              </button>
            </div>
          )}

          {specialMode === 'READING' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ background: '#fff', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', marginBottom: '30px', minHeight: '400px' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', color: '#1a4fba', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>{specialCoursePages[specialPage].title}</h2>
                <div style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#334155', letterSpacing: '0.2px' }}>{specialCoursePages[specialPage].content}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={sPrevPage} disabled={specialPage === 0} style={{ background: specialPage === 0 ? '#e2e8f0' : '#fff', color: specialPage === 0 ? '#94a3b8' : '#334155', border: 'none', padding: '15px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: specialPage === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}><i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i> Önceki</button>
                <button onClick={sNextPage} style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 20px rgba(26, 79, 186, 0.3)' }}>{specialPage === specialCoursePages.length - 1 ? 'Sınava Başla' : 'Sonraki'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i></button>
              </div>
            </div>
          )}

          {specialMode === 'QUIZ' && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
              <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', marginBottom: '30px' }}>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, marginBottom: 30, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#0284c7', width: `${(quizIdx / specialQuizQuestions.length) * 100}%`, transition: 'width 0.3s' }}></div>
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '30px', color: '#0f172a', lineHeight: 1.5 }}>{specialQuizQuestions[quizIdx].q}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {specialQuizQuestions[quizIdx].opts.map((opt, i) => {
                    const isSelected = specialAnswers[quizIdx] === i;
                    return (
                      <button key={i} onClick={() => setSpecialAnswers({...specialAnswers, [quizIdx]: i})} style={{ padding: '18px 24px', textAlign: 'left', background: isSelected ? '#f0f9ff' : '#fff', border: `2px solid ${isSelected ? '#0ea5e9' : '#e2e8f0'}`, borderRadius: '16px', cursor: 'pointer', fontSize: '1.05rem', color: isSelected ? '#0369a1' : '#334155', display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? '#0ea5e9' : '#f1f5f9', color: isSelected ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15, fontSize: '0.9rem', fontWeight: 600, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</div>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={sPrevQuestion} disabled={quizIdx === 0} style={{ background: quizIdx === 0 ? '#e2e8f0' : '#fff', color: quizIdx === 0 ? '#94a3b8' : '#334155', border: 'none', padding: '15px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: quizIdx === 0 ? 'not-allowed' : 'pointer' }}><i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i> Önceki Soru</button>
                <button onClick={sNextQuestion} disabled={specialAnswers[quizIdx] === undefined} style={{ background: specialAnswers[quizIdx] === undefined ? '#cbd5e1' : '#0284c7', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: specialAnswers[quizIdx] === undefined ? 'not-allowed' : 'pointer' }}>{quizIdx === specialQuizQuestions.length - 1 ? 'Bitir' : 'Sonraki'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i></button>
              </div>
            </div>
          )}

          {specialMode === 'RESULT' && (
            <div style={{ background: '#fff', padding: '60px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', textAlign: 'center', animation: 'fadeInUp 0.5s ease-out' }}>
              <div style={{ width: 120, height: 120, background: sIsPassed ? '#dcfce7' : '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', color: sIsPassed ? '#16a34a' : '#ef4444', fontSize: '3.5rem' }}><i className={`fa-solid ${sIsPassed ? 'fa-trophy' : 'fa-triangle-exclamation'}`}></i></div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#0f172a' }}>{sIsPassed ? 'Tebrikler!' : 'Üzgünüz, Başarısız.'}</h2>
              <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '30px' }}>20 sorudan <strong>{score}</strong> doğrunuz var. Puanınız: <strong style={{ color: sIsPassed ? '#16a34a' : '#ef4444' }}>{score * 5} / 100</strong></p>
              {sIsPassed ? (
                <button onClick={() => markAsCompleted('liderlik-3')} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '18px 50px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 25px rgba(22, 163, 74, 0.4)' }}>Eğitimi Tamamla <i className="fa-solid fa-check-double" style={{ marginLeft: 10 }}></i></button>
              ) : (
                <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
                  <button onClick={() => setSpecialMode('NONE')} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '15px 30px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}>Çıkış Yap</button>
                  <button onClick={() => { setSpecialMode('READING'); setSpecialPage(0); }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}>Modülü Baştan Al <i className="fa-solid fa-rotate-right" style={{ marginLeft: 10 }}></i></button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STANDARD VIEW
  return (
    <>
      <link rel="stylesheet" href="/styles/egitim.css" />
      <UserSidebar />
      <div className="main-content">
        <TopHeader />
        <div className="header-section">
          <div className="welcome-text">
            <h1 style={{ color: 'var(--text-color)' }}>Eğitim ve Öneriler</h1>
            <h2 id="welcome-message">
              {overallPercent === 100 ? `Tebrikler ${name}! Tüm Eğitimleri Tamamladın!` :
               overallPercent > 0 ? `Hoşgeldin, ${name}! %${overallPercent} İlerleme` :
               `Hoşgeldin, ${name}! Kariyer Yolculuğuna Başla!`}
            </h2>
            <p>Mevcut Rolün: <span style={{ color: '#1a4fba', fontWeight: 600 }}>{roleInfo.role}</span>. <span>{roleInfo.message}</span></p>
            <div className="filter-section" style={{ marginTop: 20 }}>
              <div className="filter-title">Öncelikli Gelişim Alanları</div>
              <div className="tags">
                {Object.entries(courseData).map(([cat, data]) => {
                  const done = (completedMap[cat] || []).length;
                  const total = data.courses.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={cat} className={`tag${activeCategory === cat ? ' active' : ''}`} onClick={() => switchCategory(cat)}>
                      {data.name} <span className="tag-progress" style={{ color: pct === 100 ? '#4CAF50' : pct > 0 ? '#FFC107' : '#fff' }}>%{pct}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="search-bar">
              <input type="text" placeholder="Eğitimlerde ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-circle" id="progress-circle" style={{ background: `conic-gradient(#1a4fba ${progressPercent}%, #e0e0e0 0)` }}>
              <span id="progress-percent">%{progressPercent}</span>
            </div>
            <div className="progress-label">{courseData[activeCategory].name}</div>
          </div>
        </div>
        
        {/* ── YZ Öneri Bölümü ── */}
        {(recsLoading || recommendations.length > 0) && (
          <div style={{ marginBottom: 32, background: 'linear-gradient(135deg, #1a4fba08 0%, #8b5cf608 100%)', border: '1px solid #1a4fba20', borderRadius: 20, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #1a4fba, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-brain" style={{ color: '#fff', fontSize: '1rem' }}></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1a4fba' }}>YZ Tarafından Senin İçin Seçildi</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Profilin, KPI puanların ve CV analizine göre kişiselleştirildi</p>
              </div>
            </div>

            {recsLoading ? (
              <div style={{ display: 'flex', gap: 16 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ flex: 1, height: 100, background: '#e5e7eb', borderRadius: 14, animation: 'pulse 1.5s infinite' }}></div>
                ))}
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {recommendations.map((rec, i) => {
                  const catColors: Record<string, string> = { liderlik: '#4fc3f7', stratejik: '#66BB6A', butce: '#FFB74D', cevik: '#9C27B0' };
                  const catIcons: Record<string, string> = { liderlik: 'fa-people-group', stratejik: 'fa-chess', butce: 'fa-calculator', cevik: 'fa-rotate' };
                  const catNames: Record<string, string> = { liderlik: 'Liderlik', stratejik: 'Stratejik', butce: 'Bütçe', cevik: 'Çeviklik' };
                  const color = catColors[rec.category] || '#1a4fba';
                  const rankBadge = ['🥇', '🥈', '🥉'][i] || '';

                  return (
                    <div
                      key={rec.courseId}
                      onClick={() => { switchCategory(rec.category); }}
                      style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', cursor: 'pointer', border: `2px solid ${color}30`, transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${color}30`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
                    >
                      {/* Renk şeridi */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: color, borderRadius: '14px 14px 0 0' }}></div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`fa-solid ${catIcons[rec.category] || 'fa-book'}`} style={{ color, fontSize: '1rem' }}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.7rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                            {rankBadge} {catNames[rec.category]}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1f2937', lineHeight: 1.3, marginBottom: 8 }}>
                            {rec.title}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${color}15`, color, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600 }}>
                            <i className="fa-solid fa-lightbulb" style={{ fontSize: '0.65rem' }}></i>
                            {rec.reason}
                          </div>
                          {(rec.allReasons?.length || 0) > 1 && (
                            <div style={{ marginTop: 7, fontSize: '0.68rem', lineHeight: 1.45, color: '#6b7280' }}>
                              <strong>Neden önerildi:</strong> {rec.allReasons?.slice(1).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                          Öneri puanı: {rec.score} · Kategoriye git <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.65rem' }}></i>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="cards-grid">
          {filteredCourses.map(course => {
            const isCompleted = (completedMap[activeCategory] || []).includes(course.id);
            return (
              <div key={course.id} className={`course-card${isCompleted ? ' course-completed' : ''}`}>
                <div className="card-header" style={{ backgroundColor: course.color }}>
                  <i className={`fa-solid ${course.icon} card-icon`}></i>
                </div>
                <div className="card-body">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-details">
                    <div className="detail-item"><i className="fa-regular fa-clock"></i> {course.duration}</div>
                    <div className="detail-item"><i className="fa-solid fa-star" style={{ color: '#fbc02d' }}></i> {course.rating} Puan</div>
                  </div>
                  <div className="course-details" style={{ justifyContent: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Eğitmen: {course.instructor}</span>
                  </div>
                  <p className="course-desc">{course.description}</p>
                  <button className={`btn-start${isCompleted ? ' completed' : ''}`} onClick={() => openCourseModal(course)} disabled={isCompleted}>
                    {isCompleted ? 'TAMAMLANDI ✓' : 'EĞİTİME BAŞLA'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Eğitim / Sınav Modalı (Standart) */}
      {modalState !== 'CLOSED' && activeCourse && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', width: '90%', maxWidth: '700px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ background: activeCourse.color, padding: '20px 30px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <i className={`fa-solid ${activeCourse.icon}`} style={{ fontSize: '1.5rem' }}></i>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{activeCourse.title}</h2>
              </div>
              <button onClick={() => setModalState('CLOSED')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '30px', overflowY: 'auto', flex: 1, color: '#333' }}>
              
              {modalState === 'READING' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                  <h3 style={{ marginBottom: '15px', color: '#1a4fba' }}>
                    {activeCourse.pages && activeCourse.pages.length > 0
                      ? activeCourse.pages[contentPage].title
                      : 'Eğitim İçeriği'}
                  </h3>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', lineHeight: '1.7', fontSize: '1.05rem', borderLeft: `4px solid ${activeCourse.color}` }}>
                    {activeCourse.pages && activeCourse.pages.length > 0
                      ? activeCourse.pages[contentPage].content
                      : activeCourse.content}
                  </div>

                  {/* Sayfa navigasyonu */}
                  {activeCourse.pages && activeCourse.pages.length > 1 && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        onClick={() => setContentPage(p => p - 1)}
                        disabled={contentPage === 0}
                        style={{ background: contentPage === 0 ? '#e5e7eb' : '#f1f5f9', color: contentPage === 0 ? '#9ca3af' : '#374151', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: contentPage === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                      >
                        <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i> Önceki
                      </button>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>
                        Sayfa {contentPage + 1} / {activeCourse.pages.length}
                      </span>
                      {contentPage < activeCourse.pages.length - 1 ? (
                        <button
                          onClick={() => setContentPage(p => p + 1)}
                          style={{ background: activeCourse.color, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Sonraki <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }}></i>
                        </button>
                      ) : (
                        <button
                          onClick={startQuiz}
                          style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Teste Geç <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }}></i>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tek sayfalı kurslar için eski buton */}
                  {(!activeCourse.pages || activeCourse.pages.length <= 1) && (
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                      <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.9rem' }}>Eğitim içeriğini okuduysanız bilginizi ölçmek için teste geçebilirsiniz.</p>
                      <button onClick={startQuiz} style={{ background: '#1a4fba', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                        Testi Başlat <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {modalState === 'QUIZ' && (
                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: '20px', fontWeight: 600 }}>
                    <span>Soru {quizIdx + 1} / {activeCourse.questions.length}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{activeCourse.questions[quizIdx].question}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeCourse.questions[quizIdx].options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleOptionSelect(i)}
                        style={{ 
                          padding: '15px 20px', textAlign: 'left', background: selectedOpt === i ? '#e0f2fe' : '#fff', 
                          border: `2px solid ${selectedOpt === i ? '#0284c7' : '#e5e7eb'}`, borderRadius: '10px', 
                          cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s', fontWeight: selectedOpt === i ? 600 : 400, color: '#333'
                        }}
                      >
                        <span style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', background: selectedOpt === i ? '#0284c7' : '#f3f4f6', color: selectedOpt === i ? '#fff' : '#666', textAlign: 'center', lineHeight: '24px', marginRight: '10px', fontSize: '0.85rem' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '30px', textAlign: 'right' }}>
                    <button 
                      onClick={nextQuestion} 
                      disabled={selectedOpt === null}
                      style={{ background: selectedOpt === null ? '#cbd5e1' : '#1a4fba', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: selectedOpt === null ? 'not-allowed' : 'pointer' }}
                    >
                      {quizIdx + 1 === activeCourse.questions.length ? 'Testi Bitir' : 'Sıradaki Soru'} <i className="fa-solid fa-chevron-right" style={{ marginLeft: '8px' }}></i>
                    </button>
                  </div>
                </div>
              )}

              {modalState === 'RESULT' && (
                <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in-out', padding: '20px 0' }}>
                  <div style={{ fontSize: '4rem', color: isPassed ? '#4CAF50' : '#f44336', marginBottom: '15px' }}>
                    <i className={`fa-solid ${isPassed ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                  </div>
                  <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '10px' }}>
                    {isPassed ? 'Tebrikler, Başarılı!' : 'Maalesef Başarısız Oldunuz'}
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
                    Toplam {activeCourse.questions.length} sorudan <strong style={{ color: '#333', fontSize: '1.3rem' }}>{score}</strong> doğrunuz var.
                    Geçmek için en az %60 başarı ({passScore} doğru) gerekiyordu.
                  </p>
                  
                  {isPassed ? (
                    <button onClick={() => markAsCompleted()} style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)' }}>
                      Eğitimi Tamamla
                    </button>
                  ) : (
                    <button onClick={() => openCourseModal(activeCourse)} style={{ background: '#f44336', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(244, 67, 54, 0.4)' }}>
                      <i className="fa-solid fa-rotate-left" style={{ marginRight: '8px' }}></i> Modülü Baştan Al
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
