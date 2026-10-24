@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Carriera Stand Kurulumu

REM Bu dosyayi proje kokunden "Yonetici olarak calistir" ile acin.
REM Ilk kurulumda PostgreSQL parolasi sorulur; diger her sey otomatik ilerler.

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo ==========================================================
echo        CARRIERA - STAND KURULUM VE BASLATMA ARACI
echo ==========================================================
echo.
echo Bu islem demo veritabanini olusturur ve demo verisini yukler.
echo Gerekli: Node.js, PostgreSQL ve Python kurulu olmali.
echo Takildiginiz yerde kurulum\08-SORUN-GIDERME.md dosyasini acin.
echo.

where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_node
set "PSQL="
for /f "delims=" %%P in ('where psql 2^>nul') do if not defined PSQL set "PSQL=%%P"
if not defined PSQL (
  for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "$candidate = Get-ChildItem 'C:\Program Files\PostgreSQL' -Filter psql.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName; if ($candidate) { $candidate }"`) do set "PSQL=%%P"
)
if not defined PSQL goto :missing_postgres
set "PYTHON_EXE="
set "PYTHON_VERSION_ARG="
for /f "delims=" %%P in ('where py 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
if defined PYTHON_EXE set "PYTHON_VERSION_ARG=-3"
if not defined PYTHON_EXE (
  for /f "delims=" %%P in ('where python 2^>nul') do if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
)
if not defined PYTHON_EXE goto :missing_python

set "DB_NAME=carriera_db"
set "DB_USER=postgres"
echo.
echo PostgreSQL bilgisi isteniyor:
echo - Kullanici adi varsayilan olarak postgres olur.
echo - Parola, PostgreSQL kurarken belirlediginiz paroladir.
echo - Unuttuysaniz: kurulum\08-SORUN-GIDERME.md icindeki "PostgreSQL parolasi" bolumune bakin.
set /p "DB_USER=PostgreSQL kullanici adi [postgres]: "
if "%DB_USER%"=="" set "DB_USER=postgres"
set /p "CARRIERA_DB_PASSWORD=PostgreSQL parolasi: "
if "%CARRIERA_DB_PASSWORD%"=="" goto :missing_password
set "PGPASSWORD=%CARRIERA_DB_PASSWORD%"

echo.
echo [1/8] PostgreSQL baglantisi kontrol ediliyor...
"%PSQL%" -h localhost -U "%DB_USER%" -d postgres -c "SELECT 1" >nul 2>&1 || goto :db_connection_failed

echo [2/8] Veritabani kontrol ediliyor...
"%PSQL%" -h localhost -U "%DB_USER%" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%'" | findstr /r /c:"1" >nul
if errorlevel 1 (
  echo carriera_db olusturuluyor...
  "%PSQL%" -h localhost -U "%DB_USER%" -d postgres -c "CREATE DATABASE %DB_NAME%" || goto :db_create_failed
) else (
  echo carriera_db zaten mevcut.
)

echo [3/8] Backend ortam dosyasi hazirlaniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=$env:ROOT; $password=$env:CARRIERA_DB_PASSWORD; $dbUser=$env:DB_USER; $template=Get-Content (Join-Path $root 'backend\.env.example') -Raw; $template=$template.Replace('POSTGRES_PAROLASI',$password).Replace('postgresql://postgres:',$('postgresql://'+$dbUser+':')); Set-Content -Path (Join-Path $root 'backend\.env') -Value $template -Encoding UTF8"
if errorlevel 1 goto :env_failed
copy /Y "frontend-next\.env.example" "frontend-next\.env.local" >nul

echo [4/8] Backend paketleri yukleniyor...
pushd backend
call npm install || goto :npm_failed
echo [5/8] Prisma semasi uygulanuyor...
call npx prisma db push || goto :prisma_failed
echo [6/8] Stand demo verileri yukleniyor...
echo UYARI: carriera_db icindeki mevcut veriler seed tarafindan silinir.
call npm run seed || goto :seed_failed
popd

echo [7/8] Frontend paketleri ve production build hazirlaniyor...
pushd frontend-next
call npm install || goto :npm_failed
call npm run build || goto :frontend_build_failed
popd

echo [8/8] Python YZ ortami hazirlaniyor...
pushd ai-service
if not exist ".venv\Scripts\python.exe" "%PYTHON_EXE%" %PYTHON_VERSION_ARG% -m venv .venv || goto :python_env_failed
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt || goto :python_packages_failed
popd

echo.
echo ==========================================================
echo Kurulum tamamlandi. Servisler ayri pencerelerde baslatiliyor.
echo Kullanici: stand.kullanici / Carriera2026!
echo Yonetici: stand.yonetici / Carriera2026!
echo Arayuz: http://localhost:3000
echo ==========================================================

start "Carriera Backend" cmd /k "cd /d \"%ROOT%backend\" && npm start"
start "Carriera YZ" cmd /k "cd /d \"%ROOT%ai-service\" && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000"
start "Carriera Frontend" cmd /k "cd /d \"%ROOT%frontend-next\" && npm start -- -p 3000"

echo Servislerin acilmasi icin 10-20 saniye bekleyin, sonra tarayicida http://localhost:3000 acin.
pause
exit /b 0

:missing_node
echo.
echo HATA: Node.js bulunamadi.
echo Ne yapmali: https://nodejs.org adresinden LTS surumunu indirip kurun.
echo Kurulum sonrasi bu pencereyi kapatip STAND_KURULUMU_AC.cmd dosyasini yeniden calistirin.
goto :end
:missing_postgres
echo.
echo HATA: PostgreSQL / psql bulunamadi.
echo Ne yapmali: https://www.postgresql.org/download/windows/ adresinden PostgreSQL 16+ kurun.
echo Kurulumda parolayi not edin; Port olarak varsayilan 5432 kalsin.
echo Kurulum sonrasi bu pencereyi kapatip STAND_KURULUMU_AC.cmd dosyasini yeniden calistirin.
goto :end
:missing_python
echo.
echo HATA: Python bulunamadi.
echo Ne yapmali: https://www.python.org/downloads/ adresinden Python 3.11+ kurun.
echo Kurulum ekraninda "Add Python to PATH" kutusunu mutlaka isaretleyin.
echo Kurulum sonrasi bu pencereyi kapatip STAND_KURULUMU_AC.cmd dosyasini yeniden calistirin.
goto :end
:missing_password
echo.
echo HATA: PostgreSQL parolasi bos birakilamaz.
echo Bu parola Windows parolasi degil, PostgreSQL kurulurken olusturdugunuz paroladir.
echo Unuttuysaniz kurulum\08-SORUN-GIDERME.md dosyasindaki "PostgreSQL parolasi" bolumunu takip edin.
goto :end
:db_connection_failed
echo.
echo HATA: PostgreSQL'e baglanilamadi.
echo Olasiliklar:
echo  1. Kullanici adi veya parola yanlis girildi.
echo  2. PostgreSQL servisi calismiyor. Windows aramada "Hizmetler" yazip postgresql-x64-* servisini Baslat'in.
echo  3. Kurulumda varsayilan olmayan bir port secildi. Ayrintilar icin kurulum\08-SORUN-GIDERME.md dosyasina bakin.
goto :end
:db_create_failed
echo.
echo HATA: carriera_db olusturulamadi.
echo PostgreSQL kullanicisinin veritabani olusturma yetkisini ve onceki hata satirlarini kontrol edin.
goto :end
:env_failed
echo.
echo HATA: .env dosyalari olusturulamadi.
echo Proje klasorunu Masaustu gibi yazma izni olan bir yerde tuttugunuzdan emin olun.
goto :end
:npm_failed
echo.
echo HATA: npm paket kurulumu basarisiz.
echo Internet baglantisini kontrol edin. Sorun surerse Node.js LTS surumunu yeniden kurun.
goto :end
:prisma_failed
echo.
echo HATA: Prisma semasi uygulanamadi.
echo Genellikle PostgreSQL baglantisi veya parola kaynaklidir. Yukaridaki hata satirlarini kontrol edin.
goto :end
:seed_failed
echo.
echo HATA: Demo verisi yuklenemedi.
echo Veritabani olusturulmus olabilir; yukaridaki hata satirini kurulum\08-SORUN-GIDERME.md ile karsilastirin.
goto :end
:frontend_build_failed
echo.
echo HATA: Frontend production build basarisiz.
echo Node.js LTS kullandiginizdan ve internet baglantisinin aktif oldugundan emin olun.
goto :end
:python_env_failed
echo.
echo HATA: Python sanal ortami olusturulamadi.
echo Python 3.11+ kurulu olmali ve kurulumda "Add Python to PATH" secenegi secilmelidir.
goto :end
:python_packages_failed
echo.
echo HATA: Python paketleri yuklenemedi.
echo Internet baglantisini kontrol edin; sonra scripti tekrar calistirin.
goto :end
:end
echo.
pause
exit /b 1
