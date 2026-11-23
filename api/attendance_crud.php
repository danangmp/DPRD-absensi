<?php
// ==========================================================
// Endpoint: attendance_crud.php (POST / PUT / DELETE)
// Manajemen CRUD Data Presensi Kehadiran oleh Administrator
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

date_default_timezone_set('Asia/Jakarta');

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true) ?? [];

// ----------------------------------------------------------
// 1. CREATE: Tambah Presensi Manual (POST)
// ----------------------------------------------------------
if ($method === 'POST') {
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $tanggal = isset($input['tanggal']) ? trim($input['tanggal']) : date('Y-m-d');
    $waktuMasuk = isset($input['waktu_masuk']) ? trim($input['waktu_masuk']) : date('H:i:s');
    $waktuPulang = !empty($input['waktu_pulang']) ? trim($input['waktu_pulang']) : null;
    $lokasi = !empty($input['lokasi']) ? trim($input['lokasi']) : 'Presensi Manual oleh Admin';

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Pilih peserta yang valid.']);
        exit();
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Format tanggal harus YYYY-MM-DD.']);
        exit();
    }

    // Pastikan user terdaftar
    $userCheck = $pdo->prepare("SELECT id, nama, role FROM users WHERE id = ?");
    $userCheck->execute([$userId]);
    $user = $userCheck->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Data peserta tidak ditemukan.']);
        exit();
    }

    // Cek apakah presensi pada tanggal tersebut sudah ada
    $checkExist = $pdo->prepare("SELECT id FROM attendances WHERE user_id = ? AND tanggal = ?");
    $checkExist->execute([$userId, $tanggal]);
    if ($checkExist->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Data presensi untuk {$user['nama']} pada tanggal {$tanggal} sudah ada."]);
        exit();
    }

    try {
        $ins = $pdo->prepare("
            INSERT INTO attendances (
                user_id, tanggal, waktu_masuk, waktu_pulang, 
                lokasi_masuk, lokasi_pulang, latitude_masuk, longitude_masuk, akurasi_masuk
            ) VALUES (?, ?, ?, ?, ?, ?, -7.549136, 110.782610, 10.00)
        ");
        $ins->execute([
            $userId, 
            $tanggal, 
            $waktuMasuk, 
            $waktuPulang, 
            $lokasi, 
            $waktuPulang ? $lokasi : null
        ]);

        http_response_code(201);
        echo json_encode([
            'success' => true, 
            'message' => "Presensi manual untuk {$user['nama']} berhasil ditambahkan."
        ]);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal menyimpan presensi: ' . $e->getMessage()]);
        exit();
    }
}

// ----------------------------------------------------------
// 2. UPDATE: Edit Data Presensi (PUT)
// ----------------------------------------------------------
if ($method === 'PUT') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    $waktuMasuk = isset($input['waktu_masuk']) ? trim($input['waktu_masuk']) : '';
    $waktuPulang = isset($input['waktu_pulang']) ? trim($input['waktu_pulang']) : null;
    $lokasiMasuk = isset($input['lokasi_masuk']) ? trim($input['lokasi_masuk']) : null;
    $lokasiPulang = isset($input['lokasi_pulang']) ? trim($input['lokasi_pulang']) : null;

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID data presensi tidak valid.']);
        exit();
    }

    $findStmt = $pdo->prepare("SELECT id FROM attendances WHERE id = ?");
    $findStmt->execute([$id]);
    if (!$findStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Data presensi tidak ditemukan.']);
        exit();
    }

    try {
        $upd = $pdo->prepare("
            UPDATE attendances 
            SET waktu_masuk = COALESCE(NULLIF(?, ''), waktu_masuk),
                waktu_pulang = ?,
                lokasi_masuk = COALESCE(?, lokasi_masuk),
                lokasi_pulang = COALESCE(?, lokasi_pulang)
            WHERE id = ?
        ");
        $upd->execute([
            $waktuMasuk,
            $waktuPulang !== '' ? $waktuPulang : null,
            $lokasiMasuk,
            $lokasiPulang,
            $id
        ]);

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Data presensi berhasil diperbarui.']);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal mengupdate presensi: ' . $e->getMessage()]);
        exit();
    }
}

// ----------------------------------------------------------
// 3. DELETE: Hapus Data Presensi (DELETE)
// ----------------------------------------------------------
if ($method === 'DELETE') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID data presensi wajib disertakan.']);
        exit();
    }

    try {
        $del = $pdo->prepare("DELETE FROM attendances WHERE id = ?");
        $del->execute([$id]);

        if ($del->rowCount() > 0) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Data presensi berhasil dihapus.']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Data presensi tidak ditemukan atau sudah dihapus.']);
        }
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Gagal menghapus presensi: ' . $e->getMessage()]);
        exit();
    }
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Metode HTTP tidak didukung.']);
