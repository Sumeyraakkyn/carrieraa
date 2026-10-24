# Carriera — Yapay Zeka Destekli Kariyer Gelişim Platformu

Carriera; çalışanların CV, yetkinlik, eğitim ve performans verilerini bir araya getirerek kişiselleştirilmiş gelişim önerileri üreten; kullanıcı ve yönetici panellerine sahip bir web platformudur.

Bu depo **frontend + backend + PostgreSQL + isteğe bağlı Python YZ servisi** içerir. Stand kurulumu için numara sıralı yönergeler [kurulum/00-BASLA.md](kurulum/00-BASLA.md) dosyasındadır.

## Öne çıkan özellikler

- Kullanıcı ve yönetici rolleri, JWT ile oturum yönetimi
- Zorunlu e-posta kaydı ve 3 dakikalık doğrulama kodlu şifre sıfırlama
- PDF/DOCX CV yükleme, metin çıkarma, sertifika/dil/yetkinlik tespiti
- Yetkinlik boşluğu, eğitim ve kariyer önerileri
- Yönetici tarafında CV inceleme, değerlendirme, gelişim ve YZ analitik ekranları
- Eğitim ilerlemesi, CP/XP, başarımlar ve canlı liderlik tablosu
- PostgreSQL veri kalıcılığı, Socket.io bildirim altyapısı ve dark mode

## Mimari

```text
Next.js 16 (frontend-next, :3000)
            │ REST / Socket.io
Express + Prisma (backend, :5000) ─── PostgreSQL
            │
FastAPI + scikit-learn (ai-service, :8000) [önerilir]
```

## Hızlı stand kurulumu

1. `kurulum/00-BASLA.md` dosyasındaki adımları sırayla uygula.
2. `backend/.env.example` dosyasını `backend/.env` olarak kopyalayıp PostgreSQL, JWT ve yönetici kurulum ayarlarını gir.
3. `frontend-next/.env.example` dosyasını `frontend-next/.env.local` olarak kopyala.
4. Veritabanını oluştur, şemayı uygula ve istersen demo verisi ekle.
5. Frontendi production build ile başlat: `npm run build` ardından `npm start -- -p 3000`.

Windows stand bilgisayarında en hızlı seçenek: proje kökündeki `STAND_KURULUMU_AC.cmd` dosyasına sağ tıklayıp **Yönetici olarak çalıştır** demektir. Bu dosya hata olsa bile CMD ekranını kapatmaz. Script PostgreSQL parolasını bir kez ister; veritabanı, demo veri, bağımlılıklar ve servisleri otomatik hazırlar.

> `backend/.env` ve `frontend-next/.env.local` GitHub'a gönderilmez. Stand ekibinin kullanacağı Brevo ayarı `backend/.env.example` içinde hazırdır; bu nedenle GitHub deposunu **private** tut.

## Doğrulama

Kurulumdan sonra şu adresler çalışmalıdır:

- Arayüz: `http://localhost:3000`
- Backend sağlık kontrolü: `http://localhost:5000/api/test`
- YZ servis dokümantasyonu: `http://localhost:8000/docs`

## TÜBİTAK stand demo akışı

1. Kullanıcı hesabı ile giriş yap veya kaydol.
2. CV yükle ve analiz sonucunu göster.
3. Yetkinlik analizi ve eğitim önerisine geç.
4. Bir eğitimi tamamlayıp CP/XP ve başarı bildirimini göster.
5. Yönetici hesabıyla CV inceleme ve kullanıcı değerlendirmesi ekranını aç.
6. YZ analitik ekranındaki metrikleri göster.

