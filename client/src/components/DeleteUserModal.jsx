import React, { useState } from 'react';
import { 
  UserMinus, 
  Trash2, 
  X, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  User
} from 'lucide-react';
import { deleteUser } from '../services/api';

export default function DeleteUserModal({ isOpen, onClose, users, targetUser = null, onUserDeleted }) {
  const [adminPin, setAdminPin] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    if (deletingId) return;
    setErrorMsg('');
    setSuccessMsg('');
    setAdminPin('');
    onClose();
  };

  const handleDelete = async (user) => {
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedAdminPin = adminPin.trim();
    if (!trimmedAdminPin) {
      setErrorMsg('Masukkan PIN Otorisasi Admin terlebih dahulu.');
      return;
    }

    if (trimmedAdminPin.length < 4 || trimmedAdminPin.length > 6) {
      setErrorMsg('PIN Otorisasi Admin harus berupa 4–6 digit angka.');
      return;
    }

    const confirmDelete = window.confirm(
      `Hapus peserta "${user.nama}" (${user.role}) secara permanen? Catatan absensi dan foto terkait juga akan dihapus dari server.`
    );
    if (!confirmDelete) return;

    setDeletingId(user.id);

    try {
      const response = await deleteUser(user.id, trimmedAdminPin);

      if (response && response.success) {
        setSuccessMsg(response.message || `Peserta "${user.nama}" berhasil dihapus.`);
        onUserDeleted(user);
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setErrorMsg(response?.message || 'Gagal menghapus peserta.');
      }
    } catch (err) {
      console.error('Error saat menghapus user:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghapus peserta.';
      setErrorMsg(serverMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const displayUsers = targetUser ? [targetUser] : users;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '460px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <div style={styles.iconCircle}>
              <UserMinus size={18} style={{ color: '#f87171' }} />
            </div>
            <div>
              <h3 style={styles.title}>
                {targetUser ? `Hapus Peserta: ${targetUser.nama}` : 'Manajemen Hapus Peserta'}
              </h3>
              <p style={styles.subtitle}>Penghapusan permanen dari basis data</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose} 
            disabled={!!deletingId}
            style={styles.closeBtn}
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div style={styles.body}>
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

          {/* Input Otorisasi PIN Admin */}
          <div style={styles.authBox}>
            <div style={styles.authLabelRow}>
              <ShieldAlert size={14} style={{ color: '#f59e0b' }} />
              <span style={styles.authLabel}>Otorisasi Keamanan (4–6 Digit)</span>
            </div>
            <input
              type="password"
              maxLength={6}
              className="gov-input mono-font"
              placeholder="Masukkan PIN Otorisasi Admin (4–6 digit)..."
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              disabled={!!deletingId}
              style={{
                borderColor: 'rgba(245, 158, 11, 0.35)',
                letterSpacing: '0.2em',
              }}
            />
            <span style={styles.authHint}>
              PIN Otorisasi Pembimbing/Admin (4–6 digit) wajib dimasukkan sebelum melakukan penghapusan.
            </span>
          </div>

          {/* Daftar Peserta */}
          <div style={styles.listSection}>
            <span style={styles.listTitle}>
              {targetUser ? 'Konfirmasi Peserta yang Akan Dihapus' : `Daftar Peserta Terdaftar (${users.length})`}
            </span>
            <div style={styles.userList}>
              {displayUsers.map((u) => {
                const isDeleting = deletingId === u.id;
                return (
                  <div key={u.id} style={styles.userItem}>
                    <div style={styles.userInfo}>
                      <div style={styles.avatarCircle}>
                        <User size={14} style={{ color: '#94a3b8' }} />
                      </div>
                      <div>
                        <div style={styles.userName}>{u.nama}</div>
                        <span
                          style={{
                            ...styles.roleBadge,
                            backgroundColor:
                              u.role === 'Staf' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
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

                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={!!deletingId}
                      className="btn-gov-danger"
                      style={{
                        padding: '6px 12px',
                        opacity: isDeleting ? 0.6 : 1,
                        cursor: deletingId ? 'not-allowed' : 'pointer',
                      }}
                      title={`Hapus ${u.nama}`}
                    >
                      {isDeleting ? (
                        <Loader2 size={14} className="spin-icon" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      <span>Hapus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={handleClose}
            disabled={!!deletingId}
            className="btn-gov-subtle"
          >
            Tutup
          </button>
        </div>
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
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
  body: {
    padding: '18px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxHeight: '60vh',
    overflowY: 'auto',
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
  authBox: {
    backgroundColor: 'rgba(9, 14, 23, 0.65)',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  authLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  authLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#fbbf24',
  },
  authHint: {
    fontSize: '0.74rem',
    color: '#94a3b8',
    lineHeight: '1.3',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#cbd5e1',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '10px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatarCircle: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '2px',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    border: '1px solid',
  },
  footer: {
    padding: '12px 22px',
    display: 'flex',
    justifyContent: 'flex-end',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
};
