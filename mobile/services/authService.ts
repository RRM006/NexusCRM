import api from '../utils/axios';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';
import { AuthResponse, User } from '../types';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    await storage.setObject(STORAGE_KEYS.USER, data.user);

    if (data.companies && data.companies.length > 0) {
      await storage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, data.companies[0].companyId);
      await storage.setItem(STORAGE_KEYS.ACTIVE_ROLE, data.companies[0].role);
    }

    return data;
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/register', { name, email, password });
    const data = response.data;

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    await storage.setObject(STORAGE_KEYS.USER, data.user);

    return data;
  },

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/google', { idToken });
    const data = response.data;

    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.tokens.accessToken);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.tokens.refreshToken);
    await storage.setObject(STORAGE_KEYS.USER, data.user);

    if (data.companies && data.companies.length > 0) {
      await storage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, data.companies[0].companyId);
      await storage.setItem(STORAGE_KEYS.ACTIVE_ROLE, data.companies[0].role);
    }

    return data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER);
      await storage.removeItem(STORAGE_KEYS.ACTIVE_COMPANY);
      await storage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      await storage.setObject(STORAGE_KEYS.USER, user);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/auth/profile', data);
    const user = response.data;
    await storage.setObject(STORAGE_KEYS.USER, user);
    return user;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  },

  async refreshToken(): Promise<string> {
    const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken } = response.data;
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    return accessToken;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },
};

