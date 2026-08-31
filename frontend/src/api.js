import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/',
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    const loginTime = sessionStorage.getItem('login_timestamp');
    
    if (loginTime) {
      const now = new Date().getTime();
      const sixHours = 6 * 60 * 60 * 1000;
      if (now - parseInt(loginTime, 10) >= sixHours) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('login_timestamp');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired'));
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops if the token refresh itself fails
    if (originalRequest.url === 'token/refresh/' || originalRequest.url === 'token/') {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(api.defaults.baseURL + 'token/refresh/', {
            refresh: refreshToken
          });
          
          sessionStorage.setItem('access_token', data.access);
          if (data.refresh) {
            sessionStorage.setItem('refresh_token', data.refresh);
          }
          
          api.defaults.headers.common.Authorization = 'Bearer ' + data.access;
          originalRequest.headers.Authorization = 'Bearer ' + data.access;
          
          processQueue(null, data.access);
          return api(originalRequest);
        } catch (err) {
          processQueue(err, null);
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('login_timestamp');
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('login_timestamp');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
