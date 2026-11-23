import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Users, 
  LogOut, 
  Calendar, 
  Search, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  User, 
  UserPlus, 
  Trash2,
  Building2,
  ChevronRight,
  Filter,
  KeyRound,
  MapPin,
  ExternalLink,
  Compass
} from 'lucide-react';
import { SERVER_URL, getUsers, getAttendancesByDate } from '../services/api';
import AddUserModal from './AddUserModal';
import DeleteUserModal from './DeleteUserModal';
import ChangePinModal from './ChangePinModal';
import dprdLogo from '../assets/logo.jpg';

export default function AdminDashboard({ onBack }) {
  const getTodayWIB = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [activeTab, setActiveTab] = useState('REKAP'); // 'REKAP' | 'PESERTA'
  const [selectedDate, setSelectedDate] = useState(getTodayWIB());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'Magang' | 'Staf'

  const [users, setUsers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals inside Admin
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [targetDeleteUser, setTargetDeleteUser] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null); // { url, title, sub }

  const fetchData = async (date = selectedDate) => {
    setIsLoading(true);
    try {
      const [usersRes, attRes] = await Promise.all([
        getUsers(),
        getAttendancesByDate(date)
      ]);

      if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
      if (attRes && attRes.success && Array.isArray(attRes.data)) {
        setAttendances(attRes.data);
      } else {
        setAttendances([]);
      }
    } catch (err) {
      console.error('Error saat mengambil data admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedDate);
  }, [selectedDate]);

  // Statistik Ringkasan
  const totalUsers = users.length;
  const countMasuk = attendances.filter(a => a.waktu_masuk).length;
  const countPulang = attendances.filter(a => a.waktu_pulang).length;
  const countBelumMasuk = Math.max(0, totalUsers - countMasuk);

  // Filter daftar user untuk Rekap Kehadiran
  const filteredUsers = users.filter((u) => {
    const matchSearch = u.nama.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Format tanggal bahasa Indonesia
  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(dateObj);
    } catch {
      return selectedDate;
    }
  })();

  const handleOpenDelete = (user = null) => {
    setTargetDeleteUser(user);
    setIsDeleteUserOpen(true);
  };

  return (
    <div className="admin-workspace" style={styles.workspace}>
      {/* 1. SIDEBAR NAVIGASI KIRI / HEADER MOBILE */}
      <aside className="admin-sidebar" style={styles.sidebar}>
        <div className="admin-sidebar-header" style={styles.sidebarHeader}>
          <div style={styles.instansiBrand}>
            <div style={styles.logoBadge} className="logo-box-img">
              <img 
                src={dprdLogo} 
                alt="Logo DPRD Kota Surakarta" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
            <div>
              <div style={styles.brandTitle}>DPRD SURAKARTA</div>
              <div style={styles.brandSub}>Sekretariat Dewan</div>
            </div>
          </div>
          <div style={styles.adminTag}>
            <ShieldCheck size={12} style={{ color: '#38bdf8' }} />
            <span>PANEL ADMINISTRASI</span>
          </div>
        </div>

        <nav className="admin-nav-menu" style={styles.navMenu}>
          <div style={styles.navSectionLabel}>MENU UTAMA</div>
          <button
            type="button"
            onClick={() => setActiveTab('REKAP')}
            className="admin-nav-item"
            style={{
              ...styles.navItem,
              ...(activeTab === 'REKAP' ? styles.navItemActive : {}),
            }}
          >
            <CalendarCheck size={18} style={activeTab === 'REKAP' ? { color: '#38bdf8' } : {}} />
            <span style={{ flex: 1, textAlign: 'left' }}>Rekap Kehadiran</span>
            {activeTab === 'REKAP' && <ChevronRight size={15} style={{ opacity: 0.8 }} />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PESERTA')}
            className="admin-nav-item"
            style={{
              ...styles.navItem,
              ...(activeTab === 'PESERTA' ? styles.navItemActive : {}),
            }}
          >
            <Users size={18} style={activeTab === 'PESERTA' ? { color: '#38bdf8' } : {}} />
            <span style={{ flex: 1, textAlign: 'left' }}>Manajemen Peserta</span>
            <span style={styles.userCountBadge}>{users.length}</span>
          </button>
        </nav>

        {/* Tombol Aksi Tambahan untuk Tampilan Mobile */}
        <div className="admin-mobile-footer-actions" style={{ display: 'none' }}>
          <button
            type="button"
            onClick={() => setIsChangePinOpen(true)}
            className="btn-gov-subtle"
            style={{ fontSize: '0.74rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
            title="Ubah Master PIN Keamanan Administrator"
          >
            <KeyRound size={13} style={{ color: '#38bdf8' }} />
            <span>Ganti PIN</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-gov-subtle"
            style={{ fontSize: '0.74rem', padding: '6px 12px', flex: 1, justifyContent: 'center' }}
            title="Kembali ke Kiosk Presensi"
          >
            <LogOut size={13} />
            <span>Kiosk</span>
          </button>
        </div>

        {/* Sidebar Footer Desktop: Tombol Ganti PIN & Kembali ke Kiosk */}
        <div style={styles.sidebarFooter} className="admin-sidebar-footer">
          <button
            type="button"
            onClick={() => setIsChangePinOpen(true)}
            className="btn-gov-subtle"
            style={{ ...styles.btnExit, marginBottom: '10px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.25)' }}
            title="Ubah Master PIN Keamanan Administrator"
          >
            <KeyRound size={16} />
            <span>Ganti PIN Master</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-gov-subtle"
            style={styles.btnExit}
            title="Keluar dari Panel Admin dan kembali ke layar presensi utama"
          >
            <LogOut size={16} />
            <span>Kembali ke Kiosk</span>
          </button>
        </div>
      </aside>

      {/* 2. KONTEN UTAMA WORKSPACE */}
      <main className="admin-main-content" style={styles.mainContent}>
        {/* HERO BANNER BERPOLA GEOMETRIS HALUS */}
        <section className="admin-hero-banner" style={styles.heroBanner}>
          <div style={styles.heroLeft}>
            <div style={styles.heroBadge}>
              <span>PORTAL KONTROL PRESENSI</span>
            </div>
            <h1 style={styles.heroTitle}>
              {activeTab === 'REKAP' ? 'Dashboard Rekap Kehadiran' : 'Manajemen Data Peserta'}
            </h1>
            <p style={styles.heroSubtitle}>
              Sekretariat DPRD Kota Surakarta &bull; Pemantauan Kehadiran Pegawai & Siswa Magang
            </p>
          </div>

          <div style={styles.heroRight}>
            <div className="admin-hero-action-group" style={styles.heroActionGroup}>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(true)}
                className="btn-gov-primary"
                style={styles.heroBtn}
              >
                <UserPlus size={15} />
                <span>+ Tambah Peserta</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenDelete(null)}
                className="btn-gov-danger"
                style={styles.heroBtn}
              >
                <Trash2 size={15} />
                <span>Hapus Peserta</span>
              </button>
            </div>
          </div>

          {/* Decorative Geometric Line Accents on Right */}
          <div style={styles.geometricAccent}></div>
        </section>

        {/* TAB 1: REKAP KEHADIRAN */}
        {activeTab === 'REKAP' && (
          <div style={styles.tabContent}>
            {/* BARIS 1: 4 KARTU STATISTIK KPI DENGAN WARNA BERKOMBINASI */}
            <div className="admin-stats-grid" style={styles.statsGrid}>
              <div className="gov-panel admin-stat-card" style={{ ...styles.statCard, background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(30, 58, 138, 0.28) 100%)', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
                <div style={styles.statIconBox('linear-gradient(135deg, #1d4ed8, #3b82f6)', '#ffffff')}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={styles.statLabel}>Total Terdaftar</div>
                  <div style={{ ...styles.statValue, color: '#93c5fd' }}>{totalUsers} <span style={styles.statUnit}>Orang</span></div>
                </div>
              </div>

              <div className="gov-panel admin-stat-card" style={{ ...styles.statCard, background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(6, 78, 59, 0.28) 100%)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                <div style={styles.statIconBox('linear-gradient(135deg, #059669, #10b981)', '#ffffff')}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <div style={styles.statLabel}>Sudah Hadir (Masuk)</div>
                  <div style={{ ...styles.statValue, color: '#34d399' }}>
                    {countMasuk} <span style={styles.statUnit}>Orang</span>
                  </div>
                </div>
              </div>

              <div className="gov-panel admin-stat-card" style={{ ...styles.statCard, background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(8, 51, 68, 0.28) 100%)', border: '1px solid rgba(6, 182, 212, 0.35)' }}>
                <div style={styles.statIconBox('linear-gradient(135deg, #0891b2, #06b6d4)', '#ffffff')}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={styles.statLabel}>Sudah Pulang</div>
                  <div style={{ ...styles.statValue, color: '#38bdf8' }}>
                    {countPulang} <span style={styles.statUnit}>Orang</span>
                  </div>
                </div>
              </div>

              <div className="gov-panel admin-stat-card" style={{ ...styles.statCard, background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(120, 53, 15, 0.28) 100%)', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                <div style={styles.statIconBox('linear-gradient(135deg, #d97706, #f59e0b)', '#ffffff')}>
                  <UserX size={22} />
                </div>
                <div>
                  <div style={styles.statLabel}>Belum Presensi</div>
                  <div style={{ ...styles.statValue, color: countBelumMasuk > 0 ? '#fbbf24' : '#94a3b8' }}>
                    {countBelumMasuk} <span style={styles.statUnit}>Orang</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BARIS 2: TOOLBAR FILTER TANGGAL, PENCARIAN & ROLE */}
            <div className="gov-panel" style={styles.toolbarCard}>
              <div className="admin-toolbar-row" style={styles.toolbarRow}>
                {/* Filter Tanggal */}
                <div className="admin-filter-item" style={styles.filterItem}>
                  <div style={styles.filterTitle}>
                    <Calendar size={14} style={{ color: '#38bdf8' }} />
                    <span>Tanggal Laporan:</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="date"
                      className="gov-input mono-font"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      style={{ width: '160px', padding: '8px 12px', fontSize: '0.86rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => fetchData(selectedDate)}
                      disabled={isLoading}
                      className="btn-gov-subtle"
                      style={{ padding: '8px 12px' }}
                      title="Segarkan Data"
                    >
                      <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
                    </button>
                  </div>
                </div>

                {/* Filter Cari Nama */}
                <div className="admin-filter-item" style={{ ...styles.filterItem, flex: 1, minWidth: '220px' }}>
                  <div style={styles.filterTitle}>
                    <Search size={14} style={{ color: '#38bdf8' }} />
                    <span>Cari Nama:</span>
                  </div>
                  <input
                    type="text"
                    className="gov-input"
                    placeholder="Ketik nama peserta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.86rem' }}
                  />
                </div>

                {/* Filter Kategori Role */}
                <div className="admin-filter-item" style={styles.filterItem}>
                  <div style={styles.filterTitle}>
                    <Filter size={14} style={{ color: '#38bdf8' }} />
                    <span>Filter Role:</span>
                  </div>
                  <div style={styles.roleButtonGroup}>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('ALL')}
                      style={{
                        ...styles.rolePill,
                        ...(roleFilter === 'ALL' ? styles.rolePillActive : {}),
                      }}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('Magang')}
                      style={{
                        ...styles.rolePill,
                        ...(roleFilter === 'Magang' ? styles.rolePillActive : {}),
                      }}
                    >
                      Magang
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleFilter('Staf')}
                      style={{
                        ...styles.rolePill,
                        ...(roleFilter === 'Staf' ? styles.rolePillActive : {}),
                      }}
                    >
                      Staf
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BARIS 3: TABEL PRESENSI DETAIL */}
            <div className="gov-panel" style={styles.tableCard}>
              <div style={styles.tableHeaderRow}>
                <div>
                  <h2 style={styles.tableTitle}>Daftar Kehadiran Pegawai & Magang</h2>
                  <p style={styles.tableSub}>
                    Menampilkan {filteredUsers.length} peserta untuk tanggal <strong style={{ color: '#38bdf8' }}>{formattedDate}</strong>
                  </p>
                </div>
              </div>

              <div className="gov-table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px', textAlign: 'center' }}>No</th>
                      <th>Nama Peserta & Jabatan</th>
                      <th>Waktu Masuk</th>
                      <th style={{ textAlign: 'center' }}>Bukti Foto Masuk</th>
                      <th>Waktu Pulang</th>
                      <th style={{ textAlign: 'center' }}>Bukti Foto Pulang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          {isLoading ? 'Sedang memuat data dari server...' : 'Tidak ada catatan presensi yang sesuai dengan kriteria filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, index) => {
                        const att = attendances.find((a) => a.user_id === u.id);
                        const hasMasuk = !!(att && att.waktu_masuk);
                        const hasPulang = !!(att && att.waktu_pulang);

                        return (
                          <tr key={u.id}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: '600' }} className="mono-font">
                              {index + 1}
                            </td>

                            {/* Nama & Role */}
                            <td>
                              <div style={styles.userCell}>
                                <div style={styles.avatarMini}>
                                  <User size={14} style={{ color: '#38bdf8' }} />
                                </div>
                                <div>
                                  <div style={styles.cellName}>{u.nama}</div>
                                  <span
                                    style={{
                                      ...styles.roleTag,
                                      backgroundColor:
                                        u.role === 'Staf' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                      color:
                                        u.role === 'Staf' ? '#60a5fa' : '#34d399',
                                      borderColor:
                                        u.role === 'Staf' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                    }}
                                  >
                                    {u.role}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Waktu Masuk */}
                            <td>
                              {hasMasuk ? (
                                <div>
                                  <div className="badge-status masuk">
                                    <CheckCircle2 size={13} />
                                    <span className="mono-font">{att.waktu_masuk} WIB</span>
                                  </div>
                                  {att.lokasi_masuk && (
                                    <div style={styles.tableLocSnippet} title={`Lokasi: ${att.lokasi_masuk}`}>
                                      <MapPin size={11} style={{ color: '#34d399', flexShrink: 0 }} />
                                      <span style={styles.tableLocText}>{att.lokasi_masuk}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="badge-status belum">
                                  <AlertCircle size={13} />
                                  <span>Belum Absen</span>
                                </div>
                              )}
                            </td>

                            {/* Bukti Foto Masuk */}
                            <td style={{ textAlign: 'center' }}>
                              {hasMasuk && att.foto_masuk ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: `${SERVER_URL}${att.foto_masuk}`,
                                      title: `Bukti Foto Masuk - ${u.nama}`,
                                      sub: `${formattedDate} pukul ${att.waktu_masuk} WIB (${u.role})`,
                                      lokasi: att.lokasi_masuk,
                                      latitude: att.latitude_masuk,
                                      longitude: att.longitude_masuk,
                                      akurasi: att.akurasi_masuk,
                                      tipe: 'MASUK'
                                    })
                                  }
                                  className="photo-thumb-btn"
                                  title="Klik untuk melihat foto resolusi penuh & verifikasi lokasi"
                                >
                                  <img
                                    src={`${SERVER_URL}${att.foto_masuk}`}
                                    alt="Foto Masuk"
                                    className="thumb-img"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  <Eye size={13} />
                                </button>
                              ) : (
                                <span style={{ color: '#475569' }}>—</span>
                              )}
                            </td>

                            {/* Waktu Pulang */}
                            <td>
                              {hasPulang ? (
                                <div>
                                  <div className="badge-status pulang">
                                    <CheckCircle2 size={13} />
                                    <span className="mono-font">{att.waktu_pulang} WIB</span>
                                  </div>
                                  {att.lokasi_pulang && (
                                    <div style={styles.tableLocSnippet} title={`Lokasi: ${att.lokasi_pulang}`}>
                                      <MapPin size={11} style={{ color: '#60a5fa', flexShrink: 0 }} />
                                      <span style={styles.tableLocText}>{att.lokasi_pulang}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>—</span>
                              )}
                            </td>

                            {/* Bukti Foto Pulang */}
                            <td style={{ textAlign: 'center' }}>
                              {hasPulang && att.foto_pulang ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhoto({
                                      url: `${SERVER_URL}${att.foto_pulang}`,
                                      title: `Bukti Foto Pulang - ${u.nama}`,
                                      sub: `${formattedDate} pukul ${att.waktu_pulang} WIB (${u.role})`,
                                      lokasi: att.lokasi_pulang,
                                      latitude: att.latitude_pulang,
                                      longitude: att.longitude_pulang,
                                      akurasi: att.akurasi_pulang,
                                      tipe: 'PULANG'
                                    })
                                  }
                                  className="photo-thumb-btn"
                                  title="Klik untuk melihat foto resolusi penuh & verifikasi lokasi"
                                >
                                  <img
                                    src={`${SERVER_URL}${att.foto_pulang}`}
                                    alt="Foto Pulang"
                                    className="thumb-img"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                  <Eye size={13} />
                                </button>
                              ) : (
                                <span style={{ color: '#475569' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAJEMEN PESERTA */}
        {activeTab === 'PESERTA' && (
          <div style={styles.tabContent}>
            <div className="gov-panel" style={styles.tableCard}>
              <div style={styles.tableHeaderRow}>
                <div>
                  <h2 style={styles.tableTitle}>Daftar Peserta Terdaftar</h2>
                  <p style={styles.tableSub}>
                    Total {users.length} akun pegawai dan siswa magang aktif
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(true)}
                  className="btn-gov-primary"
                >
                  <UserPlus size={15} />
                  <span>+ Tambah Peserta Baru</span>
                </button>
              </div>

              <div className="gov-table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>No</th>
                      <th>Nama Lengkap Peserta</th>
                      <th>Posisi / Role</th>
                      <th style={{ textAlign: 'center' }}>Status Akun</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                          Belum ada data peserta yang terdaftar di sistem.
                        </td>
                      </tr>
                    ) : (
                      users.map((u, idx) => (
                        <tr key={u.id}>
                          <td style={{ textAlign: 'center', color: '#94a3b8' }} className="mono-font">
                            {idx + 1}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={styles.avatarMini}>
                                <User size={14} style={{ color: '#38bdf8' }} />
                              </div>
                              <span style={{ fontWeight: '600', color: '#f8fafc' }}>{u.nama}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                ...styles.roleTag,
                                backgroundColor:
                                  u.role === 'Staf' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color:
                                  u.role === 'Staf' ? '#60a5fa' : '#34d399',
                                borderColor:
                                  u.role === 'Staf' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={styles.activePill}>
                              <span className="live-dot-green"></span>
                              <span>Aktif</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="btn-gov-danger"
                              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                              title={`Hapus peserta ${u.nama}`}
                            >
                              <Trash2 size={13} />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL TAMBAH PESERTA */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={() => {
          fetchData(selectedDate);
        }}
      />

      {/* MODAL HAPUS PESERTA */}
      <DeleteUserModal
        isOpen={isDeleteUserOpen}
        onClose={() => {
          setIsDeleteUserOpen(false);
          setTargetDeleteUser(null);
        }}
        users={users}
        targetUser={targetDeleteUser}
        onUserDeleted={() => {
          fetchData(selectedDate);
        }}
      />

      {/* MODAL GANTI PIN MASTER */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      {/* MODAL PREVIEW FOTO BESAR */}
      {previewPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '600px', padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.previewHeader}>
              <div>
                <h3 style={styles.previewTitle}>{previewPhoto.title}</h3>
                <p style={styles.previewSub}>{previewPhoto.sub}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                style={styles.previewClose}
                title="Tutup Preview"
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.previewBody}>
              <img
                src={previewPhoto.url}
                alt="Bukti Kehadiran"
                style={styles.previewImage}
              />
            </div>

            {/* DETAIL VERIFIKASI LOKASI GPS & ANTI-MANIPULASI */}
            <div style={styles.previewLocationBox}>
              <div style={styles.previewLocationTop}>
                <div style={styles.previewLocationTitleRow}>
                  <div style={styles.locIconBadge}>
                    <MapPin size={16} style={{ color: '#38bdf8' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.previewLocationHeader}>
                      DETAIL LOKASI & TITIK KOORDINAT GPS
                    </div>
                    <div style={styles.previewLocationAddress}>
                      {previewPhoto.lokasi || 'Koordinat terverifikasi'}
                    </div>
                  </div>
                </div>

                {previewPhoto.latitude && previewPhoto.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${previewPhoto.latitude},${previewPhoto.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gov-primary"
                    style={styles.previewMapBtn}
                    title="Buka titik presensi di Google Maps"
                  >
                    <ExternalLink size={13} />
                    <span>Buka Maps</span>
                  </a>
                )}
              </div>

              <div style={styles.previewMetaRow}>
                <div style={styles.previewMetaItem}>
                  <Compass size={12} style={{ color: '#38bdf8' }} />
                  <span style={styles.previewMetaLabel}>GPS:</span>
                  <span className="mono-font" style={styles.previewMetaVal}>
                    {previewPhoto.latitude ? `${previewPhoto.latitude}, ${previewPhoto.longitude}` : 'Tercetak pada foto'}
                  </span>
                </div>
                {previewPhoto.akurasi && (
                  <div style={styles.previewMetaItem}>
                    <span style={styles.previewMetaLabel}>Akurasi:</span>
                    <span style={styles.previewMetaVal}>±{previewPhoto.akurasi}m</span>
                  </div>
                )}
                <div style={styles.previewVerifiedBadge}>
                  <ShieldCheck size={12} style={{ color: '#34d399' }} />
                  <span>GPS Device Asli • Anti-Manipulasi</span>
                </div>
              </div>
            </div>

            <div style={styles.previewFooter}>
              <span style={styles.previewNote}>
                Foto asli terverifikasi dengan stempel waktu watermark server WIB
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="btn-gov-subtle"
                style={{ padding: '6px 14px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  workspace: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
    boxSizing: 'border-box',
  },
  sidebar: {
    width: '260px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(16px)',
    borderRight: '1px solid rgba(148, 163, 184, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 20,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  instansiBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '40px',
    height: '40px',
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
  brandTitle: {
    fontSize: '0.96rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.04em',
  },
  brandSub: {
    fontSize: '0.74rem',
    color: '#7dd3fc',
    fontWeight: '600',
  },
  adminTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.68rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
    width: 'fit-content',
  },
  navMenu: {
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navSectionLabel: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#64748b',
    padding: '4px 10px 8px 10px',
    letterSpacing: '0.08em',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '11px',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    color: '#cbd5e1',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.15) 100%)',
    color: '#38bdf8',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    fontWeight: '700',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.15)',
  },
  userCountBadge: {
    fontSize: '0.72rem',
    padding: '2px 8px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    color: '#f8fafc',
    fontWeight: '700',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
  },
  btnExit: {
    width: '100%',
    justifyContent: 'center',
    padding: '10px 14px',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  heroBanner: {
    position: 'relative',
    padding: '28px 32px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.65) 0%, rgba(30, 27, 75, 0.75) 50%, rgba(15, 23, 42, 0.85) 100%)',
    border: '1px solid rgba(96, 165, 250, 0.35)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    boxShadow: '0 16px 40px -10px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
  heroLeft: {
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  heroBadge: {
    display: 'inline-flex',
    fontSize: '0.70rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    color: '#38bdf8',
    marginBottom: '2px',
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    padding: '3px 10px',
    borderRadius: '9999px',
    width: 'fit-content',
    border: '1px solid rgba(56, 189, 248, 0.35)',
  },
  heroTitle: {
    margin: 0,
    fontSize: '1.7rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '0.88rem',
    color: '#cbd5e1',
  },
  heroRight: {
    zIndex: 2,
  },
  heroActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  heroBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
  },
  geometricAccent: {
    position: 'absolute',
    right: '-40px',
    top: '-40px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  statCard: {
    padding: '20px 22px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: '0 12px 28px -8px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  },
  statIconBox: (bg, color) => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: bg,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: `0 4px 14px ${color}33`,
  }),
  statLabel: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  statUnit: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  toolbarCard: {
    padding: '18px 22px',
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    flexWrap: 'wrap',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: '0.01em',
  },
  roleButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  },
  rolePill: {
    padding: '6px 14px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#cbd5e1',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  rolePillActive: {
    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
    color: '#ffffff',
    fontWeight: '700',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
  },
  tableCard: {
    padding: '24px 26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  tableHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tableTitle: {
    margin: 0,
    fontSize: '1.14rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  tableSub: {
    margin: '3px 0 0 0',
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarMini: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cellName: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '2px',
  },
  roleTag: {
    display: 'inline-block',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid',
  },
  activePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 8px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '0.74rem',
    fontWeight: '700',
  },
  previewHeader: {
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  previewTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  previewSub: {
    margin: '3px 0 0 0',
    fontSize: '0.78rem',
    color: '#94a3b8',
  },
  previewClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
  },
  previewBody: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  previewImage: {
    width: '100%',
    maxHeight: '460px',
    objectFit: 'contain',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  previewFooter: {
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    gap: '12px',
  },
  previewNote: {
    fontSize: '0.74rem',
    color: '#64748b',
    fontStyle: 'italic',
  },
  tableLocSnippet: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.70rem',
    color: '#94a3b8',
    marginTop: '4px',
    maxWidth: '170px',
  },
  tableLocText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'inline-block',
  },
  previewLocationBox: {
    backgroundColor: '#090e17',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '14px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  previewLocationTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  previewLocationTitleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flex: 1,
  },
  locIconBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  previewLocationHeader: {
    fontSize: '0.67rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
    color: '#38bdf8',
    marginBottom: '2px',
  },
  previewLocationAddress: {
    fontSize: '0.84rem',
    fontWeight: '600',
    color: '#f8fafc',
    lineHeight: '1.35',
  },
  previewMapBtn: {
    flexShrink: 0,
    textDecoration: 'none',
    fontSize: '0.74rem',
    padding: '6px 12px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  previewMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.72rem',
    color: '#94a3b8',
    paddingTop: '2px',
  },
  previewMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  previewMetaLabel: {
    color: '#64748b',
  },
  previewMetaVal: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  previewVerifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#34d399',
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '0.70rem',
  },
};
