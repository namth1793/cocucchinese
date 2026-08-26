import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cocuc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('cocuc_token');
      localStorage.removeItem('cocuc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
