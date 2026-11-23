import React, { useState } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { changeAdminPin } from '../services/api';

export default function ChangePinModal({ isOpen, onClose }) {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
    setSuccessMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validasi lokal
    if (!oldPin.trim() || !newPin.trim() || !confirmPin.trim()) {
      setErrorMsg('Semua kolom PIN wajib diisi.');
      return;
    }

    if (!/^\d{4,6}$/.test(newPin.trim())) {
      setErrorMsg('PIN Baru harus berupa 4 hingga 6 digit angka.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    if (newPin.trim() === oldPin.trim()) {
      setErrorMsg('PIN Baru tidak boleh sama dengan PIN Lama.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await changeAdminPin({
        old_pin: oldPin.trim(),
        new_pin: newPin.trim(),
        confirm_pin: confirmPin.trim(),
      });

      if (response && response.success) {
        setSuccessMsg(response.message || 'PIN Master berhasil diperbarui.');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setErrorMsg(response?.message || 'Gagal mengubah PIN Master.');
      }
    } catch (err) {
      console.error('Error ganti PIN:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan pada server saat memperbarui PIN.';
      setErrorMsg(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.iconCircle}>
              <KeyRound size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <h3 style={styles.title}>Ganti PIN Master Admin</h3>
              <p style={styles.subtitle}>Pembaruan Otorisasi Keamanan Sistem</p>
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

        {/* Form Modal */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {successMsg && (
            <div style={styles.alertSuccess}>
              <CheckCircle2 size={16} style={{ minWidth: '16px', flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={styles.alertError}>
              <AlertCircle size={16} style={{ minWidth: '16px', flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. PIN Master Lama */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <KeyRound size={14} style={{ color: '#94a3b8' }} />
              <span>PIN Master Lama</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showOldPin ? 'text' : 'password'}
                maxLength={6}
                className="gov-input mono-font"
                placeholder="Masukkan PIN lama..."
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                disabled={isLoading}
                autoFocus
                style={{ letterSpacing: '0.2em' }}
              />
              <button
                type="button"
                onClick={() => setShowOldPin(!showOldPin)}
                style={styles.toggleBtn}
                title={showOldPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showOldPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 2. PIN Master Baru */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
              <span>PIN Master Baru (4–6 Digit Angka)</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showNewPin ? 'text' : 'password'}
                maxLength={6}
                className="gov-input mono-font"
                placeholder="Masukkan PIN baru..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                disabled={isLoading}
                style={{ letterSpacing: '0.2em' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                style={styles.toggleBtn}
                title={showNewPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showNewPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 3. Konfirmasi PIN Master Baru */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
              <span>Konfirmasi PIN Master Baru</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showConfirmPin ? 'text' : 'password'}
                maxLength={6}
                className="gov-input mono-font"
                placeholder="Ulangi PIN baru..."
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                disabled={isLoading}
                style={{ letterSpacing: '0.2em' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                style={styles.toggleBtn}
                title={showConfirmPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showConfirmPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
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
                <span>Simpan PIN Baru</span>
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
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.76rem',
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
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#34d399',
    fontSize: '0.84rem',
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
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  toggleBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
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

