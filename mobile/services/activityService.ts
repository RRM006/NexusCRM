import api from '../utils/axios';
import { Activity } from '../types';

export const activityService = {
  async getActivities(params?: {
    type?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Activity[]; total: number }> {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  async getActivityById(id: string): Promise<Activity> {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  async createActivity(data: Omit<Activity, 'id' | 'createdAt' | 'companyId' | 'userId'>): Promise<Activity> {
    const response = await api.post('/activities', data);
    return response.data;
  },
};

