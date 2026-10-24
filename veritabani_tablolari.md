# Veritabanı Tabloları

Bu dosya, proje için oluşturulması gereken veritabanı tablolarını ve alanlarını açıklamaktadır.

## `User`

Kullanıcı bilgilerini tutar.

| Alan Adı | Veri Tipi | Açıklama |
| --- | --- | --- |
| `id` | `Int` | Birincil anahtar, otomatik artan. |
| `username` | `String` | Kullanıcı adı, benzersiz olmalıdır. |
| `passwordHash` | `String` | Kullanıcının şifresinin hashlenmiş hali. |
| `role` | `Role` | Kullanıcı rolü (`USER` veya `ADMIN`). |
| `createdAt` | `DateTime` | Kayıt oluşturulma zamanı. |
| `updatedAt` | `DateTime` | Kayıt güncellenme zamanı. |

## `Course`

Eğitim kursu bilgilerini tutar.

| Alan Adı | Veri Tipi | Açıklama |
| --- | --- | --- |
| `id` | `String` | Birincil anahtar (ör. "liderlik-1"). |
| `category` | `String` | Kursun kategorisi. |
| `name` | `String` | Kursun adı. |
| `description` | `String?` | Kursun açıklaması (opsiyonel). |

## `UserCourse`

Kullanıcıların hangi kursları tamamladığını gösteren ilişki tablosu.

| Alan Adı | Veri Tipi | Açıklama |
| --- | --- | --- |
| `id` | `Int` | Birincil anahtar, otomatik artan. |
| `userId` | `Int` | `User` tablosuna referans. |
| `courseId` | `String` | `Course` tablosuna referans. |
| `completedAt` | `DateTime` | Kursun tamamlandığı zaman. |

## `Evaluation`

Yönetici tarafından yapılan çalışan değerlendirmelerini tutar.

| Alan Adı | Veri Tipi | Açıklama |
| --- | --- | --- |
| `id` | `Int` | Birincil anahtar, otomatik artan. |
| `userId` | `Int` | `User` tablosuna referans. |
| `kalite` | `Float` | Kalite değerlendirme puanı. |
| `sorumluluk` | `Float` | Sorumluluk değerlendirme puanı. |
| `birligi` | `Float` | İş birliği değerlendirme puanı. |
| `zaman` | `Float` | Zaman yönetimi değerlendirme puanı. |
| `yorumlar` | `String?` | Ek yorumlar (opsiyonel). |
| `tarih` | `String` | Değerlendirme tarihi (ör. "15.01.2024"). |
| `saat` | `String` | Değerlendirme saati (ör. "14:30:45"). |
| `yonetici` | `String` | Değerlendirmeyi yapan yöneticinin adı. |
| `createdAt` | `DateTime` | Kayıt oluşturulma zamanı. |

## `Role` (Enum)

Kullanıcı rollerini tanımlayan enum.

| Değer |
| --- |
| `USER` |
| `ADMIN` |
