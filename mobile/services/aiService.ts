import api from '../utils/axios';
import { ChatMessage } from '../types';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';

export const aiService = {
  async sendMessage(message: string, history: ChatMessage[]): Promise<ChatMessage> {
    const response = await api.post('/ai/chat', {
      message,
      history: history.slice(-10), // Send last 10 messages for context
    });

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.data.message,
      timestamp: new Date().toISOString(),
    };
  },

  async executeTool(toolName: string, params: any): Promise<any> {
    const response = await api.post('/ai/tools/execute', {
      tool: toolName,
      params,
    });
    return response.data;
  },

  async getLeads(): Promise<any[]> {
    const response = await api.post('/ai/tools/execute', {
      tool: 'get_leads',
      params: {},
    });
    return response.data;
  },

  async getTasks(): Promise<any[]> {
    const response = await api.post('/ai/tools/execute', {
      tool: 'get_tasks',
      params: {},
    });
    return response.data;
  },

  async getIssues(): Promise<any[]> {
    const response = await api.post('/ai/tools/execute', {
      tool: 'get_issues',
      params: {},
    });
    return response.data;
  },

  async updateLeadStatus(leadId: string, status: string): Promise<void> {
    await api.post('/ai/tools/execute', {
      tool: 'update_lead_status',
      params: { leadId, status },
    });
  },

  async createNote(data: { title: string; content: string; entityType?: string; entityId?: string }): Promise<void> {
    await api.post('/ai/tools/execute', {
      tool: 'create_note',
      params: data,
    });
  },

  async searchCRM(query: string): Promise<any[]> {
    const response = await api.post('/ai/tools/execute', {
      tool: 'search_crm',
      params: { query },
    });
    return response.data;
  },

  async draftEmail(data: { to: string; subject: string; context: string }): Promise<string> {
    const response = await api.post('/ai/tools/execute', {
      tool: 'draft_email',
      params: data,
    });
    return response.data.emailBody;
  },

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    await storage.setObject(STORAGE_KEYS.CHAT_HISTORY, messages);
  },

  async loadChatHistory(): Promise<ChatMessage[]> {
    const history = await storage.getObject<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
    return history || [];
  },

  async clearChatHistory(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  },
};

