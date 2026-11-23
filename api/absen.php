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

require_once __DIR__ . '/../php-backend/config.php';

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

    if ($imageData === false) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Format gambar Base64 tidak valid.'
        ]);
        exit();
    }

    // 8. Watermarking Profesional menggunakan PHP GD Library (Permanen pada Piksel Foto)
    $savedWithGd = false;
    try {
        $gdImg = @imagecreatefromstring($imageData);
        if ($gdImg !== false) {
            $imgWidth = imagesx($gdImg);
            $imgHeight = imagesy($gdImg);

            // Banner proporsional di bagian bawah foto (tinggi 92px)
            $bannerHeight = 92;
            $bannerY = max(0, $imgHeight - $bannerHeight);

            imagealphablending($gdImg, true);
            imagesavealpha($gdImg, true);

            // Lapisan hitam semi-transparan bergradasi elegan (~78% kegelapan)
            $overlayColor = imagecolorallocatealpha($gdImg, 10, 15, 26, 28);
            imagefilledrectangle($gdImg, 0, $bannerY, $imgWidth, $imgHeight, $overlayColor);

            // Garis pembatas aksen Cyan/Sky di puncak watermark
            $accentLine = imagecolorallocate($gdImg, 56, 189, 248);
            imageline($gdImg, 0, $bannerY, $imgWidth, $bannerY, $accentLine);
            imageline($gdImg, 0, $bannerY + 1, $imgWidth, $bannerY + 1, $accentLine);

            $whiteColor = imagecolorallocate($gdImg, 255, 255, 255);
            $greenColor = imagecolorallocate($gdImg, 52, 211, 153);
            $skyColor = imagecolorallocate($gdImg, 186, 230, 253);
            $yellowColor = imagecolorallocate($gdImg, 253, 224, 71);

            // Baris 1: Identitas User, Tipe, & Waktu Jam
            $line1 = "[{$tipe}] {$user['nama']} ({$user['role']}) - {$timeStr} WIB";
            // Baris 2: Hari, Tanggal & Penanda Verifikasi Anti-Manipulasi
            $line2 = "{$fullDateStr} | Stempel Anti-Manipulasi GPS";
            // Baris 3: Nama Lokasi / Alamat (Dibatasi agar pas di frame)
            $lokasiDisplay = $lokasiClean;
            if (strlen($lokasiDisplay) > 68) {
                $lokasiDisplay = substr($lokasiDisplay, 0, 65) . '...';
            }
            $line3 = "Lokasi: {$lokasiDisplay}";
            // Baris 4: Koordinat Geografis GPS & Toleransi Akurasi
            $line4 = "GPS: Lat {$latFormatted}, Lon {$lonFormatted} (Akurasi: +/-{$accFormatted}m)";

            imagestring($gdImg, 5, 14, $bannerY + 7, $line1, $whiteColor);
            imagestring($gdImg, 3, 14, $bannerY + 28, $line2, $greenColor);
            imagestring($gdImg, 3, 14, $bannerY + 47, $line3, $skyColor);
            imagestring($gdImg, 3, 14, $bannerY + 66, $line4, $yellowColor);

            imagejpeg($gdImg, $filePath, 92);
            imagedestroy($gdImg);
            $savedWithGd = true;
        }
    } catch (Throwable $e) {
        $savedWithGd = false;
    }

    // Fallback jika GD gagal
    if (!$savedWithGd) {
        file_put_contents($filePath, $imageData);
    }

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

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server saat memproses absensi: ' . $e->getMessage()
    ]);
    exit();
}
