@echo off
echo ===================================================
echo CARRIERA STAND DEMO SISTEMI BASLATILIYOR
echo ===================================================

echo [1/3] Python Yapay Zeka Servisi Baslatiliyor...
start cmd /k "cd /d %~dp0ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"

echo [2/3] Node.js Backend Servisi Baslatiliyor...
start cmd /k "cd /d %~dp0backend && npm start"

echo [3/3] Production Frontend Arayuzu Baslatiliyor...
echo Not: Ilk calistirmadan once frontend-next klasorunde npm run build calistirilmalidir.
start cmd /k "cd /d %~dp0frontend-next && npm start -- -p 3000"

echo Tum servisler baslatildi!
echo Tarayicinizda http://localhost:3000 adresine gidebilirsiniz.
echo ===================================================
pause
