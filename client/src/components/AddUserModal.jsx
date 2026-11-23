import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  User, 
  Briefcase, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { createUser } from '../services/api';

export default function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('Magang');
  const [pin, setPin] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setErrorMsg('');
    setNama('');
    setRole('Magang');
    setPin('');
    setAdminPin('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      setErrorMsg('PIN Baru harus berupa 4 digit angka.');
      return;
    }

    const trimmedAdminPin = adminPin.trim();
    if (!trimmedAdminPin) {
      setErrorMsg('PIN Otorisasi wajib diisi untuk verifikasi.');
      return;
    }

    if (trimmedAdminPin.length < 4 || trimmedAdminPin.length > 6) {
      setErrorMsg('PIN Otorisasi Admin harus berupa 4–6 digit angka.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nama: nama.trim(),
        role: role.trim(),
        pin: pin.trim(),
        admin_pin: trimmedAdminPin,
      };

      const response = await createUser(payload);

      if (response && response.success) {
        setNama('');
        setRole('Magang');
        setPin('');
        setAdminPin('');
        onSuccess(response.data);
        onClose();
      } else {
        setErrorMsg(response?.message || 'Gagal menambahkan peserta.');
      }
    } catch (err) {
      console.error('Error saat tambah peserta:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan pada server.';
      setErrorMsg(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.iconCircle}>
              <UserPlus size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <h3 style={styles.title}>Tambah Peserta Baru</h3>
              <p style={styles.subtitle}>Daftarkan pegawai atau anak magang instansi</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose} 
            disabled={isLoading}
            style={styles.closeBtn}
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {errorMsg && (
            <div style={styles.alertError}>
              <AlertCircle size={16} style={{ minWidth: '16px', flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Nama Lengkap */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <User size={14} style={{ color: '#38bdf8' }} />
              <span>Nama Lengkap Peserta</span>
            </label>
            <input
              type="text"
              className="gov-input"
              placeholder="Contoh: Ahmad Fauzi"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* 2. Role */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Briefcase size={14} style={{ color: '#38bdf8' }} />
              <span>Role / Posisi</span>
            </label>
            <select
              className="gov-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
              style={{ cursor: 'pointer' }}
            >
              <option value="Magang" style={{ backgroundColor: '#0f172a' }}>Magang</option>
              <option value="Staf" style={{ backgroundColor: '#0f172a' }}>Staf (Pegawai)</option>
            </select>
          </div>

          {/* 3. PIN Baru */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <KeyRound size={14} style={{ color: '#38bdf8' }} />
              <span>PIN Baru (4 Digit Angka)</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="gov-input mono-font"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
              style={{ letterSpacing: '0.25em' }}
            />
          </div>

          {/* 4. PIN Otorisasi */}
          <div style={{ ...styles.inputGroup, marginTop: '2px' }}>
            <label style={styles.label}>
              <ShieldCheck size={14} style={{ color: '#f59e0b' }} />
              <span style={{ color: '#fbbf24' }}>PIN Otorisasi Administrator (4–6 Digit)</span>
            </label>
            <input
              type="password"
              maxLength={6}
              className="gov-input mono-font"
              placeholder="4–6 digit PIN..."
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              disabled={isLoading}
              style={{
                borderColor: 'rgba(245, 158, 11, 0.35)',
                letterSpacing: '0.25em',
              }}
            />
            <span style={styles.authNotice}>
              Masukkan PIN Otorisasi Pembimbing/Admin (4–6 digit) untuk menyimpan perubahan
            </span>
          </div>

          {/* Tombol Aksi */}
          <div style={styles.footer}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-gov-subtle"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-gov-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Simpan Peserta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: {
    padding: '18px 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.08rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.78rem',
    color: '#94a3b8',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#f87171',
    fontSize: '0.84rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  authNotice: {
    fontSize: '0.74rem',
    color: '#94a3b8',
    marginTop: '2px',
    lineHeight: '1.3',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '6px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
};
