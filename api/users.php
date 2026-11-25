<?php
// ==========================================================
// Endpoint: users.php (GET & POST)
// ==========================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Tangani Preflight Request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../php-backend/config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ----------------------------------------------------------
// 1. GET: Mengambil semua user (tanpa PIN)
// ----------------------------------------------------------
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, nama, role FROM users ORDER BY LOWER(TRIM(nama)) ASC, id ASC");
        $users = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $users
        ]);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal mengambil data user: ' . $e->getMessage()
        ]);
        exit();
    }
}

// ----------------------------------------------------------
// 2. POST: Menambah user baru dengan validasi admin_pin '1234'
// ----------------------------------------------------------
if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    $nama = isset($input['nama']) ? trim($input['nama']) : '';
    $role = isset($input['role']) ? trim($input['role']) : '';
    $pin = isset($input['pin']) ? trim($input['pin']) : '';
    $adminPin = isset($input['admin_pin']) ? trim($input['admin_pin']) : '';

    // A. Validasi kelengkapan field
    if ($nama === '' || $role === '' || $pin === '' || $adminPin === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Field nama, role, pin, dan admin_pin wajib diisi.'
        ]);
        exit();
    }

    // B. Validasi format PIN baru: 4 digit angka
    if (!preg_match('/^\d{4}$/', $pin)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'PIN baru harus berupa 4 digit angka.'
        ]);
        exit();
    }

    // C. Validasi role: Magang atau Staf
    if ($role !== 'Magang' && $role !== 'Staf') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Role hanya boleh 'Magang' atau 'Staf'."
        ]);
        exit();
    }

    // D. Validasi otorisasi Master PIN Admin
    if (!verifyMasterPin($pdo, $adminPin)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'PIN Otorisasi (PIN Admin) salah. Akses ditolak.'
        ]);
        exit();
    }

    try {
        // E. Cek duplikasi nama (case-insensitive)
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(nama) = LOWER(?) LIMIT 1");
        $checkStmt->execute([$nama]);
        if ($checkStmt->fetch()) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nama "' . $nama . '" sudah terdaftar di sistem.'
            ]);
            exit();
        }

        // F. Simpan peserta baru ke tabel users
        $insertStmt = $pdo->prepare("INSERT INTO users (nama, role, pin) VALUES (?, ?, ?)");
        $insertStmt->execute([$nama, $role, $pin]);
        $newId = (int)$pdo->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Peserta "' . $nama . '" berhasil ditambahkan sebagai ' . $role . '.',
            'data' => [
                'id' => $newId,
                'nama' => $nama,
                'role' => $role
            ]
        ]);
        exit();
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server saat menambahkan peserta: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Metode HTTP selain GET dan POST tidak didukung
http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Metode HTTP ' . $method . ' tidak diizinkan pada endpoint ini.'
]);
exit();

