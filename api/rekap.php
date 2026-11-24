<?php
// ==========================================================
// Endpoint: rekap.php (GET)
// Mengambil data absensi harian atau bulanan (default: hari ini WIB)
// Mendukung filter tanggal spesifik (tanggal=YYYY-MM-DD)
// atau filter bulanan (bulan=YYYY-MM atau bulan=1..12 & tahun=YYYY)
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

require_once file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/../config.php';

// Cek apakah mode bulanan aktif
$isMonthly = false;
$startDate = null;
$endDate = null;
$selectedBulan = null;
$selectedTahun = null;

if (isset($_GET['bulan']) && !empty($_GET['bulan'])) {
    $bulanParam = trim($_GET['bulan']);
    if (preg_match('/^\d{4}-\d{2}$/', $bulanParam)) {
        // Format YYYY-MM
        $parts = explode('-', $bulanParam);
        $selectedTahun = (int)$parts[0];
        $selectedBulan = (int)$parts[1];
        $isMonthly = true;
    } elseif (is_numeric($bulanParam) && (int)$bulanParam >= 1 && (int)$bulanParam <= 12) {
        $selectedBulan = (int)$bulanParam;
        $selectedTahun = isset($_GET['tahun']) && is_numeric($_GET['tahun']) ? (int)$_GET['tahun'] : (int)date('Y');
        $isMonthly = true;
    }
}

// Filter role opsional (Magang / Staf)
$roleFilter = isset($_GET['role']) && in_array(trim($_GET['role']), ['Magang', 'Staf']) ? trim($_GET['role']) : null;

try {
    if ($isMonthly) {
        $startDate = sprintf('%04d-%02d-01', $selectedTahun, $selectedBulan);
        $endDate = date('Y-m-t', strtotime($startDate));
        $periodeStr = sprintf('%04d-%02d', $selectedTahun, $selectedBulan);

        $sql = "
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
            WHERE a.tanggal >= :start_date AND a.tanggal <= :end_date
        ";

        $params = [
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ];

        if ($roleFilter !== null) {
            $sql .= " AND u.role = :role";
            $params[':role'] = $roleFilter;
        }

        $sql .= " ORDER BY a.tanggal ASC, a.waktu_masuk ASC, u.nama ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'mode' => 'bulanan',
            'periode' => $periodeStr,
            'bulan' => $selectedBulan,
            'tahun' => $selectedTahun,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total' => count($records),
            'data' => $records
        ]);
        exit();

    } else {
        // Mode harian default
        $tanggal = isset($_GET['tanggal']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['tanggal'])
            ? $_GET['tanggal']
            : date('Y-m-d');

        $sql = "
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
        ";

        $params = [':tanggal' => $tanggal];

        if ($roleFilter !== null) {
            $sql .= " AND u.role = :role";
            $params[':role'] = $roleFilter;
        }

        $sql .= " ORDER BY a.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'mode' => 'harian',
            'tanggal' => $tanggal,
            'total' => count($records),
            'data' => $records
        ]);
        exit();
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data absensi: ' . $e->getMessage()
    ]);
    exit();
}
