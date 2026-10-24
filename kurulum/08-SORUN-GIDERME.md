# 8. Sorun giderme

## `PostgreSQL / psql bulunamadı` diyorsa

1. [PostgreSQL Windows indirme sayfasını](https://www.postgresql.org/download/windows/) aç ve PostgreSQL 16 veya daha yeni bir sürümü kur.
2. Kurulumda **port** alanını `5432` olarak bırak.
3. `postgres` kullanıcısı için belirlediğin parolayı güvenli bir yere not et; kurulum aracı bu parolayı sorar.
4. Kurulum bitince açık CMD pencerelerini kapatıp `STAND_KURULUMU_AC.cmd` dosyasını yeniden çalıştır.

Kurulu olduğu halde bu hata devam ederse bilgisayarı yeniden başlatmak yerine önce yeni bir CMD penceresi açıp şunu çalıştır:

```powershell
where.exe psql
```

Komut bir yol döndürmüyorsa PostgreSQL'in `bin` klasörü PATH değişkenine eklenmemiştir. Kurulum aracımız bunu yaygın kurulum klasörlerinde otomatik arar; bulunamazsa PostgreSQL'i tekrar kurmak en pratik çözümdür.

## PostgreSQL parolasını unuttuysan

Bu parola Windows oturum parolası değildir. PostgreSQL kurulurken `postgres` kullanıcısı için belirlenir. Parolayı bilmiyorsan:

1. Windows aramasından **Hizmetler** uygulamasını aç.
2. `postgresql-x64-...` hizmetinin çalıştığını doğrula.
3. Parola sıfırlama için proje klasöründeki bir geliştiriciden yardım iste veya PostgreSQL kurulumunu kaldırıp yeniden kurarak yeni bir parola belirle.

Stand kurulumu için rastgele bir parola denemek yerine doğru parolayı bulmak gerekir; aksi durumda veritabanına bağlanılamaz.

## `PostgreSQL'e bağlanılamadı` diyorsa

- Kullanıcı adı çoğu kurulumda `postgres` olur.
- PostgreSQL parolasını doğru girdiğinden emin ol.
- Windows aramasında **Hizmetler** yaz, `postgresql-x64-...` hizmetini bul ve çalışmıyorsa **Başlat** seçeneğine bas.
- PostgreSQL'i özel bir portla kurduysan varsayılan `5432` yerine o portu kullanacak şekilde `backend/.env` dosyasındaki `DATABASE_URL` değerini güncelle.

## Backend `Veritabanına bağlanılamadı` diyorsa

PostgreSQL servisinin açık olduğunu ve `backend/.env` içindeki `DATABASE_URL` değerini kontrol et. Ardından backend içinde:

```powershell
npx prisma db push
```

## `P1001` Prisma hatası

PostgreSQL portu veya parola yanlıştır. `DATABASE_URL` içindeki host, port, kullanıcı adı ve parolayı kontrol et.

## Frontend API'ye ulaşamıyorsa

Backend açık olmalı ve `frontend-next/.env.local` içeriği aşağıdaki gibi olmalı:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Bu değeri değiştirdiysen frontendde yeniden `npm run build` çalıştır.

## Sayfa sürekli build/refresh oluyorsa

Frontend terminalini kapatıp aşağıdaki iki komutla production modda başlat:

```powershell
npm run build
npm start -- -p 3000
```

## Şifre sıfırlama e-postası gelmiyorsa

- Stand demo için e-posta zorunlu değildir; bu adımı atlayıp uygulamanın diğer akışlarını gösterebilirsin.
- Brevo SMTP login ve SMTP key değerlerini kontrol et.
- `EMAIL_FROM` adresinin Brevo’da sender olarak doğrulandığından emin ol.
- Kod 3 dakika geçerlidir; süresi geçtiyse yeniden kod iste.

## Port doluysa

Aynı portta eski bir servis açık olabilir. Açık terminaldeki eski backend/frontend sürecini `Ctrl + C` ile kapatıp tekrar başlat.

Hangi uygulamanın portu kullandığını görmek için:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :8000
```

Çıkan satırdaki en sağdaki PID değerini Görev Yöneticisi'nin **Ayrıntılar** sekmesinde bulup yalnızca eski Carriera sürecini kapat.
