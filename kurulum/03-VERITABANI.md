# 3. PostgreSQL ve demo verisi

## Veritabanını oluştur

pgAdmin veya PostgreSQL terminalinde:

```sql
CREATE DATABASE carriera_db;
```

## Prisma şemasını uygula

```powershell
cd backend
npm install
npx prisma db push
```

## Stand demo verisini ekle

```powershell
npm run seed
```

> Uyarı: Bu komut `carriera_db` içindeki mevcut platform verilerini siler; ardından 100 mock çalışan ve iki sabit stand hesabı oluşturur. Sadece boş stand veritabanında çalıştır.

Sonraki adım: [04-BACKEND.md](04-BACKEND.md)
