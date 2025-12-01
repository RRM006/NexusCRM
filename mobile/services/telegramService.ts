import api from '../utils/axios';
import { TelegramStatus } from '../types';

export const telegramService = {
  async connectTelegram(phoneNumber: string): Promise<void> {
    await api.put('/telegram/phone', { phoneNumber });
  },

  async getTelegramStatus(): Promise<TelegramStatus> {
    const response = await api.get('/telegram/status');
    return response.data;
  },

  async disconnectTelegram(): Promise<void> {
    await api.put('/telegram/unlink');
  },

  async getTelegramNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const response = await api.get('/telegram/notifications', { params });
    return response.data;
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await api.put(`/telegram/notifications/${notificationId}/read`);
  },
};

