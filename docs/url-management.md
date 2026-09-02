# PSL Project Hub - URL Yönetimi ve Envanteri

Bu belge, **PSL Project Hub** içerisindeki bağlantı tiplerini, ortamları, birincil URL mantığını ve `project-urls.json` içe aktarım (import) mekanizmasını detaylandırır.

---

## 1. Bağlantı Türleri (Link Types)

| Tür | Kod | Açıklama |
|---|---|---|
| **Canlı Ortam** | `Production` | Son kullanıcıların veya bayilerin kullandığı asıl canlı uygulama adresi. |
| **Test Ortamı** | `Test` | Test, UAT veya Staging ortamı adresi. |
| **Yönetim Paneli** | `AdminPanel` | Sistemin yönetim/admin arayüzü URL'si. |
| **API** | `Api` | Backend REST API kök adresi. |
| **Swagger** | `Swagger` | OpenAPI / Swagger dokümantasyon ve test arayüzü. |
| **Dokümantasyon** | `Documentation` | Projeye ait teknik veya iş dokümantasyonu (Wiki, Confluence, vb.). |
| **Repository** | `Repository` | Git / GitHub kaynak kod deposu bağlantısı. |
| **İzleme** | `Monitoring` | Log, APM veya sistem sağlığı izleme paneli (Grafana, Kibana, vb.). |
| **Diğer** | `Other` | Yukarıdaki kategorilere girmeyen diğer bağlantılar. |

---

## 2. Ortam Türleri (Environment Types)

- `Production`: Canlı üretim ortamı.
- `Test`: Test ve doğrulama ortamı.
- `Development`: Geliştirici yerel ortamı.
- `Internal`: Yalnızca şirket içi ağda (Local LAN / VPN) erişilebilen adresler.
- `External`: Kamuya veya internete açık güvenli adresler.

---

## 3. Birincil Bağlantı (`IsPrimary`) ve Kart Davranışı

1. **Ana Düğme:** Bir projede `IsPrimary = true` olarak işaretlenen bağlantı, ana panodaki proje kartının üzerinde yer alan **“Uygulamayı Aç”** düğmesinin hedefi olur.
2. **Canlı URL Yoksa:** Projenin tanımlı birincil veya canlı bağlantısı yoksa, proje kartında "Uygulamayı Aç" düğmesi gösterilmez; kullanıcı yalnızca **"Detayları Gör"** ile proje özetini inceleyebilir.
3. **Detay Sayfası:** Bir projenin tüm bağlantıları, proje detay sayfasındaki **"Proje Bağlantıları"** bölümünde ortama ve türe göre gruplanmış olarak listelenir.

---

## 4. `project-urls.json` İçe Aktarma (Import) Mekanizması

Proje bağlantıları toplu olarak bir JSON dosyasından aktarılabilir:

### Beklenen JSON Formatı
```json
[
  {
    "projectKey": "musteri-platformu",
    "links": [
      {
        "label": "Müşteri Portalı",
        "url": "https://customer.example.internal",
        "linkType": "Production",
        "environment": "Production",
        "isPrimary": true,
        "requiresVpn": true,
        "requiresAuthentication": true,
        "openInNewTab": true,
        "displayOrder": 1
      }
    ]
  }
]
```

### İçe Aktarım Kuralları
- **Eşleştirme:** `projectKey`, projenin benzersiz `Slug` değeriyle eşleştirilir.
- **Idempotent (Tekrarlanabilir):** Aynı JSON dosyası birden fazla kez çalıştırılsa bile **mükerrer (duplicate) kayıt oluşturulmaz**.
- **Mevcut Kayıt Güncellemesi:** Aynı URL aynı projede zaten varsa, etiket, VPN ve Auth ayarları güncellenir.
- **Güvenlik Doğrulaması:** Dosyadaki geçersiz URL'ler (`http` / `https` dışındakiler) reddedilir ve aktarılmaz.
