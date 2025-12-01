import api from '../utils/axios';
import { Company, CompanyUser } from '../types';

export const companyService = {
  async getMyCompanies(): Promise<CompanyUser[]> {
    const response = await api.get('/companies/my');
    return response.data;
  },

  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  async createCompany(data: { name: string; domain?: string }): Promise<Company> {
    const response = await api.post('/companies', data);
    return response.data;
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },
};

