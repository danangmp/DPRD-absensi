import React, { forwardRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, Loader2, VideoOff, Sparkles, Sun } from 'lucide-react';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
};

const WebcamCapture = forwardRef((props, ref) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="gov-panel kiosk-camera-card" style={styles.card}>
      {/* Header Frame Kamera */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div style={styles.iconBadge}>
            <Camera size={15} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <div style={styles.title}>Sensor Kamera Presensi</div>
            <div style={styles.subtitle}>Verifikasi Biometrik Wajah</div>
          </div>
        </div>

        {/* Status Badge */}
        {hasError ? (
          <div style={styles.errorBadge}>
            <VideoOff size={12} />
            <span>KAMERA NONAKTIF</span>
          </div>
        ) : isCameraReady ? (
          <div style={styles.liveBadge}>
            <span className="live-dot-green"></span>
            <span style={styles.liveText}>LIVE KAMERA</span>
          </div>
        ) : (
          <div style={styles.connectingBadge}>
            <Loader2 size={12} className="spin-icon" />
            <span>MEMUAT SENSOR...</span>
          </div>
        )}
      </div>

      {/* Frame Kamera dengan Viewfinder Corner Guides */}
      <div style={styles.webcamContainer}>
        {/* Viewfinder Corner Guides */}
        <div className="viewfinder-corner corner-tl"></div>
        <div className="viewfinder-corner corner-tr"></div>
        <div className="viewfinder-corner corner-bl"></div>
        <div className="viewfinder-corner corner-br"></div>

        {/* Placeholder / Error Overlay */}
        {!isCameraReady && !hasError && (
          <div style={styles.overlay}>
            <Loader2 size={36} className="spin-icon" style={{ color: '#38bdf8' }} />
            <span style={styles.overlayTitle}>Menghubungkan sensor optik...</span>
            <span style={styles.overlaySub}>Pastikan izin akses kamera aktif pada browser</span>
          </div>
        )}

        {hasError && (
          <div style={styles.overlay}>
            <VideoOff size={36} style={{ color: '#ef4444' }} />
            <span style={{ ...styles.overlayTitle, color: '#f87171' }}>Sensor Kamera Tidak Terdeteksi</span>
            <span style={styles.overlaySub}>Izinkan akses kamera di pengaturan browser Anda</span>
          </div>
        )}

        <Webcam
          audio={false}
          ref={ref}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          mirrored={true}
          onUserMedia={() => {
            setIsCameraReady(true);
            setHasError(false);
          }}
          onUserMediaError={() => {
            setIsCameraReady(false);
            setHasError(true);
          }}
          style={{
            ...styles.webcam,
            opacity: isCameraReady ? 1 : 0,
          }}
        />

        {/* Center Target Crosshair Hint (Subtle) */}
        {isCameraReady && (
          <div style={styles.crosshair}>
            <div style={styles.crosshairCircle}></div>
          </div>
        )}
      </div>

      {/* Panduan Pencahayaan di Bawah Frame */}
      <div style={styles.footerGuide}>
        <Sun size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
        <span>
          Posisikan wajah tepat di tengah bingkai viewfinder dengan pencahayaan yang cukup.
        </span>
      </div>
    </div>
  );
});

WebcamCapture.displayName = 'WebcamCapture';

const styles = {
  card: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    boxShadow: '0 20px 45px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '14px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(56, 189, 248, 0.2)',
  },
  title: {
    fontSize: '0.94rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '0.76rem',
    color: '#94a3b8',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    border: '1px solid rgba(16, 185, 129, 0.45)',
    padding: '5px 12px',
    borderRadius: '9999px',
    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)',
  },
  liveText: {
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
    color: '#34d399',
  },
  connectingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    color: '#93c5fd',
    padding: '5px 12px',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  errorBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#fca5a5',
    padding: '5px 12px',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: '700',
  },
  webcamContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    backgroundColor: '#0c1322',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.28)',
    boxShadow: 'inset 0 2px 14px rgba(0, 0, 0, 0.7), 0 4px 20px rgba(0, 0, 0, 0.35)',
  },
  webcam: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'opacity 0.3s ease',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#0c1322',
    padding: '24px',
    textAlign: 'center',
    zIndex: 2,
  },
  overlayTitle: {
    fontSize: '0.90rem',
    color: '#f8fafc',
    fontWeight: '700',
  },
  overlaySub: {
    fontSize: '0.78rem',
    color: '#94a3b8',
  },
  crosshair: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 3,
  },
  crosshairCircle: {
    width: '170px',
    height: '170px',
    borderRadius: '50%',
    border: '1px dashed rgba(56, 189, 248, 0.35)',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)',
  },
  footerGuide: {
    marginTop: '14px',
    padding: '10px 14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    border: '1px solid rgba(245, 158, 11, 0.28)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.79rem',
    color: '#fef3c7',
    lineHeight: '1.4',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
};

export default WebcamCapture;
