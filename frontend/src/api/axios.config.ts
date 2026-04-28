import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401 = token inválido/expirado → cerrar sesión
    // 403 = sin permiso para esa operación → NO cerrar sesión, el componente maneja el error
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (!window.location.pathname.startsWith('/elecciones')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
