# Carriera Stand Kurulumu — Başlangıç

En kolay yöntem: proje kökündeki `STAND_KURULUMU_AC.cmd` dosyasına sağ tıklayıp **Yönetici olarak çalıştır** demek. Bu açıcı hata olsa bile CMD penceresini açık bırakır. Ardından çalıştırdığı script PostgreSQL parolasını bir kez sorar, tüm kurulumu ve servisleri otomatik başlatır.

Script hata verirse veya kurulumun hangi aşamada olduğunu görmek istersen aşağıdaki dosyaları numara sırasıyla uygula. Bir adım tamamlanmadan sonraki adıma geçme.

## Sıra

1. [01-ONKOSULLAR.md](01-ONKOSULLAR.md) — Bilgisayarda bulunması gereken programlar
2. [02-ORTAM-DEGISKENLERI.md](02-ORTAM-DEGISKENLERI.md) — Gizli ayarlar ve `.env` dosyaları
3. [03-VERITABANI.md](03-VERITABANI.md) — PostgreSQL, Prisma ve demo verisi
4. [04-BACKEND.md](04-BACKEND.md) — Express API’yi çalıştırma
5. [05-FRONTEND.md](05-FRONTEND.md) — Production arayüzü çalıştırma
6. [06-YAPAY_ZEKA.md](06-YAPAY_ZEKA.md) — Python YZ servisi
7. [07-STAND-DEMO.md](07-STAND-DEMO.md) — Hazır hesaplar ve demo akışı
8. [08-SORUN-GIDERME.md](08-SORUN-GIDERME.md) — Yaygın hata çözümleri

## Önemli güvenlik notu

`backend/.env` ve `frontend-next/.env.local` kişiye özeldir. Bu iki dosyayı GitHub’a ekleme, WhatsApp grubuna atma veya sunum dosyasına koyma. Örnek şablonlar repoda zaten bulunur.

Kurulum sonunda açık olması gereken adresler:

- Arayüz: `http://localhost:3000`
- Backend: `http://localhost:5000/api/test`
- Python YZ dokümantasyonu: `http://localhost:8000/docs`
