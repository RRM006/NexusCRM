import api from '../utils/axios';
import { Contact } from '../types';

export const contactService = {
  async getContacts(params?: {
    search?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Contact[]; total: number }> {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  async getContactById(id: string): Promise<Contact> {
    const response = await api.get(`/contacts/${id}`);
    return response.data;
  },

  async createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Contact> {
    const response = await api.post('/contacts', data);
    return response.data;
  },

  async updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data;
  },

  async deleteContact(id: string): Promise<void> {
    await api.delete(`/contacts/${id}`);
  },
};

