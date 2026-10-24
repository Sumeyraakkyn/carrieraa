# 6. Python yapay zeka servisi

YZ önerileri ve admin metrikleri için üçüncü bir PowerShell penceresi aç:

```powershell
cd carriera-main/ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Kontrol adresi:

```text
http://localhost:8000/docs
```

Bu servis açılmazsa ana uygulama büyük ölçüde çalışır; fakat Python YZ metrik/öneri ekranları eksik kalabilir.

Sonraki adım: [07-STAND-DEMO.md](07-STAND-DEMO.md)
