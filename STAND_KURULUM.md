# Carriera — Stand Bilgisayarı Kurulum Rehberi

> Bu tek sayfalık rehber yerini daha düzenli numaralı akışa bıraktı. Başlangıç noktası: [kurulum/00-BASLA.md](kurulum/00-BASLA.md)

## 1. Gerekli programlar

- Node.js 20 veya üstü
- PostgreSQL 15 veya üstü
- Python 3.11+ (YZ ekranları için önerilir)
- Git

## 2. Depoyu indir

```powershell
git clone <GITHUB_REPO_URL> carriera-main
cd carriera-main
```

## 3. PostgreSQL veritabanını oluştur

PostgreSQL terminalinde veya pgAdmin'de:

```sql
CREATE DATABASE carriera_db;
```

`backend/.env.example` dosyasını `backend/.env` olarak kopyala. En az aşağıdaki alanları kendi bilgisayarına göre düzenle:

```env
DATABASE_URL="postgresql://postgres:SIFREN@localhost:5432/carriera_db?schema=public"
JWT_SECRET="uzun-rastgele-bir-gizli-anahtar"
ADMIN_SETUP_KEY="sadece-stand-ekibinin-bilecegi-kod"
```

Mail demo edilecekse Brevo SMTP alanlarını da gir. SMTP anahtarını asla GitHub'a ekleme.

## 4. Backend ve demo verisi

```powershell
cd backend
npm install
npx prisma db push
npm run seed
npm start
```

> `seed_mock_data.js` mevcut veritabanı kayıtlarını siler ve 100 demo çalışan üretir. Stand veritabanında çalıştır; gerçek veri bulunan ortamda çalıştırma.

Backend kontrolü: `http://localhost:5000/api/test`

## 5. Frontend (production mod — sürekli refresh/build olmaz)

Yeni bir terminal aç:

```powershell
cd carriera-main/frontend-next
Copy-Item .env.example .env.local
npm install
npm run build
npm start -- -p 3000
```

Tarayıcıdan `http://localhost:3000` aç.

> Geliştirme için `npm run dev` kullanılabilir; standta kullanmayın. Next.js dosya izlediği için yeniden build/refresh hissi oluşturur.

## 6. Python YZ servisi (önerilir)

Yeni bir terminal aç:

```powershell
cd carriera-main/ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Kontrol: `http://localhost:8000/docs`

## Stand demo hesapları

Demo verisi eklendiyse hazır hesaplar:

- Kullanıcı: `stand.kullanici` / `Carriera2026!`
- Yönetici: `stand.yonetici` / `Carriera2026!`

Bu hesaplar yalnızca seed ile oluşturulan yerel demo veritabanı içindir. Standtan önce istenirse şifreleri değiştirilebilir.

## Sorun çözme

| Belirti | Çözüm |
| --- | --- |
| `Veritabanına bağlanılamadı` | PostgreSQL servisinin çalıştığını ve `DATABASE_URL` içindeki parola/portu kontrol et. |
| `P1001` veya Prisma hatası | `npx prisma db push` komutunu backend içinde yeniden çalıştır. |
| Frontend API'ye ulaşamıyor | Backend'in `:5000` üzerinde açık olduğunu ve `frontend-next/.env.local` içindeki `NEXT_PUBLIC_API_URL=http://localhost:5000` değerini kontrol et. |
| YZ metriği boş | Python servisini `:8000` üzerinde başlat. |
| Şifre sıfırlama maili gelmiyor | Brevo sender doğrulamasını, SMTP login ve anahtarını `backend/.env` içinde kontrol et. |
| Sayfa devamlı build/refresh oluyor | `npm run dev` yerine frontendde `npm run build` + `npm start -- -p 3000` kullan. |

## GitHub öncesi kontrol

```powershell
git status
git check-ignore backend/.env frontend-next/.env.local
```

Bu iki env dosyasının ignore edildiğini doğrula. Anahtar veya parola içeren dosyaları commit/push etme.
