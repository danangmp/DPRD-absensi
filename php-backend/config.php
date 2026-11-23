<?php
// ==========================================================
// Konfigurasi Database Multidriver (MySQL & PostgreSQL / Neon)
// Mendukung XAMPP lokal (MySQL) dan Neon Database Online (PostgreSQL)
// ==========================================================

date_default_timezone_set('Asia/Jakarta');

// Cek apakah ada DATABASE_URL (format Neon / Heroku / Vercel: postgresql://user:pass@host:port/dbname)
$databaseUrl = getenv('DATABASE_URL');

if ($databaseUrl) {
    // Mode PostgreSQL (Neon Cloud Database)
    $dbParts = parse_url($databaseUrl);
    
    $host     = $dbParts['host'] ?? 'localhost';
    $port     = $dbParts['port'] ?? 5432;
    $dbname   = ltrim($dbParts['path'] ?? '', '/');
    $username = $dbParts['user'] ?? '';
    $password = $dbParts['pass'] ?? '';
    
    // Parse query params (misal sslmode=require)
    $sslmode = 'require';
    if (!empty($dbParts['query'])) {
        parse_str($dbParts['query'], $queryParams);
        if (isset($queryParams['sslmode'])) {
            $sslmode = $queryParams['sslmode'];
        }
    }
    
    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$sslmode}";
} else {
    // Mode MySQL (Lokal XAMPP / Hosting Tradisional)
    $host     = getenv('DB_HOST') ?: 'localhost';
    $dbname   = getenv('DB_NAME') ?: 'absensi_db';
    $username = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
    
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
}

try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $username, $password, $options);

    // Inisialisasi otomatis tabel settings & default master_pin '1234'
    if (strpos($dsn, 'pgsql:') === 0) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL
        )");
        $pdo->exec("INSERT INTO settings (setting_key, setting_value) VALUES ('master_pin', '1234') ON CONFLICT (setting_key) DO NOTHING");
    } else {
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(50) PRIMARY KEY,
            setting_value VARCHAR(255) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $pdo->exec("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('master_pin', '1234')");
    }

} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $e->getMessage()
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
        if ($row && $row['setting_value'] === (string)$inputPin) {
            return true;
        }
        return false;
    } catch (PDOException $e) {
        return false;
    }
}
