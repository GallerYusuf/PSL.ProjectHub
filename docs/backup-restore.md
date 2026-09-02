# PSL Project Hub — Yedekleme ve Olağanüstü Durumdan Kurtarma (Backup & Restore)

PSL Project Hub'ın verileri iki temel alanda tutulur:
1. **İlişkisel Veriler & Güvenlik:** Microsoft SQL Server veritabanı (`PSLProjectHub`)
2. **Medya & Görseller:** Web kök dışı dosya dizini (`Storage:ScreenshotsPath` veya `uploads/screenshots`)

Tam bir yedekleme için her iki alanın da eşzamanlı olarak yedeklenmesi gerekir.

---

## 1. Veritabanı Yedekleme (SQL Server)

### T-SQL ile Tam Yedek (Full Backup)
```sql
BACKUP DATABASE [PSLProjectHub]
TO DISK = N'D:\Backups\PSLProjectHub_Full_' + REPLACE(CONVERT(VARCHAR(10), GETDATE(), 120), '-', '') + '.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;
```

### PowerShell ile Otomatik Yedekleme Görevi
```powershell
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "D:\Backups\PSLProjectHub_$date.bak"
Invoke-Sqlcmd -Query "BACKUP DATABASE [PSLProjectHub] TO DISK = N'$backupFile' WITH COMPRESSION;"
```

---

## 2. Ekran Görüntüleri Dosya Dizini Yedekleme

Ekran görüntüleri veritabanında değil dosya sisteminde tutulduğundan klasörün yedeklenmesi gereklidir:

```powershell
$source = "C:\inetpub\PSLProjectHub\uploads\screenshots"
$dest = "D:\Backups\Screenshots_" + (Get-Date -Format "yyyyMMdd")
Copy-Item -Path $source -Destination $dest -Recurse -Force
```

---

## 3. Geri Yükleme (Disaster Recovery / Restore)

### Adım 1: Veritabanını Geri Yükleme
```sql
USE [master];
ALTER DATABASE [PSLProjectHub] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

RESTORE DATABASE [PSLProjectHub]
FROM DISK = N'D:\Backups\PSLProjectHub_Full.bak'
WITH REPLACE, RECOVERY;

ALTER DATABASE [PSLProjectHub] SET MULTI_USER;
```

### Adım 2: Görselleri İlgili Dizine Taşıma
Yedeklenen görsel dosyalarını yapılandırılmış olan `Storage:ScreenshotsPath` dizinine kopyalayın.

### Adım 3: Servisi Yeniden Başlatma
IIS üzerinde uygulama havuzunu yeniden başlatın:
```powershell
Restart-WebAppPool -Name "PSLProjectHubPool"
```