<?php
// ==========================================================
// Endpoint: auth_admin.php (POST)
// Validasi Master PIN Keamanan Admin via tabel settings
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

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

$input = json_decode(file_get_contents("php://input"), true) ?? [];
$pin = isset($input['pin']) ? trim((string)$input['pin']) : '';

if (verifyMasterPin($pdo, $pin)) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Otorisasi Admin berhasil.'
    ]);
    exit();
}

http_response_code(401);
echo json_encode([
    'success' => false,
    'message' => 'PIN Admin salah. Akses ditolak.'
]);
exit();
