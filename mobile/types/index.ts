export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  userId: string;
  companyId: string;
  role: UserRole;
  user: User;
  company: Company;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  companies: CompanyUser[];
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  assignedToId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
}

export interface Contact {
  id: string;
  companyId: string;
  customerId?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  assignedToId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  createdBy?: User;
}

export interface Note {
  id: string;
  companyId: string;
  title: string;
  content: string;
  entityType?: 'CUSTOMER' | 'LEAD' | 'CONTACT' | 'TASK';
  entityId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

export interface Activity {
  id: string;
  companyId: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK';
  description: string;
  entityType?: string;
  entityId?: string;
  userId: string;
  createdAt: string;
  user?: User;
}

export interface Issue {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedById: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  reportedBy?: User;
  assignedTo?: User;
}

export interface CallSession {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'RINGING' | 'CONNECTED' | 'ENDED';
  startedAt: string;
  endedAt?: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface EmailTemplate {
  to: string;
  subject: string;
  body: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface TelegramStatus {
  connected: boolean;
  phoneNumber?: string;
  username?: string;
}

