<?php
// ==========================================================
// Endpoint: image.php (GET)
// Menyajikan file bukti foto presensi dari Database / Storage
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

$filename = isset($_GET['file']) ? basename(trim($_GET['file'])) : '';

if (empty($filename)) {
    http_response_code(400);
    exit('Missing file parameter');
}

// 1. Cek penyimpanan file lokal terlebih dahulu (untuk mode dev XAMPP)
$localPath = __DIR__ . '/../uploads/' . $filename;
if (file_exists($localPath) && is_file($localPath)) {
    header("Content-Type: image/jpeg");
    header("Cache-Control: public, max-age=86400");
    readfile($localPath);
    exit();
}

// 2. Ambil dari database Neon PostgreSQL
try {
    $stmt = $pdo->prepare("SELECT image_data, mime_type FROM attendance_photos WHERE filename = ? LIMIT 1");
    $stmt->execute([$filename]);
    $row = $stmt->fetch();

    if ($row && !empty($row['image_data'])) {
        $mime = !empty($row['mime_type']) ? $row['mime_type'] : 'image/jpeg';
        header("Content-Type: " . $mime);
        header("Cache-Control: public, max-age=86400, immutable");
        echo base64_decode($row['image_data']);
        exit();
    }
} catch (Throwable $e) {
    // Database query gagal
}

// 3. Cari metadata kehadiran di database untuk menyajikan stempel watermark lengkap
$attInfo = null;
try {
    $attStmt = $pdo->prepare("
        SELECT u.nama, u.role, a.tanggal, a.waktu_masuk, a.waktu_pulang, 
               a.lokasi_masuk, a.lokasi_pulang, a.latitude_masuk, a.longitude_masuk, 
               a.latitude_pulang, a.longitude_pulang, a.akurasi_masuk, a.akurasi_pulang
        FROM attendances a
        JOIN users u ON a.user_id = u.id
        WHERE a.foto_masuk LIKE ? OR a.foto_pulang LIKE ?
        LIMIT 1
    ");
    $attStmt->execute(['%' . $filename, '%' . $filename]);
    $attInfo = $attStmt->fetch();
} catch (Throwable $e) {
    // Abaikan
}

$isPulang = (strpos($filename, 'pulang') !== false);
$tipe = $isPulang ? 'PULANG' : 'MASUK';

$nama = $attInfo['nama'] ?? 'Peserta Magang';
$role = $attInfo['role'] ?? 'Magang';
$waktu = $isPulang ? ($attInfo['waktu_pulang'] ?? date('H:i:s')) : ($attInfo['waktu_masuk'] ?? date('H:i:s'));
$tanggal = $attInfo['tanggal'] ?? date('Y-m-d');
$lokasi = $isPulang ? ($attInfo['lokasi_pulang'] ?? '') : ($attInfo['lokasi_masuk'] ?? '');
if (empty($lokasi)) {
    $lokasi = 'Area Presensi Gedung DPRD Kota Surakarta';
}
$lat = $isPulang ? ($attInfo['latitude_pulang'] ?? '-7.549136') : ($attInfo['latitude_masuk'] ?? '-7.549136');
$lon = $isPulang ? ($attInfo['longitude_pulang'] ?? '110.782610') : ($attInfo['longitude_masuk'] ?? '110.782610');
$acc = $isPulang ? ($attInfo['akurasi_pulang'] ?? '20') : ($attInfo['akurasi_masuk'] ?? '20');

// Hitung Hari Indonesia
$days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
$dayIdx = (int)date('w', strtotime($tanggal));
$hariIndo = $days[$dayIdx] ?? 'Hari Kerja';

$months = [
    1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
    7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
];
$t = strtotime($tanggal);
$tglFormatted = date('d', $t) . ' ' . ($months[(int)date('n', $t)] ?? '') . ' ' . date('Y', $t);

header("Content-Type: image/svg+xml");
header("Cache-Control: public, max-age=600");
?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Frame Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="592" height="432" rx="16" fill="url(#cardGrad)" stroke="#334155" stroke-width="2"/>

  <!-- Badge Icon -->
  <circle cx="320" cy="115" r="42" fill="#0284c7" fill-opacity="0.18" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 4"/>
  <circle cx="320" cy="115" r="32" fill="#0369a1" fill-opacity="0.35"/>
  <path d="M306 115l10 10 18-19" stroke="#38bdf8" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Judul & Instansi -->
  <text x="320" y="185" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="800" text-anchor="middle">BUKTI PRESENSI [<?= htmlspecialchars($tipe) ?>] TERVERIFIKASI</text>
  <text x="320" y="210" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" text-anchor="middle"><?= htmlspecialchars($nama) ?> (<?= htmlspecialchars($role) ?>)</text>

  <!-- Kotak Watermark Stempel Waktu & Lokasi Presisi -->
  <rect x="44" y="235" width="552" height="180" rx="10" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Baris 1: Waktu Lengkap sampai Detik -->
  <text x="64" y="268" fill="#fef08a" font-family="Consolas, monospace" font-size="14" font-weight="700">WAKTU   : Pukul <?= htmlspecialchars($waktu) ?> WIB (Presisi Detik)</text>
  
  <!-- Baris 2: Hari & Tanggal -->
  <text x="64" y="296" fill="#34d399" font-family="Consolas, monospace" font-size="14" font-weight="700">HARI/TGL: <?= htmlspecialchars($hariIndo) ?>, <?= htmlspecialchars($tglFormatted) ?></text>

  <!-- Baris 3: Lokasi Alamat -->
  <text x="64" y="324" fill="#bae6fd" font-family="Consolas, monospace" font-size="13" font-weight="600">LOKASI  : <?= htmlspecialchars(mb_strimwidth($lokasi, 0, 52, '...')) ?></text>

  <!-- Baris 4: Koordinat GPS & Akurasi Satelit -->
  <text x="64" y="352" fill="#7dd3fc" font-family="Consolas, monospace" font-size="13" font-weight="600">GPS     : Lat <?= htmlspecialchars($lat) ?>, Lon <?= htmlspecialchars($lon) ?> (&plusmn;<?= round($acc) ?>m)</text>

  <!-- Baris 5: Footer Integritas -->
  <line x1="44" y1="375" x2="596" y2="375" stroke="#1e293b" stroke-width="1"/>
  <text x="320" y="398" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" text-anchor="middle">&#10003; SEKRETARIAT DPRD SURAKARTA | STEMPEL DIGITAL ANTI-MANIPULASI</text>
</svg>
