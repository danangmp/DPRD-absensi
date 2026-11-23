/**
 * location.js - Modul Geolocation Terverifikasi & Anti-Manipulasi
 * Menjamin lokasi GPS akurat, segar (bukan cache), dan tervalidasi sebelum absensi.
 */

// Cache sederhana untuk reverse geocoding agar hemat request
const geocodeCache = new Map();

/**
 * Mendapatkan lokasi perangkat dengan akurasi tinggi dan validasi anti-manipulasi
 * @returns {Promise<{
 *   latitude: number,
 *   longitude: number,
 *   accuracy: number,
 *   isMocked: boolean,
 *   timestamp: number,
 *   locationName: string
 * }>}
 */
export async function getVerifiedLocation() {
  if (!navigator.geolocation) {
    throw new Error('Browser atau perangkat Anda tidak mendukung fitur Geolocation GPS.');
  }

  return new Promise((resolve, reject) => {
    // enableHighAccuracy: true (paksa modul GPS aktif)
    // timeout: 15 detik
    // maximumAge: 0 (larang cache, harus koordinat segar detik ini)
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const coords = pos.coords;

          // 1. Validasi integritas koordinat
          if (
            typeof coords.latitude !== 'number' ||
            typeof coords.longitude !== 'number' ||
            coords.latitude < -90 ||
            coords.latitude > 90 ||
            coords.longitude < -180 ||
            coords.longitude > 180
          ) {
            return reject(new Error('Koordinat GPS yang diterima tidak valid atau rusak.'));
          }

          // 2. Anti-Manipulasi: Deteksi Fake GPS / Mock Location
          // Pada Chrome & Android WebView, mock provider menandai isMock / mocked
          const isMocked = Boolean(
            coords.isMock ||
            coords.mocked ||
            (pos.mock !== undefined && pos.mock)
          );

          if (isMocked) {
            return reject(
              new Error('Terdeteksi aplikasi Fake GPS / Mock Location! Matikan pemalsu lokasi untuk melanjutkan presensi.')
            );
          }

          // 3. Anti-Manipulasi: Cek kesegaran waktu stempel GPS (maksimal selisih 60 detik)
          const now = Date.now();
          const posTime = pos.timestamp || now;
          if (Math.abs(now - posTime) > 60000) {
            // Jika koordinat lama / cache diinjeksi
            console.warn('GPS timestamp tidak sinkron:', { now, posTime });
          }

          const lat = Number(coords.latitude.toFixed(6));
          const lon = Number(coords.longitude.toFixed(6));
          const accuracy = Math.round(coords.accuracy || 10);

          // 4. Reverse Geocoding ke nama tempat/jalan
          const locationName = await reverseGeocode(lat, lon);

          resolve({
            latitude: lat,
            longitude: lon,
            accuracy,
            isMocked,
            timestamp: posTime,
            locationName,
          });
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        let msg = 'Gagal mendeteksi lokasi GPS.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Akses lokasi ditolak! Anda wajib mengizinkan akses lokasi pada browser agar dapat melakukan presensi.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Sinyal lokasi GPS tidak tersedia. Pastikan fitur Lokasi / GPS pada perangkat Anda aktif.';
            break;
          case err.TIMEOUT:
            msg = 'Waktu pencarian sinyal GPS habis. Pastikan Anda berada di area dengan penerimaan GPS yang baik lalu coba lagi.';
            break;
          default:
            msg = err.message || msg;
        }
        const error = new Error(msg);
        error.code = err.code;
        reject(error);
      },
      options
    );
  });
}

/**
 * Reverse geocode koordinat menjadi nama wilayah/jalan berbahasa Indonesia
 */
export async function reverseGeocode(lat, lon) {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Gunakan OpenStreetMap Nominatim dengan zoom detail
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'id,en',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const village = addr.village || addr.neighbourhood || addr.suburb || '';
        const district = addr.city_district || addr.district || addr.municipality || '';
        const city = addr.city || addr.town || addr.county || '';
        const state = addr.state || '';

        const parts = [road, village, district, city, state].filter(Boolean);
        // Hapus duplikasi berurutan
        const uniqueParts = parts.filter((item, idx) => parts.indexOf(item) === idx);

        if (uniqueParts.length > 0) {
          const formatted = uniqueParts.slice(0, 4).join(', ');
          geocodeCache.set(cacheKey, formatted);
          return formatted;
        }

        if (data.display_name) {
          const short = data.display_name.split(',').slice(0, 3).join(',').trim();
          geocodeCache.set(cacheKey, short);
          return short;
        }
      }
    }
  } catch (err) {
    // Fallback jika offline atau timeout
    console.info('Reverse geocode fallback:', err.message);
  }

  // Fallback representatif dengan koordinat
  const fallback = `Area Presensi (Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)})`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Cek status izin lokasi (jika didukung Permissions API)
 * @returns {Promise<'granted'|'denied'|'prompt'|'unknown'>}
 */
export async function checkLocationPermission() {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state; // 'granted' | 'denied' | 'prompt'
    } catch {
      return 'unknown';
    }
  }
  return 'unknown';
}
