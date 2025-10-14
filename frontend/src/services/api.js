import axios from 'axios';

/**
 * Axios instance configured with the backend base URL.
 * Automatically attaches JWT token from localStorage when present.
 */
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;