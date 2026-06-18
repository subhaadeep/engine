import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:8765/api',
  timeout: 300000, // 5 min for long backtests/MC
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);
