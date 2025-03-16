import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000, 
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Log outgoing requests in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 Request: ${config.method.toUpperCase()} ${config.url}`, {
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 10)}...` : 'none',
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Response: ${response.config.method.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
      });
    }
    return response;
  },
  (error) => {
    // Log error responses in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Error Response:`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // Handle specific error scenarios
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Don't automatically redirect on 401 - let the component handle it
          console.warn('API authorization error (401):', error.response.data?.message || 'Unauthorized');
          break;
        case 403:
          console.error('Access denied (403):', error.response.data?.message || 'Forbidden');
          break;
        case 404:
          console.error('Resource not found (404):', error.response.data?.message || 'Not found');
          break;
        case 500:
          console.error('Server error (500):', error.response.data?.message || 'Internal Server Error');
          break;
        default:
          console.error(`Error (${error.response.status}):`, error.response.data?.message || 'An error occurred');
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;