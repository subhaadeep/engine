import axios from 'axios';

// Vite proxy forwards /api -> http://127.0.0.1:8765 during dev
// Set VITE_API_BASE env var to override in production
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

const apiClient = axios.create({
  baseURL: BASE,
  timeout: 180_000, // 3 min — large file uploads
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(msg));
  }
);

// Export BOTH ways so any import style works
export { apiClient };          // named:   import { apiClient } from './client'
export default apiClient;      // default: import apiClient from './client'
