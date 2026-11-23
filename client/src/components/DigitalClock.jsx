import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export default function DigitalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeZone = 'Asia/Jakarta';

  // Baris 1: Hari & Tanggal lengkap bahasa Indonesia (contoh: Selasa, 17 November 2026)
  const fullDateStr = new Intl.DateTimeFormat('id-ID', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentTime);

  // Baris 2: Jam, Menit, Detik presisi format 24 jam (contoh: 10:25:09 WIB)
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(currentTime);

  return (
    <div className="glass-panel" style={styles.card}>
      <div style={styles.dateRow}>
        <Calendar size={17} style={styles.calendarIcon} />
        <span style={styles.dateText}>{fullDateStr}</span>
      </div>
      <div style={styles.timeRow}>
        <Clock size={34} style={styles.clockIcon} />
        <div style={styles.timeBox}>
          <span className="clock-text">{timeStr}</span>
          <span style={styles.badge}>WIB</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 38px',
    minWidth: '340px',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    color: '#94a3b8',
    fontSize: '0.98rem',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
  calendarIcon: {
    color: '#38bdf8',
  },
  dateText: {
    textTransform: 'capitalize',
    letterSpacing: '0.01em',
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  clockIcon: {
    color: '#38bdf8',
    filter: 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.5))',
  },
  timeBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  badge: {
    fontSize: '0.85rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    color: '#ffffff',
    padding: '3px 10px',
    borderRadius: '8px',
    letterSpacing: '0.05em',
    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};
