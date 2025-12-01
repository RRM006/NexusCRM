import api from '../utils/axios';
import { Issue } from '../types';

export const issueService = {
  async getIssues(params?: {
    search?: string;
    status?: string;
    priority?: string;
    reportedById?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Issue[]; total: number }> {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  async getIssueById(id: string): Promise<Issue> {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  async createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'reportedById'>): Promise<Issue> {
    const response = await api.post('/issues', data);
    return response.data;
  },

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue> {
    const response = await api.put(`/issues/${id}`, data);
    return response.data;
  },

  async deleteIssue(id: string): Promise<void> {
    await api.delete(`/issues/${id}`);
  },
};

