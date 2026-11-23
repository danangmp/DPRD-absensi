import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { verifyAdmin } from '../services/api';

export default function AdminAuthModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setPin('');
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setErrorMsg('Masukkan Master PIN Keamanan Admin.');
      return;
    }

    if (trimmedPin.length < 4 || trimmedPin.length > 6) {
      setErrorMsg('PIN Admin harus berupa 4–6 digit angka.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyAdmin(trimmedPin);
      if (response && response.success) {
        setPin('');
        onSuccess();
        onClose();
      } else {
        setErrorMsg(response?.message || 'PIN Admin salah.');
      }
    } catch (err) {
      console.error('Error verifikasi admin:', err);
      const serverMsg = err.response?.data?.message || 'PIN Admin salah. Akses ditolak.';
      setErrorMsg(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '390px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.iconCircle}>
              <ShieldCheck size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <h3 style={styles.title}>Akses Panel Admin</h3>
              <p style={styles.subtitle}>Otorisasi Pengelola Sistem Presensi</p>
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

        <form onSubmit={handleSubmit} style={styles.form}>
          {errorMsg && (
            <div style={styles.alertError}>
              <AlertCircle size={15} style={{ minWidth: '15px', flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Lock size={14} style={{ color: '#38bdf8' }} />
              <span>Master PIN Admin (4–6 Digit)</span>
            </label>
            <div style={styles.inputWrapper}>
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={6}
                className="gov-input mono-font"
                placeholder="4–6 digit PIN..."
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={isLoading}
                autoFocus
                style={{
                  letterSpacing: '0.25em',
                  fontWeight: '700',
                  textAlign: 'center',
                  fontSize: '1.05rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                style={styles.toggleBtn}
                title={showPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={styles.authNotice}>
              Masukkan PIN otorisasi administrator (4–6 digit angka) untuk membuka dashboard rekap & manajemen peserta.
            </span>
          </div>

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
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Buka Dashboard</span>
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
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconCircle: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.02rem',
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
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#f87171',
    fontSize: '0.82rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
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
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  authNotice: {
    fontSize: '0.72rem',
    color: '#64748b',
    marginTop: '4px',
    lineHeight: '1.3',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '6px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
};
