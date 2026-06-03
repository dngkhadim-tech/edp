import axios from 'axios';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'edp-storage' });

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = storage.getString('edp_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = storage.getString('edp_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
          storage.set('edp_access_token', data.accessToken);
          storage.set('edp_refresh_token', data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(err.config);
        } catch {
          storage.delete('edp_access_token');
          storage.delete('edp_refresh_token');
        }
      }
    }
    return Promise.reject(err);
  },
);

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  storage.set('edp_access_token', accessToken);
  storage.set('edp_refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  storage.delete('edp_access_token');
  storage.delete('edp_refresh_token');
};
