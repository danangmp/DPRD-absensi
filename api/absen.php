<?php
// ==========================================================
// Endpoint: absen.php (POST)
// Mencatat kehadiran MASUK atau PULANG, Validasi Lokasi Anti-Manipulasi
// & Watermark Foto Permanen dengan Data Lokasi Presisi
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

date_default_timezone_set('Asia/Jakarta');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode HTTP ' . $_SERVER['REQUEST_METHOD'] . ' tidak diizinkan. Gunakan POST.'
    ]);
    exit();
}

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];

$userId = $input['user_id'] ?? null;
$pin = isset($input['pin']) ? trim($input['pin']) : '';
$tipe = isset($input['tipe']) ? strtoupper(trim($input['tipe'])) : '';
$image = $input['image'] ?? '';

// Data Lokasi Geolocation
$latitude = isset($input['latitude']) && is_numeric($input['latitude']) ? (float)$input['latitude'] : null;
$longitude = isset($input['longitude']) && is_numeric($input['longitude']) ? (float)$input['longitude'] : null;
$accuracy = isset($input['accuracy']) && is_numeric($input['accuracy']) ? (float)$input['accuracy'] : null;
$lokasiInput = isset($input['lokasi']) ? trim($input['lokasi']) : (isset($input['location_name']) ? trim($input['location_name']) : '');
$isMocked = !empty($input['is_mocked']);

// 1. Validasi kelengkapan input dasar
if (!$userId || $pin === '' || $tipe === '' || empty($image)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Field user_id, pin, tipe, dan foto image wajib diisi.'
    ]);
    exit();
}

if ($tipe !== 'MASUK' && $tipe !== 'PULANG') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => "Nilai tipe harus 'MASUK' atau 'PULANG'."
    ]);
    exit();
}

// 2. Validasi Keharusan & Anti-Manipulasi Lokasi
if ($latitude === null || $longitude === null) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Izin lokasi wajib diberikan. Akses koordinat GPS tidak terdeteksi pada perangkat Anda.'
    ]);
    exit();
}

// Validasi batas geografis bumi
if ($latitude < -90.0 || $latitude > 90.0 || $longitude < -180.0 || $longitude > 180.0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Koordinat lokasi GPS tidak valid atau di luar rentang geografis yang sah.'
    ]);
    exit();
}

// Validasi Anti-Fake GPS / Mock Location
if ($isMocked) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Sistem mendeteksi penggunaan Mock Location / Fake GPS. Mohon matikan aplikasi pemalsu lokasi untuk melakukan presensi.'
    ]);
    exit();
}

