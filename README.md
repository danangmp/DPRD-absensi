# Sistem Presensi Digital — Sekretariat DPRD Kota Surakarta

Aplikasi Presensi Digital berbasis Web untuk pencatatan kehadiran Pegawai dan Siswa Magang di lingkungan **Sekretariat DPRD Kota Surakarta**. Dilengkapi dengan verifikasi sensor biometrik kamera, pelacakan koordinat GPS anti-manipulasi, pembubuhan stempel watermark lokasi permanen, dan Dashboard Rekapitulasi Kehadiran Administrator.

---

## 🚀 Fitur Unggulan

1. **Biometrik Kamera & Viewfinder Interaktif:**
   - Deteksi tangkapan kamera langsung (*live optical sensor*) dengan panduan *viewfinder* presisi.
   - Kompatibel dengan kamera desktop, webcam eksternal, dan kamera depan ponsel (*smartphone*).
2. **Pelacakan Lokasi GPS Terverifikasi & Anti-Manipulasi:**
   - Mengambil koordinat GPS akurasi tinggi (*high accuracy*) tanpa menggunakan *cache*.
   - Proteksi otomatis terhadap aplikasi pemalsu lokasi (*Fake GPS / Mock Location*).
   - Konversi koordinat otomatis menjadi nama jalan/wilayah Indonesia via reverse-geocoding OpenStreetMap.
3. **Stempel Watermark Permanen (Server-Side PHP GD):**
   - Bukti foto absensi masuk & pulang langsung dibubuhi stempel watermark resmi pada piksel foto: Nama, Role, Tanggal, Jam WIB, Nama Lokasi, dan Titik Koordinat GPS.
4. **Dashboard Kontrol Administrator:**
   - Pemantauan KPI kehadiran harian secara real-time (Total Terdaftar, Hadir Masuk, Pulang, Belum Hadir).
   - Filter tanggal laporan, filter role (Pegawai / Magang), dan pencarian nama.
   - Preview foto bukti kehadiran resolusi penuh dan tautan langsung ke Google Maps.
   - Manajemen Peserta (Tambah & Hapus Peserta) dan Penggantian PIN Master Keamanan.
5. **Responsif di Semua Perangkat (*All-Device Responsive*):**
   - Tata letak ergonomis yang beradaptasi otomatis di Desktop, Tablet, hingga Layar Ponsel (*mobile smartphone*).

---

## 📁 Struktur Berkas

```
ABSENSI_PROJECT/
├── index.html                   # Entry point aplikasi web (Frontend React Production)
├── assets/                      # File JS bundle terkompilasi, CSS, dan Asset
├── logo.jpg                     # Logo resmi DPRD Kota Surakarta
├── database.sql                 # Skema tabel database bersih siap import
├── start_server.bat             # Peluncur cepat server lokal (Development)
├── .htaccess                    # Konfigurasi keamanan Apache & caching
├── .gitignore                   # Konfigurasi penyaringan Git
├── php-backend/
│   ├── config.php               # Konfigurasi koneksi MySQL (PDO) & Timezone WIB
│   ├── config.example.php       # Template konfigurasi database
│   ├── api/
│   │   ├── users.php            # Endpoint GET/POST daftar peserta
│   │   ├── users_delete.php     # Endpoint DELETE hapus peserta dengan PIN Admin
│   │   ├── absen.php            # Endpoint POST absensi masuk & pulang + Watermark
│   │   ├── rekap.php            # Endpoint GET rekap absensi per tanggal
│   │   ├── auth_admin.php       # Endpoint POST validasi PIN Master Admin
│   │   └── change_pin.php       # Endpoint POST penggantian PIN Master Admin
│   └── uploads/                 # Direktori penyimpanan foto bukti presensi
└── client/                      # Kode sumber Frontend React (Vite)
    ├── src/
    └── package.json
```

---

## 🛠️ Panduan Menjalankan di Lokal (Development)

### Prasyarat:
- **PHP 8.x** (dengan ekstensi `pdo_mysql`, `gd`, `openssl` aktif)
- **MySQL / MariaDB** (misalnya melalui XAMPP)
- **Node.js** (jika ingin memodifikasi frontend di folder `client/`)

### Langkah-langkah:
1. Pastikan service **MySQL** sudah berjalan (misal via XAMPP Control Panel).
2. Buat database baru bernama `absensi_db`.
3. Import berkas `database.sql` ke dalam database `absensi_db`.
4. Sesuaikan koneksi di `php-backend/config.php` jika menggunakan kredensial custom (default: root tanpa password).
5. Jalankan server lokal:
   - **Cara Cepat (Windows):** Klik dua kali `start_server.bat`
   - **Atau via Terminal:**
     ```bash
     php -S localhost:8080
     ```
6. Buka browser di [http://localhost:8080](http://localhost:8080).

---

## 🌐 Panduan Deploy ke Hosting / Production

### 1. Prasyarat Wajib: Aktifkan SSL (HTTPS)
> **PENTING:** Browser modern (Chrome, Safari, Firefox, iOS, Android) mewajibkan protokol **HTTPS** agar fitur Kamera Wajah dan GPS Geolocation diizinkan berjalan. Pastikan domain/subdomain online Anda sudah memasang sertifikat SSL (misal: Let's Encrypt / AutoSSL gratis).

### 2. Persiapan Database MySQL
1. Buat database baru di cPanel / VPS Anda (misalnya `absensi_db`).
2. Masuk ke **phpMyAdmin**, pilih database tersebut, lalu klik menu **Import**.
3. Pilih berkas `database.sql` dan jalankan.
4. Sesuaikan kredensial di `php-backend/config.php` atau atur Environment Variables (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).

### 3. Izin Akses Folder Penyimpanan Foto
Pastikan folder `php-backend/uploads/` memiliki hak akses tulis (*write permission*) oleh web server:
```bash
chmod 755 php-backend/uploads/
# atau chmod 775 php-backend/uploads/
```

### 4. Mengunggah Berkas ke Hosting
Unggah berkas ke folder public web server Anda (`public_html` atau direktori virtual host):
- `index.html`
- `assets/`
- `logo.jpg`
- `favicon.svg`
- `icons.svg`
- `.htaccess`
- `php-backend/`


