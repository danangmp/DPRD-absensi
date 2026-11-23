# Panduan Kontribusi & Struktur Branch — DPRD Absensi

Repositori ini menggunakan standar **Git Feature Branch Workflow**. Setiap pengembangan fitur baru dilakukan pada branch per-fitur yang terisolasi dan ditargetkan ke branch `develop` melalui Pull Request.

---

## 🌿 Struktur Branching Utama

| Branch | Tipe | Fungsi |
| :--- | :--- | :--- |
| **`main`** | Production | Kode stabil yang siap dideploy ke server produksi (Vercel / Hosting). |
| **`develop`** | Staging / Integration | Wadah integrasi dan pengujian bersama sebelum perilisan ke `main`. |

---

## 🛠️ Pembagian Feature Branch & Penanggung Jawab Modul

### 1. `feature/attendance-api`
- **Lead Developer:** Fikih Aldi (**fikihrz** - `fikihaldi91@gmail.com`)
- **Ruang Lingkup:**
  - Endpoint API PHP (`absen.php`, `users.php`, `rekap.php`)
  - Server-side Watermarking foto bukti kehadiran (PHP GD library)
  - Desain & migrasi skema database (`database.sql`)
  - Pengujian integritas transaksi presensi masuk & pulang

### 2. `feature/camera-geolocation`
- **Lead Developer:** Ahmad Daffa (**ahmmdaffa** - `ahmmdaffa280904@gmail.com`)
- **Ruang Lingkup:**
  - Antarmuka frontend React untuk sensor biometrik kamera (`WebcamCapture.jsx`)
  - Viewfinder panduan presisi wajah
  - Pelacakan akurasi GPS Geolocation (`location.js`) & proteksi mock location
  - Reverse-geocoding koordinat GPS ke alamat jalan (OpenStreetMap)

### 3. `feature/admin-dashboard`
- **Lead Developer:** Wahyu Satrio Wibowo (**WahyuSatrio505** - `wahyuusatriowibowo@gmail.com`)
- **Ruang Lingkup:**
  - Dashboard monitoring KPI kehadiran harian real-time (`AdminDashboard.jsx`)
  - Filter tanggal laporan, filter role (Pegawai / Magang), dan pencarian peserta
  - Manajemen Peserta (Tambah & Hapus Peserta: `AddUserModal.jsx`, `DeleteUserModal.jsx`)
  - Sistem otentikasi keamanan PIN Master Admin (`AdminAuthModal.jsx`, `ChangePinModal.jsx`)

---

## 🔄 Alur Kerja Tim (Git Flow)

1. **Tarik pembaruan terbaru dari develop:**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Buat atau pindah ke branch fitur yang dikerjakan:**
   ```bash
   git checkout feature/<nama-fitur>
   ```

3. **Lakukan commit perubahan secara berkala:**
   ```bash
   git add .
   git commit -m "feat(scope): penjelasan singkat apa yang diubah"
   ```

4. **Kirim ke GitHub dan ajukan Pull Request:**
   ```bash
   git push origin feature/<nama-fitur>
   ```
   Buka GitHub dan buat **Pull Request (PR)** dari `feature/<nama-fitur>` ke branch **`develop`**.
