import axios from 'axios';

// Detect remote backend URL from environment or fallback to relative /api
const rawBaseURL = import.meta.env.VITE_API_URL || '';
const cleanBaseURL = rawBaseURL.replace(/\/+$/, '');
const baseURL = cleanBaseURL ? `${cleanBaseURL}/api` : '/api';

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default API;
