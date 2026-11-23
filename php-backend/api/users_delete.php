<?php
// ==========================================================
// Endpoint: users_delete.php (DELETE / POST)
// Menghapus peserta & file foto terkait dengan otorisasi admin_pin
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

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'DELETE' && $method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metode HTTP ' . $method . ' tidak diizinkan. Gunakan DELETE.'
    ]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true) ?? [];

// Dapatkan ID dari query string ($_GET['id']), body JSON, atau PATH_INFO
$id = $_GET['id'] ?? $input['id'] ?? null;
if (!$id && !empty($_SERVER['PATH_INFO'])) {
    $parts = explode('/', trim($_SERVER['PATH_INFO'], '/'));
    if (!empty($parts[0]) && is_numeric($parts[0])) {
        $id = $parts[0];
    }
}

$adminPin = isset($input['admin_pin']) ? trim($input['admin_pin']) : ($_GET['admin_pin'] ?? '');

// A. Validasi otorisasi PIN Admin
if ($adminPin === '') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'PIN Admin wajib diisi untuk otorisasi penghapusan.'
    ]);
    exit();
}

if (!verifyMasterPin($pdo, $adminPin)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'PIN Otorisasi (PIN Admin) salah. Penghapusan ditolak.'
    ]);
    exit();
}

// B. Validasi parameter ID
if (!$id || !is_numeric($id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID peserta tidak valid atau tidak disertakan.'
    ]);
    exit();
}

try {
    // C. Cek keberadaan target user
    $stmt = $pdo->prepare("SELECT id, nama, role FROM users WHERE id = ?");
    $stmt->execute([(int)$id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Peserta tidak ditemukan.'
        ]);
        exit();
    }

    // D. Ambil daftar file foto terkait dari tabel attendances sebelum dihapus
    $attStmt = $pdo->prepare("SELECT foto_masuk, foto_pulang FROM attendances WHERE user_id = ?");
    $attStmt->execute([(int)$id]);
    $attendances = $attStmt->fetchAll();

    // E. Eksekusi penghapusan permanen menggunakan database transaction
    $pdo->beginTransaction();

    $delAtt = $pdo->prepare("DELETE FROM attendances WHERE user_id = ?");
    $delAtt->execute([(int)$id]);

    $delUser = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $delUser->execute([(int)$id]);

    $pdo->commit();

    // F. Hapus file fisik foto di folder uploads/
    $uploadsDir = __DIR__ . '/../uploads';
    foreach ($attendances as $att) {
        if (!empty($att['foto_masuk'])) {
            $fileMasuk = $uploadsDir . '/' . basename($att['foto_masuk']);
            if (file_exists($fileMasuk)) {
                @unlink($fileMasuk);
            }
        }
        if (!empty($att['foto_pulang'])) {
            $filePulang = $uploadsDir . '/' . basename($att['foto_pulang']);
            if (file_exists($filePulang)) {
                @unlink($filePulang);
            }
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Peserta berhasil dihapus secara permanen.',
        'data' => [
            'id' => (int)$user['id'],
            'nama' => $user['nama'],
            'role' => $user['role']
        ]
    ]);
    exit();

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server saat menghapus peserta: ' . $e->getMessage()
    ]);
    exit();
}

