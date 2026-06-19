import axios from 'axios';

// In dev (npm run dev): Vite proxy forwards /api -> http://127.0.0.1:8765
// In production build: set VITE_API_BASE env var or use relative /api
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

const apiClient = axios.create({
  baseURL: BASE,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;
