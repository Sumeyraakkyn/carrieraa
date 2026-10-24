import pandas as pd
import json
import joblib
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.preprocessing import MultiLabelBinarizer, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import os

print("1. Veri seti yükleniyor (dataset.json)...")
dataset_path = "dataset.json"
if not os.path.exists(dataset_path):
    print("Hata: dataset.json bulunamadı. Lütfen önce Node.js üzerinden veriyi dışa aktarın.")
    exit(1)

with open(dataset_path, "r", encoding="utf-8") as f:
    data = json.load(f)

df = pd.DataFrame(data)

print(f"Toplam {len(df)} kayıt okundu. Modeller eğitiliyor...")

# Özellikler (Features) ve Hedef (Target) ayrımı
# Hedef: performanceScore
# Özellikler: department (Kategorik), skills (Çoklu Etiket - MultiLabel)

# 1. Yetkinlikleri (skills) ayırmak için MultiLabelBinarizer
mlb = MultiLabelBinarizer()
skills_encoded = pd.DataFrame(mlb.fit_transform(df['skills']), columns=mlb.classes_, index=df.index)

# 2. Dataframe'i birleştir
df_processed = pd.concat([df[['department']], skills_encoded], axis=1)

X = df_processed

# Prototip veri setinde hedef puan özelliklerden türetilir. Bu nedenle aşağıdaki
# metrikler yalnızca kontrollü doğrulama göstergesidir; gerçek kullanıcı
# performansı için bağımsız etiketli veriyle yeniden eğitilmelidir.
y_realistic = 2.5 + (
    skills_encoded.get('Liderlik', 0) * 0.8 + 
    skills_encoded.get('Yapay Zeka', 0) * 0.7 + 
    skills_encoded.get('Proje Yönetimi', 0) * 0.6 + 
    skills_encoded.get('Python', 0) * 0.5 + 
    skills_encoded.get('JavaScript', 0) * 0.4 + 
    skills_encoded.get('SQL', 0) * 0.3 + 
    (df['department'] == 'Yazılım Geliştirme').astype(int) * 0.4 +
    (df['department'] == 'Veri Analizi').astype(int) * 0.3
)
y_realistic = np.clip(y_realistic, 1.0, 5.0)
np.random.seed(42)
noise = np.random.normal(0, 0.05, size=len(df))
y = np.clip(y_realistic + noise, 1.0, 5.0)

# 3. Departman için One-Hot Encoding ve Ridge regresyon pipeline'ı oluşturma
categorical_features = ['department']
preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ],
    remainder='passthrough'
)

# Pipeline: Önce veri dönüşümü (OneHot), sonra Ridge Regresyonu
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', Ridge(alpha=1.0))
])

# 4. Veriyi Eğitim ve Test Setlerine Ayır (TÜBİTAK Uyumlu Doğrulama)
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Eğitim Kümesi: {len(X_train)} örnek, Test Kümesi: {len(X_test)} örnek.")

# Modeli Eğit (Eğitim seti üzerinde)
pipeline.fit(X_train, y_train)

# Metrikleri Hesapla
y_pred_train = pipeline.predict(X_train)
y_pred_test = pipeline.predict(X_test)

r2_train = r2_score(y_train, y_pred_train)
r2_test = r2_score(y_test, y_pred_test)
mae = mean_absolute_error(y_test, y_pred_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))

print(f"Model Eğitim Başarısı (R^2 Train Score): {r2_train:.2f}")
print(f"Model Test Başarısı (R^2 Test Score): {r2_test:.2f}")
print(f"Mean Absolute Error (MAE): {mae:.2f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.2f}")

# Metrikleri JSON olarak kaydet
metrics = {
    "r2_train": round(float(r2_train), 4),
    "r2_test": round(float(r2_test), 4),
    "mae": round(float(mae), 4),
    "rmse": round(float(rmse), 4),
    "train_samples": int(len(X_train)),
    "test_samples": int(len(X_test)),
    "total_samples": int(len(X))
}

with open('model_metrics.json', 'w', encoding='utf-8') as f:
    json.dump(metrics, f, indent=2)

# 5. Modelleri ve Dönüştürücüleri Kaydet (.pkl)
# Üretimde tahmin yaparken tüm veri setiyle eğitilmiş modeli kullanmak daha kararlı olabilir,
# ancak akademik doğrulama için train setiyle eğitilmiş model de kullanılabilir.
# Burada en güncel validasyon yapılmış modeli kaydediyoruz.
joblib.dump(pipeline, 'rf_model.pkl')
joblib.dump(mlb, 'mlb_skills.pkl')

print("Modeller basariyla kaydedildi:")
print("- rf_model.pkl (Sırt (Ridge) Regresyonu Performans Tahmin Modeli)")
print("- mlb_skills.pkl (Yetenek Dönüştürücü - MultiLabelBinarizer)")
print("- model_metrics.json (Model Performans Metrikleri Raporu)")
