import axios from 'axios';
import { registerAudioFromData } from '../utils/speak';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cocuc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Ghi nhận file nghe giáo viên đã tải lên để speak() phát file thật thay cho giọng đọc máy.
    if (res.data && typeof res.data === 'object') registerAudioFromData(res.data);
    return res;
  },
  (err) => {
    // Chỉ đá về trang đăng nhập khi phiên đang có bị từ chối - khách học thử không có token thì giữ nguyên trang.
    if (err.response && err.response.status === 401 && localStorage.getItem('cocuc_token') && window.location.pathname !== '/login') {
      localStorage.removeItem('cocuc_token');
      localStorage.removeItem('cocuc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
