import api from '../utils/axios';
import { Lead } from '../types';

export const leadService = {
  async getLeads(params?: {
    search?: string;
    status?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Lead[]; total: number }> {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  async getLeadById(id: string): Promise<Lead> {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  async createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Lead> {
    const response = await api.post('/leads', data);
    return response.data;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  async deleteLead(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  async convertLead(id: string): Promise<void> {
    await api.post(`/leads/${id}/convert`);
  },
};

