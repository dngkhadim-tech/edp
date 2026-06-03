import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('edp_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('edp_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('edp_access_token', data.accessToken);
          localStorage.setItem('edp_refresh_token', data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(err.config);
        } catch {
          localStorage.removeItem('edp_access_token');
          localStorage.removeItem('edp_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  },
);

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('edp_access_token', accessToken);
  localStorage.setItem('edp_refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('edp_access_token');
  localStorage.removeItem('edp_refresh_token');
};
