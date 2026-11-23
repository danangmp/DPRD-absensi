<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

try {
    $stmt = $pdo->query("SELECT 1 AS ok");
    $result = $stmt->fetch();
    echo json_encode([
        'success' => true,
        'message' => 'API Presensi Digital DPRD Surakarta Aktif',
        'database' => 'Connected to Neon PostgreSQL'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $e->getMessage()
    ]);
}
