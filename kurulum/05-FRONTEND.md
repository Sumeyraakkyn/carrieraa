# 5. Frontend — stand için production mod

Yeni bir PowerShell penceresi aç:

```powershell
cd carriera-main/frontend-next
npm install
npm run build
npm start -- -p 3000
```

Tarayıcıdan `http://localhost:3000` adresini aç.

> Standta `npm run dev` kullanma. Bu mod dosyaları izler, ekranda yeniden build/refesh hissi oluşturur. `npm run build` + `npm start` stabil production modudur.

Bu terminali kapatma. Sonraki adım: [06-YAPAY_ZEKA.md](06-YAPAY_ZEKA.md)
