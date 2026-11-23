import axios from 'axios';

// Deteksi otomatis URL backend: mendukung localhost maupun domain hosting online
const getBaseBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Deteksi dinamis berdasarkan URL browser saat ini (menghapus index.html dan trailing slash)
  const path = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
  return `${window.location.origin}${path}/php-backend`;
};

export const SERVER_URL = getBaseBackendUrl();

const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getUsers = async () => {
  const response = await api.get('/users.php');
  return response.data;
};

export const getTodayAttendances = async () => {
  const response = await api.get('/rekap.php');
  return response.data;
};

export const submitAbsen = async (payload) => {
  const response = await api.post('/absen.php', payload);
  return response.data;
};

export const createUser = async (payload) => {
  const response = await api.post('/users.php', payload);
  return response.data;
};

export const deleteUser = async (userId, adminPin) => {
  const response = await api.delete('/users_delete.php', {
    params: { id: userId },
    data: { id: userId, admin_pin: adminPin },
  });
  return response.data;
};

export const verifyAdmin = async (pin) => {
  const response = await api.post('/auth_admin.php', { pin });
  return response.data;
};

export const changeAdminPin = async ({ old_pin, new_pin, confirm_pin }) => {
  const response = await api.post('/change_pin.php', {
    old_pin,
    new_pin,
    confirm_pin,
  });
  return response.data;
};

export const getAttendancesByDate = async (date) => {
  const response = await api.get('/rekap.php', {
    params: date ? { tanggal: date } : {},
  });
  return response.data;
};

export default api;