try {
    // 3. Validasi kecocokan user_id dan PIN
    $userStmt = $pdo->prepare("SELECT id, nama, role, pin FROM users WHERE id = ?");
    $userStmt->execute([(int)$userId]);
    $user = $userStmt->fetch();

    if (!$user || (string)$user['pin'] !== (string)$pin) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'PIN salah atau user tidak ditemukan.'
        ]);
        exit();
    }

    $dateKey = date('Y-m-d');
    $timeStr = date('H:i:s');

    // 4. Cek catatan presensi hari ini
    $attendStmt = $pdo->prepare("SELECT * FROM attendances WHERE user_id = ? AND tanggal = ? LIMIT 1");
    $attendStmt->execute([(int)$user['id'], $dateKey]);
    $existing = $attendStmt->fetch();

    if ($tipe === 'MASUK') {
        if ($existing) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Anda sudah melakukan absen masuk hari ini'
            ]);
            exit();
        }
    } else if ($tipe === 'PULANG') {
        if (!$existing) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Anda belum melakukan absen masuk hari ini'
            ]);
            exit();
        }
        if (!empty($existing['waktu_pulang'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Anda sudah melakukan absen pulang hari ini'
            ]);
            exit();
        }
    }

    // 5. Format Tanggal & Hari Bahasa Indonesia
    $daftarHari = [
        'Sunday' => 'Minggu',
        'Monday' => 'Senin',
        'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday' => 'Kamis',
        'Friday' => 'Jumat',
        'Saturday' => 'Sabtu'
    ];
    $daftarBulan = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember'
    ];

    $hariInggris = date('l');
    $hariIndo = $daftarHari[$hariInggris] ?? $hariInggris;
    $tgl = date('d');
    $bln = (int)date('n');
    $thn = date('Y');
    $bulanIndo = $daftarBulan[$bln] ?? date('F');

    $fullDateStr = "{$hariIndo}, {$tgl} {$bulanIndo} {$thn}";

    // Format koordinat & lokasi string
    $latFormatted = number_format($latitude, 6, '.', '');
    $lonFormatted = number_format($longitude, 6, '.', '');
    $accFormatted = $accuracy !== null ? round($accuracy) : 10;

    // Bersihkan nama alamat/lokasi
    $lokasiClean = preg_replace('/[\r\n\t]+/', ' ', $lokasiInput);
    $lokasiClean = trim(preg_replace('/\s+/', ' ', $lokasiClean));
    if (empty($lokasiClean)) {
        $lokasiClean = "Koordinat: {$latFormatted}, {$lonFormatted}";
    }

    // 6. Sanitasi Nama User untuk Format Nama File
    $safeName = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower(trim($user['nama']))), '_');
    $tipeKecil = strtolower($tipe);
    $timestamp = time();
    $filename = "{$tipeKecil}_{$safeName}_{$dateKey}_{$timestamp}.jpg";

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) {
        @mkdir($uploadsDir, 0777, true);
    }
    $filePath = $uploadsDir . '/' . $filename;

    // 7. Decode Base64 Image
    $cleanBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $image);
    $cleanBase64 = str_replace(' ', '+', $cleanBase64);
    $imageData = base64_decode($cleanBase64);

    if ($imageData === false || strlen($imageData) < 100) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format gambar Base64 tidak valid atau kosong.'
        ]);
        exit();
    }

    if (function_exists('getimagesizefromstring')) {
        $imgInfo = @getimagesizefromstring($imageData);
        if ($imgInfo === false || empty($imgInfo[0]) || empty($imgInfo[1])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Data foto presensi bukan format gambar yang valid.'
            ]);
            exit();
        }
    }

    // 8. Verifikasi Anti Layar Hitam / Lensa Tertutup & Watermarking PHP GD Library
    $gdImg = false;
    if (function_exists('imagecreatefromstring')) {
        try {
            $gdImg = @imagecreatefromstring($imageData);
            if ($gdImg !== false) {
                $sampleCols = 16;
                $sampleRows = 16;
                $imgWidthCheck = imagesx($gdImg);
                $imgHeightCheck = imagesy($gdImg);
                $scanMaxY = max(1, (int)floor($imgHeightCheck * 0.76));
                $sumLum = 0.0;
                $maxLum = 0.0;
                $sampleCount = 0;

                for ($r = 0; $r < $sampleRows; $r++) {
                    $y = min($scanMaxY - 1, (int)floor(($r + 0.5) * $scanMaxY / $sampleRows));
                    for ($c = 0; $c < $sampleCols; $c++) {
                        $x = min($imgWidthCheck - 1, (int)floor(($c + 0.5) * $imgWidthCheck / $sampleCols));
                        $rgba = imagecolorsforindex($gdImg, imagecolorat($gdImg, $x, $y));
                        $lum = 0.299 * $rgba['red'] + 0.587 * $rgba['green'] + 0.114 * $rgba['blue'];
                        $sumLum += $lum;
                        if ($lum > $maxLum) {
                            $maxLum = $lum;
                        }
                        $sampleCount++;
                    }
                }

                $avgLum = $sampleCount > 0 ? ($sumLum / $sampleCount) : 255.0;
                if ($sampleCount > 0 && $avgLum < 12.0 && $maxLum < 25.0) {
                    imagedestroy($gdImg);
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Foto kamera terdeteksi layar hitam atau lensa tertutup! Absensi belum dicatat. Pastikan kamera terbuka dan wajah terlihat di lingkaran, lalu absen ulang.'
                    ]);
                    exit();
                }
            }
        } catch (Throwable $e) {
            $gdImg = false;
        }
    }

    $savedWithGd = false;
    try {
        if ($gdImg !== false) {
            $imgWidth = imagesx($gdImg);
            $imgHeight = imagesy($gdImg);

            // Banner proporsional di bagian bawah foto (tinggi 118px)
            $bannerHeight = 118;
            $bannerY = max(0, $imgHeight - $bannerHeight);

            imagealphablending($gdImg, true);
            imagesavealpha($gdImg, true);

            // Teks watermark dicetak langsung pada piksel foto (tanpa kotak background)
            $blackShadow = imagecolorallocate($gdImg, 0, 0, 0);
            $whiteColor = imagecolorallocate($gdImg, 255, 255, 255);
            $yellowColor = imagecolorallocate($gdImg, 254, 240, 138); // Kuning terang untuk waktu & detik
            $greenColor = imagecolorallocate($gdImg, 52, 211, 153);   // Hijau mint untuk GPS & status
            $skyColor = imagecolorallocate($gdImg, 186, 230, 253);    // Sky blue untuk alamat lokasi
            $mutedColor = imagecolorallocate($gdImg, 148, 163, 184);  // Abu-abu terang

            // Baris 1: Status Presensi & Identitas User
            $line1 = "PRESENSI [{$tipe}] - {$user['nama']} ({$user['role']})";
            // Baris 2: Hari, Tanggal, Jam sampai detik (WIB)
            $line2 = "HARI: {$hariIndo} | TGL: {$tgl} {$bulanIndo} {$thn} | PUKUL: {$timeStr} WIB";
            // Baris 3: Nama Lokasi / Alamat Lengkap
            $lokasiDisplay = $lokasiClean;
            if (strlen($lokasiDisplay) > 75) {
                $lokasiDisplay = substr($lokasiDisplay, 0, 72) . '...';
            }
            $line3 = "LOKASI: {$lokasiDisplay}";
            // Baris 4: Koordinat Geografis GPS & Toleransi Akurasi
            $line4 = "GPS: Lat {$latFormatted}, Lon {$lonFormatted} (Akurasi: +/-{$accFormatted}m)";
            // Baris 5: Identitas Instansi & Stempel Anti-Manipulasi
            $line5 = "SEKRETARIAT DPRD KOTA SURAKARTA - STEMPEL DIGITAL ANTI-MANIPULASI";

            imagestring($gdImg, 5, 12, $bannerY + 6, $line1, $whiteColor);
            imagestring($gdImg, 4, 12, $bannerY + 28, $line2, $yellowColor);
            imagestring($gdImg, 3, 12, $bannerY + 49, $line3, $skyColor);
            imagestring($gdImg, 3, 12, $bannerY + 69, $line4, $greenColor);
            imagestring($gdImg, 2, 12, $bannerY + 91, $line5, $mutedColor);

            ob_start();
            imagejpeg($gdImg, null, 85);
            $finalImageBytes = ob_get_clean();
            imagedestroy($gdImg);
            $savedWithGd = true;
        }
    } catch (Throwable $e) {
        $savedWithGd = false;
    }

    // Fallback jika GD gagal
    if (!$savedWithGd || empty($finalImageBytes)) {
        $finalImageBytes = $imageData;
    }

    // 1. Simpan foto ke database (attendance_photos) agar persisten di Vercel/Cloud
    try {
        $base64Image = base64_encode($finalImageBytes);
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
        if ($driver === 'pgsql') {
            $pStmt = $pdo->prepare("INSERT INTO attendance_photos (filename, image_data, mime_type) VALUES (?, ?, 'image/jpeg') ON CONFLICT (filename) DO UPDATE SET image_data = EXCLUDED.image_data");
        } else {
            $pStmt = $pdo->prepare("INSERT INTO attendance_photos (filename, image_data, mime_type) VALUES (?, ?, 'image/jpeg') ON DUPLICATE KEY UPDATE image_data = VALUES(image_data)");
        }
        $pStmt->execute([$filename, $base64Image]);
    } catch (Throwable $e) {
        // Fail-safe jika tabel DB gagal
    }

    // 2. Simpan juga ke file lokal jika direktori bisa ditulis (untuk XAMPP dev)
    @file_put_contents($filePath, $finalImageBytes);

    // 9. Simpan/Update Rekaman di Tabel attendances lengkap dengan data lokasi
    $fileUrl = '/uploads/' . $filename;

    if ($tipe === 'MASUK') {
        $insStmt = $pdo->prepare(
            "INSERT INTO attendances (
                user_id, tanggal, waktu_masuk, foto_masuk, 
                latitude_masuk, longitude_masuk, akurasi_masuk, lokasi_masuk
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $insStmt->execute([
            (int)$user['id'], 
            $dateKey, 
            $timeStr, 
            $fileUrl,
            $latitude,
            $longitude,
            $accuracy,
            $lokasiClean
        ]);
    } else {
        $updStmt = $pdo->prepare(
            "UPDATE attendances 
             SET waktu_pulang = ?, 
                 foto_pulang = ?, 
                 latitude_pulang = ?, 
                 longitude_pulang = ?, 
                 akurasi_pulang = ?, 
                 lokasi_pulang = ? 
             WHERE id = ?"
        );
        $updStmt->execute([
            $timeStr, 
            $fileUrl,
            $latitude,
            $longitude,
            $accuracy,
            $lokasiClean,
            (int)$existing['id']
        ]);
    }

    // 10. Berikan Response JSON Sukses dengan Detail Lokasi
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Absen ' . strtolower($tipe) . ' berhasil diverifikasi bersama lokasi Anda.',
        'data' => [
            'nama' => $user['nama'],
            'role' => $user['role'],
            'tipe' => $tipe,
            'hari_tanggal_lengkap' => $fullDateStr,
            'waktu_presisi' => $timeStr,
            'url_foto' => $fileUrl,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'akurasi' => $accuracy,
            'lokasi' => $lokasiClean
        ]
    ]);
    exit();

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server saat memproses absensi: ' . $e->getMessage()
    ]);
    exit();
}
