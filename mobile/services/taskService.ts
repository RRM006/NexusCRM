import api from '../utils/axios';
import { Task } from '../types';

export const taskService = {
  async getTasks(params?: {
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Task[]; total: number }> {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'createdById'>): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};

