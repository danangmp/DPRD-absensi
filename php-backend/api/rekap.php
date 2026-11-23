<?php
// ==========================================================
// Endpoint: rekap.php (GET)
// Mengambil data absensi berdasarkan tanggal (default: hari ini WIB)
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

date_default_timezone_set('Asia/Jakarta');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode HTTP ' . $_SERVER['REQUEST_METHOD'] . ' tidak diizinkan. Gunakan GET.'
    ]);
    exit();
}

require_once __DIR__ . '/../config.php';

// Ambil parameter tanggal (default ke hari ini Y-m-d WIB)
$tanggal = isset($_GET['tanggal']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['tanggal'])
    ? $_GET['tanggal']
    : date('Y-m-d');

try {
    $stmt = $pdo->prepare("
        SELECT 
            a.id, 
            a.user_id, 
            u.nama, 
            u.role, 
            a.tanggal, 
            a.waktu_masuk, 
            a.foto_masuk, 
            a.latitude_masuk,
            a.longitude_masuk,
            a.akurasi_masuk,
            a.lokasi_masuk,
            a.waktu_pulang, 
            a.foto_pulang,
            a.latitude_pulang,
            a.longitude_pulang,
            a.akurasi_pulang,
            a.lokasi_pulang
        FROM attendances a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.tanggal = :tanggal 
        ORDER BY a.id DESC
    ");
    $stmt->execute([':tanggal' => $tanggal]);
    $records = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'tanggal' => $tanggal,
        'data' => $records
    ]);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data absensi: ' . $e->getMessage()
    ]);
    exit();
}

