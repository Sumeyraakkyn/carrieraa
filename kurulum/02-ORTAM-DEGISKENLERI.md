# 2. Ortam değişkenleri

Bu adımda gizli ayar dosyaları oluşturulur. Örnek dosyalar repoda var; gerçek değerler GitHub’da yoktur.

## Backend `.env`

```powershell
Copy-Item backend/.env.example backend/.env
```

`backend/.env` içinde şu değerleri düzenle:

```env
DATABASE_URL="postgresql://postgres:POSTGRES_PAROLASI@localhost:5432/carriera_db?schema=public"
JWT_SECRET="uzun-rastgele-bir-gizli-anahtar"
ADMIN_SETUP_KEY="stand-ekibinin-bilecegi-uzun-kod"
```

Brevo SMTP satırları örnek env dosyasında stand için hazır gelir. E-posta sıfırlama akışını göstermek isteniyorsa bu satırları değiştirmeden bırak.

> Bu repoda Brevo SMTP anahtarı bulunduğu için GitHub deposunu **private** tut. Herkese açık bir repoya veya farklı bir kişiye gönderilecekse önce SMTP anahtarını Brevo panelinden yenile.

## Frontend `.env.local`

```powershell
Copy-Item frontend-next/.env.example frontend-next/.env.local
```

Yerel stand bilgisayarında dosya içeriği şu olmalı:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Sonraki adım: [03-VERITABANI.md](03-VERITABANI.md)
