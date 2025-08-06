import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000'),
});

// Agregar token de Firebase a cada petición
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const token = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptar expiración MFA (440) -> recargar para mostrar <MfaSetup />
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 440) {
      window.location.reload();
    }
    return Promise.reject(err);
  },
);

export default api;
