-- Skema Database PostgreSQL untuk Neon Serverless
-- Kompatibel dengan Neon (https://console.neon.tech)

-- 1. Tabel users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel attendances
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    tanggal DATE NOT NULL,
    waktu_masuk TIME WITHOUT TIME ZONE DEFAULT NULL,
    foto_masuk VARCHAR(255) DEFAULT NULL,
    latitude_masuk DECIMAL(10, 8) DEFAULT NULL,
    longitude_masuk DECIMAL(11, 8) DEFAULT NULL,
    akurasi_masuk DECIMAL(8, 2) DEFAULT NULL,
    lokasi_masuk TEXT DEFAULT NULL,
    waktu_pulang TIME WITHOUT TIME ZONE DEFAULT NULL,
    foto_pulang VARCHAR(255) DEFAULT NULL,
    latitude_pulang DECIMAL(10, 8) DEFAULT NULL,
    longitude_pulang DECIMAL(11, 8) DEFAULT NULL,
    akurasi_pulang DECIMAL(8, 2) DEFAULT NULL,
    lokasi_pulang TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel settings
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
);

-- Inisialisasi default master_pin
INSERT INTO settings (setting_key, setting_value)
VALUES ('master_pin', '1234')
ON CONFLICT (setting_key) DO NOTHING;

-- Indeks untuk performa query rekapitulasi tanggal
CREATE INDEX IF NOT EXISTS idx_attendances_user_id ON attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_tanggal ON attendances(tanggal);
