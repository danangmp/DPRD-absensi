import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  LocateFixed,
  Compass
} from 'lucide-react';
import WebcamCapture from './components/WebcamCapture';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthModal from './components/AdminAuthModal';
import { getUsers, submitAbsen } from './services/api';
import { getVerifiedLocation } from './services/location';
import dprdLogo from './assets/logo.jpg';

function App() {
  const [currentView, setCurrentView] = useState('PRESENSI'); // 'PRESENSI' | 'ADMIN'
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'MASUK' | 'PULANG' | null
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', message: string, detail?: object }

  // State Pelacakan Lokasi GPS Anti-Manipulasi
  const [locationData, setLocationData] = useState(null); // { latitude, longitude, accuracy, locationName, isMocked, timestamp }
  const [locationStatus, setLocationStatus] = useState('IDLE'); // 'IDLE' | 'LOADING' | 'SUCCESS' | 'DENIED' | 'ERROR'
  const [locationError, setLocationError] = useState('');

  const [currentTime, setCurrentTime] = useState(new Date());

  const webcamRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format waktu WIB untuk Top Navbar
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(currentTime);

  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(currentTime);

  // Fungsi Mendapatkan & Mengunci Sinyal Lokasi GPS
  const requestLocation = async (silent = false) => {
    setLocationStatus('LOADING');
    setLocationError('');
    try {
      const loc = await getVerifiedLocation();
      setLocationData(loc);
      setLocationStatus('SUCCESS');
      return loc;
    } catch (err) {
      console.error('Error lokasi:', err);
      setLocationStatus(err.code === 1 ? 'DENIED' : 'ERROR');
      setLocationError(err.message || 'Gagal mendeteksi lokasi GPS.');
      if (!silent) {
        setStatusMessage({
          type: 'error',
          message: err.message || 'Izin lokasi wajib diberikan untuk absensi.'
        });
      }
      return null;
    }
  };

  // Mengambil daftar user dari server & inisialisasi lokasi GPS
  const fetchUsers = async (selectUserId = null) => {
    try {
      const res = await getUsers();
      if (res && res.success && Array.isArray(res.data)) {
        setUsers(res.data);
        if (selectUserId) {
          setSelectedUser(String(selectUserId));
        } else if (res.data.length > 0) {
          setSelectedUser((prev) => (prev ? prev : String(res.data[0].id)));
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data user:', err);
      setStatusMessage({
        type: 'error',
        message: 'Gagal terhubung ke backend server. Pastikan Apache & MySQL XAMPP sudah berjalan.'
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    // Minta izin dan deteksi lokasi otomatis saat aplikasi dibuka
    requestLocation(true);
  }, []);

  // Handler pengiriman absensi (dengan validasi foto & lokasi wajib)
  const handleAbsen = async (tipe) => {
    setStatusMessage(null);

    if (!selectedUser) {
      setStatusMessage({
        type: 'error',
        message: 'Silakan pilih nama pegawai/magang terlebih dahulu.'
      });
      return;
    }

    if (!pin.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Silakan masukkan 4 digit PIN Anda.'
      });
      return;
    }

    // 1. Verifikasi Izin & Keberadaan Lokasi GPS Wajib
    let activeLocation = locationData;
    if (!activeLocation || !activeLocation.latitude) {
      setIsLoading(true);
      setActiveAction(tipe);
      activeLocation = await requestLocation(false);
      setIsLoading(false);
      setActiveAction(null);

      if (!activeLocation || !activeLocation.latitude) {
        setStatusMessage({
          type: 'error',
          message: 'Izin lokasi wajib diaktifkan! Anda tidak dapat melakukan absensi tanpa verifikasi lokasi GPS.'
        });
        return;
      }
    }

    // 2. Anti-Manipulasi: Periksa Fake GPS / Mocked Location
    if (activeLocation.isMocked) {
      setStatusMessage({
        type: 'error',
        message: 'Terdeteksi aplikasi Fake GPS / Mock Location! Matikan aplikasi pemalsu lokasi untuk dapat absen.'
      });
      return;
    }

    // 3. Verifikasi Sensor Kamera
    if (!webcamRef.current) {
      setStatusMessage({
        type: 'error',
        message: 'Kamera belum siap. Pastikan izin kamera telah diberikan.'
      });
      return;
    }

    const video = webcamRef.current?.video;
    if (!video || video.readyState < 4 || video.videoWidth === 0) {
      setStatusMessage({
        type: 'error',
        message: 'Sensor optik kamera sedang bersiap. Mohon tunggu 1-2 detik hingga tampilan wajah Anda muncul di viewfinder.'
      });
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setStatusMessage({
        type: 'error',
        message: 'Gagal mengambil gambar dari sensor kamera.'
      });
      return;
    }

    setIsLoading(true);
    setActiveAction(tipe);

    try {
      const payload = {
        user_id: Number(selectedUser),
        pin: pin.trim(),
        tipe,
        image: imageSrc,
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        accuracy: activeLocation.accuracy,
        lokasi: activeLocation.locationName,
        is_mocked: activeLocation.isMocked,
      };

      const response = await submitAbsen(payload);

      if (response && response.success) {
        setStatusMessage({
          type: 'success',
          message: response.message || `Absen ${tipe.toLowerCase()} berhasil dicatat bersama lokasi!`,
          detail: response.data
        });

        setTimeout(() => {
          setPin('');
        }, 3000);
      } else {
        setStatusMessage({
          type: 'error',
          message: response?.message || 'Gagal melakukan absensi.'
        });
      }
    } catch (err) {
      console.error('Error saat submit absen:', err);
      const serverError = err.response?.data?.message || err.message || 'Terjadi kesalahan koneksi ke server.';
      setStatusMessage({
        type: 'error',
        message: serverError
      });
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* 1. TOP NAVBAR FULL-WIDTH BERWIBAWA & RESPONSIVE */}
      <header className="top-navbar-container">
        {/* Sisi Kiri: Logo Instansi, Judul & Subjudul */}
        <div className="top-navbar-left">
          <div style={styles.logoBox} className="logo-box-img">
            <img 
              src={dprdLogo} 
              alt="Logo DPRD Kota Surakarta" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <div style={styles.titleColumn}>
            <div style={styles.appTitle} className="app-title-text">PRESENSI DIGITAL</div>
            <div style={styles.agencySubtitle} className="agency-subtitle">Sekretariat DPRD Kota Surakarta</div>
          </div>
        </div>

        {/* Sisi Kanan: Status Sistem, Jam Realtime, & Tombol Panel Admin */}
        <div className="top-navbar-right">
          {/* Pill Status Sistem Aktif */}
          <div style={styles.statusPill} className="nav-status-pill">
            <span className="live-dot-green"></span>
            <span>Sistem Aktif</span>
          </div>

          {/* Tanggal & Jam Digital WIB */}
          <div style={styles.clockPill} className="nav-clock-pill">
            <Clock size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <span style={styles.dateLabel} className="nav-clock-date">{dateStr}</span>
            <span style={styles.clockSeparator} className="nav-clock-sep">|</span>
            <span style={styles.timeValue} className="mono-font">{timeStr} WIB</span>
          </div>

          {/* Tombol Akses Panel Admin */}
          {currentView === 'PRESENSI' && (
            <button
              type="button"
              onClick={() => setIsAdminAuthOpen(true)}
              className="btn-gov-subtle"
              style={styles.adminBtn}
              title="Akses Dashboard Rekap & Manajemen Peserta"
            >
              <Lock size={14} style={{ color: '#38bdf8' }} />
              <span>Panel Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. RENDER VIEW: ADMIN DASHBOARD ATAU KIOSK PRESENSI */}
      {currentView === 'ADMIN' ? (
        <AdminDashboard
          onBack={() => {
            setCurrentView('PRESENSI');
            fetchUsers();
          }}
        />
      ) : (
        <main className="kiosk-main">
          <div className="kiosk-grid">
            {/* Kolom Kiri: Kamera Presensi (~55%) */}
            <div className="camera-column">
              <WebcamCapture ref={webcamRef} />
            </div>

            {/* Kolom Kanan: Formulir Kehadiran (~45%) */}
            <div className="form-column">
              <div className="gov-panel kiosk-form-card" style={styles.formCard}>
                <div style={styles.formHeader}>
                  <div style={styles.formBadge}>
                    <ShieldCheck size={13} style={{ color: '#38bdf8' }} />
                    <span>VERIFIKASI PRESENSI</span>
                  </div>
                  <h2 style={styles.formTitle}>Formulir Kehadiran</h2>
                  <p style={styles.formDesc}>
                    Presensi dinas atau kantor dengan verifikasi biometrik & pelacakan GPS
                  </p>
                </div>

                {/* Dropdown User */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    <User size={14} style={{ color: '#38bdf8' }} />
                    <span>Pilih Pegawai / Siswa Magang</span>
                  </label>
                  <select
                    className="gov-input"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    disabled={isLoading}
                    style={{ cursor: 'pointer', fontSize: '0.94rem' }}
                  >
                    {users.length === 0 ? (
                      <option value="">Memuat data peserta...</option>
                    ) : (
                      users.map((u) => (
                        <option
                          key={u.id}
                          value={u.id}
                          style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
                        >
                          {u.nama} — ({u.role})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Input PIN 4-Digit dengan Show/Hide Toggle */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    <KeyRound size={14} style={{ color: '#38bdf8' }} />
                    <span>PIN Keamanan (4 Digit)</span>
                  </label>
                  <div style={styles.pinWrapper}>
                    <input
                      type={showPin ? 'text' : 'password'}
                      className="gov-input mono-font"
                      maxLength={6}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          handleAbsen('MASUK');
                        }
                      }}
                      style={{
                        letterSpacing: '0.25em',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      style={styles.pinToggleBtn}
                      title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* MODUL WIDGET LOKASI GPS & VERIFIKASI ANTI-MANIPULASI */}
                <div style={styles.locationContainer}>
                  {locationStatus === 'SUCCESS' && locationData && (
                    <div style={styles.locationSuccessCard}>
                      <div style={styles.locHeaderRow}>
                        <div style={styles.locBadge}>
                          <MapPin size={14} style={{ color: '#34d399' }} />
                          <span style={styles.locBadgeText}>LOKASI GPS TERKUNCI</span>
                          <span className="live-dot-green" style={{ marginLeft: '4px' }}></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => requestLocation(false)}
                          disabled={isLoading}
                          style={styles.locRefreshBtn}
                          title="Perbarui koordinat sinyal GPS"
                        >
                          <RefreshCw size={12} />
                          <span>Sinkronkan</span>
                        </button>
                      </div>

                      <div style={styles.locAddress}>
                        {locationData.locationName}
                      </div>

                      <div style={styles.locDetailsRow}>
                        <div style={styles.locCoordItem}>
                          <Compass size={11} style={{ color: '#38bdf8' }} />
                          <span className="mono-font">{locationData.latitude}, {locationData.longitude}</span>
                        </div>
                        <span style={styles.locDivider}>•</span>
                        <div style={styles.locAccuracyItem}>
                          <span>Akurasi: <strong>±{locationData.accuracy}m</strong></span>
                        </div>
                        <span style={styles.locDivider}>•</span>
                        <div style={styles.locSafeBadge}>
                          <ShieldCheck size={11} />
                          <span>GPS Asli</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {locationStatus === 'LOADING' && (
                    <div style={styles.locationLoadingCard}>
                      <Loader2 size={16} className="spin-icon" style={{ color: '#38bdf8' }} />
                      <div style={{ flex: 1 }}>
                        <div style={styles.locLoadingTitle}>Mengunci Sinyal GPS & Sensor...</div>
                        <div style={styles.locLoadingSub}>Memvalidasi keaslian koordinat perangkat Anda</div>
                      </div>
                    </div>
                  )}

                  {(locationStatus === 'DENIED' || locationStatus === 'ERROR' || locationStatus === 'IDLE') && (
                    <div style={styles.locationAlertCard}>
                      <div style={styles.locAlertHeader}>
                        <ShieldAlert size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={styles.locAlertTitle}>
                            {locationStatus === 'DENIED' ? 'Akses Lokasi Wajib Diizinkan!' : 'Izin Lokasi GPS Diperlukan'}
                          </div>
                          <div style={styles.locAlertSub}>
                            {locationStatus === 'DENIED'
                              ? 'Browser Anda menolak izin lokasi. Buka pengaturan browser, izinkan lokasi, lalu klik tombol di bawah.'
                              : 'Untuk memastikan presensi sah dan mencegah manipulasi, wajib aktifkan izin lokasi GPS.'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => requestLocation(false)}
                        className="btn-gov-primary"
                        style={styles.locRequestBtn}
                      >
                        <LocateFixed size={14} />
                        <span>Izinkan & Kunci Lokasi GPS</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifikasi Status Presensi */}
                {statusMessage && (
                  <div
                    style={{
                      ...styles.statusAlert,
                      backgroundColor:
                        statusMessage.type === 'success'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                      borderColor:
                        statusMessage.type === 'success'
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'rgba(239, 68, 68, 0.4)',
                      color:
                        statusMessage.type === 'success' ? '#34d399' : '#f87171',
                    }}
                  >
                    <div style={styles.alertHeaderRow}>
                      {statusMessage.type === 'success' ? (
                        <CheckCircle2 size={18} style={{ minWidth: '18px', flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={18} style={{ minWidth: '18px', flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: '600', lineHeight: '1.3' }}>
                        {statusMessage.message}
                      </span>
                    </div>

                    {statusMessage.detail && (
                      <div style={styles.alertDetailContent}>
                        <div>
                          <strong>{statusMessage.detail.nama}</strong> ({statusMessage.detail.role}) &bull;{' '}
                          Presensi <strong>{statusMessage.detail.tipe}</strong> tercatat pukul{' '}
                          <span className="mono-font" style={{ fontWeight: '700' }}>
                            {statusMessage.detail.waktu_presisi} WIB
                          </span>
                        </div>
                        {statusMessage.detail.lokasi && (
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={12} style={{ color: '#38bdf8' }} />
                            <span>Lokasi: {statusMessage.detail.lokasi}</span>
                          </div>
                        )}
                        <div style={{ marginTop: '2px', fontSize: '0.74rem', color: '#94a3b8' }}>
                          Watermark stempel lokasi & waktu permanen telah dibubuhkan pada foto.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2 Tombol Aksi Utama Ergonomis */}
                <div className="kiosk-button-grid" style={styles.buttonGrid}>
                  <button
                    type="button"
                    onClick={() => handleAbsen('MASUK')}
                    disabled={isLoading}
                    className="btn-action btn-masuk"
                  >
                    {isLoading && activeAction === 'MASUK' ? (
                      <Loader2 size={18} className="spin-icon" />
                    ) : (
                      <LogIn size={18} />
                    )}
                    <span>Absen Masuk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAbsen('PULANG')}
                    disabled={isLoading}
                    className="btn-action btn-pulang"
                  >
                    {isLoading && activeAction === 'PULANG' ? (
                      <Loader2 size={18} className="spin-icon" />
                    ) : (
                      <LogOut size={18} />
                    )}
                    <span>Absen Pulang</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modal Autentikasi Master PIN Admin */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => setCurrentView('ADMIN')}
      />
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    position: 'relative',
    boxSizing: 'border-box',
  },
  topNavbar: {
    height: '70px',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoBox: {
    width: '42px',
    height: '42px',
    borderRadius: '11px',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
    padding: '2px',
    overflow: 'hidden',
  },
  titleColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  appTitle: {
    fontSize: '1.04rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.04em',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
  },
  agencySubtitle: {
    fontSize: '0.78rem',
    color: '#7dd3fc',
    fontWeight: '600',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    border: '1px solid rgba(16, 185, 129, 0.45)',
    color: '#34d399',
    fontSize: '0.78rem',
    fontWeight: '700',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.15)',
  },
  clockPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    padding: '7px 16px',
    borderRadius: '11px',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.28)',
    fontSize: '0.82rem',
    color: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },
  dateLabel: {
    fontWeight: '600',
    color: '#cbd5e1',
  },
  clockSeparator: {
    color: '#64748b',
  },
  timeValue: {
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: '0.03em',
  },
  adminBtn: {
    padding: '8px 16px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.18) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    color: '#38bdf8',
    fontWeight: '700',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.15)',
  },
  kioskMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 32px',
    boxSizing: 'border-box',
    width: '100%',
  },
  kioskGrid: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '30px',
    width: '100%',
    maxWidth: '1100px',
    alignItems: 'center',
  },
  cameraColumn: {
    width: '100%',
  },
  formColumn: {
    width: '100%',
  },
  formCard: {
    padding: '26px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    borderRadius: '18px',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  },
  formHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
  },
  formBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.70rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    color: '#38bdf8',
    marginBottom: '3px',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    padding: '3px 10px',
    borderRadius: '9999px',
    alignSelf: 'flex-start',
  },
  formTitle: {
    margin: 0,
    fontSize: '1.34rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  formDesc: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#cbd5e1',
    lineHeight: '1.4',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#e2e8f0',
  },
  pinWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  pinToggleBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px',
    borderRadius: '6px',
    transition: 'color 0.2s',
  },
  // Style Modul Lokasi GPS
  locationContainer: {
    width: '100%',
  },
  locationSuccessCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.14) 50%, rgba(59, 130, 246, 0.12) 100%)',
    border: '1px solid rgba(45, 212, 191, 0.42)',
    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  locHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
  },
  locBadgeText: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
    color: '#34d399',
  },
  locRefreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '0.74rem',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  locAddress: {
    fontSize: '0.86rem',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.4',
  },
  locDetailsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.74rem',
    color: '#cbd5e1',
    marginTop: '2px',
  },
  locCoordItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '2px 8px',
    borderRadius: '6px',
    color: '#7dd3fc',
    fontWeight: '600',
  },
  locDivider: {
    color: '#475569',
  },
  locAccuracyItem: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    padding: '2px 8px',
    borderRadius: '6px',
    color: '#fde047',
    fontWeight: '600',
  },
  locSafeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    border: '1px solid rgba(16, 185, 129, 0.4)',
    padding: '2px 8px',
    borderRadius: '6px',
    color: '#6ee7b7',
    fontWeight: '700',
  },
  locationLoadingCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(99, 102, 241, 0.12) 100%)',
    border: '1px solid rgba(96, 165, 250, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  locLoadingTitle: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#93c5fd',
  },
  locLoadingSub: {
    fontSize: '0.74rem',
    color: '#cbd5e1',
  },
  locationAlertCard: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.12) 100%)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
  },
  locAlertHeader: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  locAlertTitle: {
    fontSize: '0.84rem',
    fontWeight: '800',
    color: '#fbbf24',
    marginBottom: '2px',
  },
  locAlertSub: {
    fontSize: '0.75rem',
    color: '#f1f5f9',
    lineHeight: '1.4',
  },
  locRequestBtn: {
    width: '100%',
    padding: '9px 14px',
    justifyContent: 'center',
    fontSize: '0.82rem',
    borderRadius: '10px',
  },
  // Notifikasi
  statusAlert: {
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    fontSize: '0.85rem',
  },
  alertHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  alertDetailContent: {
    fontSize: '0.80rem',
    paddingLeft: '26px',
    opacity: 0.95,
    lineHeight: '1.4',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
    marginTop: '6px',
  },
};

export default App;
