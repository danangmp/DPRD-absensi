<?php
// ==========================================================
// Endpoint: change_pin.php (POST)
// Mengubah Master PIN Keamanan Administrator
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$oldPin = isset($input['old_pin']) ? trim((string)$input['old_pin']) : '';
$newPin = isset($input['new_pin']) ? trim((string)$input['new_pin']) : '';
$confirmPin = isset($input['confirm_pin']) ? trim((string)$input['confirm_pin']) : '';

// 1. Validasi semua field wajib diisi
if ($oldPin === '' || $newPin === '' || $confirmPin === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Semua field (PIN lama, PIN baru, konfirmasi PIN) wajib diisi.'
    ]);
    exit();
}

// 2. Validasi format PIN baru: 4 sampai 6 digit angka
if (!preg_match('/^\d{4,6}$/', $newPin)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'PIN Master baru harus berupa 4 sampai 6 digit angka.'
    ]);
    exit();
}

// 3. Validasi konfirmasi PIN baru harus cocok
if ($newPin !== $confirmPin) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Konfirmasi PIN baru tidak cocok.'
    ]);
    exit();
}

// 4. Validasi PIN baru tidak boleh sama dengan PIN lama
if ($newPin === $oldPin) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'PIN baru tidak boleh sama dengan PIN lama.'
    ]);
    exit();
}

// 5. Verifikasi PIN Master lama
if (!verifyMasterPin($pdo, $oldPin)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'PIN Master lama tidak sesuai'
    ]);
    exit();
}

// 6. Perbarui PIN Master di database
try {
    updateMasterPin($pdo, $newPin);
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'PIN Master berhasil diperbarui'
    ]);
    exit();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server saat memperbarui PIN Master: ' . $e->getMessage()
    ]);
    exit();
}

