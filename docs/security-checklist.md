# PSL Project Hub — Üretime Alım Güvenlik Kontrol Listesi (Security Checklist)

Sistemi canlı kurumsal ortama veya müşteriye teslim etmeden önce aşağıdaki maddelerin tamamının doğrulandığından emin olun:

---

## 1. Kimlik Doğrulama & Yetkilendirme
- [x] Kaynak kodda sabit/gömülü şifre (hardcoded password) bulunmadığı doğrulandı.
- [x] Güçlendirilmiş parola politikası devrede (en az 8 karakter, büyük/küçük harf, rakam, özel karakter).
- [x] Başarısız 5 hatalı denemede hesap 15 dakika boyunca kilitleniyor (`Lockout 423`).
- [x] İlk kurulum sihirbazı tamamlandıktan sonra `POST /api/setup/initialize` uç noktasının kilitlendiği (409 Conflict) doğrulandı.
- [x] Hassas işlemler (proje ekleme, silme, doğrulama, ekran görüntüsü yükleme) `[Authorize(Roles = "Admin")]` veya `[Authorize(Roles = "Admin,Editor")]` ile korunuyor.

## 2. Ağ & İletişim Güvenliği
- [ ] Uygulama IIS/Reverse Proxy üzerinde HTTPS (TLS 1.2 veya 1.3) ile yayında.
- [ ] HTTP istekleri HTTPS'e otomatik yönlendiriliyor (HSTS aktif).
- [x] Strict Content Security Policy (CSP) devrede: harici/inline script enjeksiyonları engellendi.
- [x] Clickjacking saldırılarına karşı `X-Frame-Options: DENY` başlığı gönderiliyor.
- [x] MIME tipi karışıklığına karşı `X-Content-Type-Options: nosniff` başlığı gönderiliyor.
- [x] `Server` ve `X-Powered-By` sunucu ifşa başlıkları yanıtlardan temizleniyor.

## 3. Dosya ve Depolama Güvenliği
- [x] Ekran görüntüleri doğrudan web kök dizini (public wwwroot) altında DEĞİL, web kök dışı bir dizinde saklanıyor.
- [x] Veritabanında fiziksel sunucu disk yolları saklanmıyor; istemciye ID tabanlı akış URL'si (`/api/screenshots/{id}/file`) sunuluyor.
- [x] Yüklenen dosyalarda uzantı sahteciliğine karşı sihirli bayt (magic bytes) içerik denetimi yapılıyor.
- [x] Dosya boyutu sınırı (5 MB) ve proje başına azami adet sınırı (20) devrede.

## 4. Veri Bütünlüğü ve Denetim İzi (Audit)
- [x] Kritik tüm işlemler (`Create`, `Update`, `Archive`, `Restore`, `Verify`) zaman damgası ve kullanıcı bilgisiyle `AuditLogs` tablosuna kaydediliyor.
- [x] Yalnızca sistem yöneticileri denetim kayıtlarını (`GET /api/projects/{id}/audit`) görüntüleyebiliyor.
- [x] Veritabanı şema geçişleri `MigrateAsync` ile kontrollü yapılıyor; migrasyon hatası durumunda uygulama açılışı güvenli şekilde sonlandırılıyor.