import api from '../utils/axios';
import { EmailTemplate } from '../types';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CLIENT_ID } from '../constants/config';

WebBrowser.maybeCompleteAuthSession();

export const emailService = {
  async connectGmail(authCode: string): Promise<void> {
    await api.post('/email/connect', { authCode });
  },

  async disconnectGmail(): Promise<void> {
    await api.post('/email/disconnect');
  },

  async getGmailStatus(): Promise<{ connected: boolean; email?: string }> {
    const response = await api.get('/email/status');
    return response.data;
  },

  async sendEmail(data: EmailTemplate): Promise<void> {
    await api.post('/email/send', data);
  },

  async getEmailHistory(params?: {
    contactId?: string;
    leadId?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const response = await api.get('/email/history', { params });
    return response.data;
  },

  async trackEmailOpen(emailId: string): Promise<void> {
    await api.post(`/email/${emailId}/track-open`);
  },

  async trackEmailClick(emailId: string, linkUrl: string): Promise<void> {
    await api.post(`/email/${emailId}/track-click`, { linkUrl });
  },

  async getEmailTemplates(): Promise<any[]> {
    const response = await api.get('/email/templates');
    return response.data;
  },

  async createEmailTemplate(data: {
    name: string;
    subject: string;
    body: string;
  }): Promise<any> {
    const response = await api.post('/email/templates', data);
    return response.data;
  },
};

