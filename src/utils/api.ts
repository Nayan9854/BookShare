// src/utils/api.ts - IMPROVED VERSION
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Store token in memory (will be set by AuthContext)
let sessionToken: string | null = null;

export function setAuthToken(token: string | null) {
  sessionToken = token;
}

// Add auth header to all requests
api.interceptors.request.use((config) => {
  if (sessionToken) {
    config.headers['x-session-token'] = sessionToken;
  }
  return config;
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Only redirect to login if we're on a protected page
      const publicPaths = ['/', '/login', '/register', '/books'];
      const currentPath = window.location.pathname;
      const isPublicPath = publicPaths.some(path => 
        currentPath === path || currentPath.startsWith('/books/')
      );
      
      if (!isPublicPath) {
        console.warn('Unauthorized access, redirecting to login...');
        // Optionally redirect to login
        // window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;