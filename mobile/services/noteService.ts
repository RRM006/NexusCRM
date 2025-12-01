import api from '../utils/axios';
import { Note } from '../types';

export const noteService = {
  async getNotes(params?: {
    search?: string;
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Note[]; total: number }> {
    const response = await api.get('/notes', { params });
    return response.data;
  },

  async getNoteById(id: string): Promise<Note> {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  async createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'createdById'>): Promise<Note> {
    const response = await api.post('/notes', data);
    return response.data;
  },

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const response = await api.put(`/notes/${id}`, data);
    return response.data;
  },

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/notes/${id}`);
  },
};

