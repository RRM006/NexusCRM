import api from '../utils/axios';
import { Customer } from '../types';

export const customerService = {
  async getCustomers(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Customer[]; total: number }> {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

