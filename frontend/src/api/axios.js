import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true, // Required for HttpOnly cookies
});

// Interceptor to handle auth tokens if needed in future
// For now, we rely on HttpOnly cookies which Axios sends automatically with withCredentials: true

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (Expired Access Token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:5000/api/v1/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
