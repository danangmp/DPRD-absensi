<?php
// ==========================================================
// Konfigurasi Database MySQL (PDO)
// Mendukung konfigurasi lokal (XAMPP) dan Environment Variable Online
// ==========================================================

date_default_timezone_set('Asia/Jakarta');

$host     = getenv('DB_HOST') ?: 'localhost';
$dbname   = getenv('DB_NAME') ?: 'absensi_db';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ''; // Default password XAMPP kosong

try {
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $username, $password, $options);

    // Inisialisasi otomatis tabel settings & default master_pin '1234'
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('master_pin', '1234')");

    // Auto-migration untuk kolom lokasi di tabel attendances (jika belum ada)
    try {
        $pdo->exec("ALTER TABLE attendances 
            ADD COLUMN IF NOT EXISTS latitude_masuk DECIMAL(10, 8) NULL AFTER foto_masuk,
            ADD COLUMN IF NOT EXISTS longitude_masuk DECIMAL(11, 8) NULL AFTER latitude_masuk,
            ADD COLUMN IF NOT EXISTS akurasi_masuk DECIMAL(8, 2) NULL AFTER longitude_masuk,
            ADD COLUMN IF NOT EXISTS lokasi_masuk TEXT NULL AFTER akurasi_masuk,
            ADD COLUMN IF NOT EXISTS latitude_pulang DECIMAL(10, 8) NULL AFTER foto_pulang,
            ADD COLUMN IF NOT EXISTS longitude_pulang DECIMAL(11, 8) NULL AFTER latitude_pulang,
            ADD COLUMN IF NOT EXISTS akurasi_pulang DECIMAL(8, 2) NULL AFTER longitude_pulang,
            ADD COLUMN IF NOT EXISTS lokasi_pulang TEXT NULL AFTER akurasi_pulang");
    } catch (Throwable $migrationErr) {
        // Abaikan jika sudah ada atau tabel belum dibuat
    }

} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database MySQL gagal: ' . $e->getMessage()
    ]);
    exit();
}

/**
 * Memverifikasi apakah $inputPin cocok dengan master_pin di tabel settings
 */
function verifyMasterPin($pdo, $inputPin) {
    try {
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'master_pin' LIMIT 1");
        $stmt->execute();
        $row = $stmt->fetch();
        if (!$row) {
            return false;
        }
        return (string)$row['setting_value'] === (string)$inputPin;
    } catch (PDOException $e) {
        return false;
    }
}

/**
 * Memperbarui nilai master_pin di tabel settings
 */
function updateMasterPin($pdo, $newPin) {
    $stmt = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'master_pin'");
    return $stmt->execute([(string)$newPin]);
}
