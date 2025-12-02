import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Request interceptor - add auth token and company ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const companyId = localStorage.getItem('currentCompanyId')
    if (companyId) {
      config.headers['X-Company-Id'] = companyId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken
        })

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentCompanyId')
        localStorage.removeItem('currentRole')
        
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// API Service Functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  googleSignIn: (credential) => api.post('/auth/google', { credential }),
  unlinkGoogle: () => api.delete('/auth/google/unlink'),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
}

export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getMyCompanies: () => api.get('/companies/my'),
  getCompany: (id) => api.get(`/companies/${id}`),
  updateCompany: (id, data) => api.put(`/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/companies/${id}`),
  getMembers: (id) => api.get(`/companies/${id}/members`),
  search: (query) => api.get(`/companies/search?q=${encodeURIComponent(query)}`),
  join: (companyId) => api.post('/companies/join', { companyId })
}

export const userRolesAPI = {
  getMyRoles: () => api.get('/user-company-roles/my-roles'),
  inviteUser: (data) => api.post('/user-company-roles/invite', data),
  updateRole: (id, data) => api.put(`/user-company-roles/${id}`, data),
  removeUser: (id) => api.delete(`/user-company-roles/${id}`),
  leaveCompany: (companyId) => api.delete(`/user-company-roles/leave/${companyId}`)
}

export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
}

export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  getStats: () => api.get('/leads/stats')
}

export const contactsAPI = {
  getAll: (params) => api.get('/contacts', { params }),
  getOne: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`)
}

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getMyTasks: () => api.get('/tasks/my')
}

export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`)
}

export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getRecent: (limit = 10) => api.get(`/activities/recent?limit=${limit}`),
  create: (data) => api.post('/activities', data)
}

export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getStaffDashboard: () => api.get('/dashboard/staff'),
  getCustomerDashboard: () => api.get('/dashboard/customer'),
  getStats: () => api.get('/dashboard/stats')
}

export const issuesAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getOne: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  update: (id, data) => api.put(`/issues/${id}`, data),
  delete: (id) => api.delete(`/issues/${id}`),
  getStats: () => api.get('/issues/stats'),
  addCall: (id, data) => api.post(`/issues/${id}/calls`, data),
  getCallHistory: (id) => api.get(`/issues/${id}/calls`)
}

// Telegram API
export const telegramAPI = {
  updatePhone: (phone) => api.put('/telegram/phone', { phone }),
  getStatus: () => api.get('/telegram/status'),
  unlink: () => api.delete('/telegram/unlink'),
  testNotification: () => api.post('/telegram/test-notification'),
  getNotifications: (params) => api.get('/telegram/notifications', { params }),
  markAsRead: (id) => api.put(`/telegram/notifications/${id}/read`),
  markAllAsRead: () => api.put('/telegram/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/telegram/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/telegram/notifications')
}

// AI Assistant API (with MCP tools)
export const aiAPI = {
  chat: (message, conversationId, context = null) => api.post('/ai/chat', { message, conversationId, context }),
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id) => api.get(`/ai/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
  clearConversations: () => api.delete('/ai/conversations'),
  getSuggestions: () => api.get('/ai/suggestions'),
  getTools: () => api.get('/ai/tools') // Get available MCP tools for current role
}

// Pipeline API
export const pipelineAPI = {
  // Stages
  getStages: () => api.get('/pipeline/stages'),
  createStage: (data) => api.post('/pipeline/stages', data),
  updateStage: (id, data) => api.put(`/pipeline/stages/${id}`, data),
  deleteStage: (id) => api.delete(`/pipeline/stages/${id}`),
  reorderStages: (stageIds) => api.post('/pipeline/stages/reorder', { stageIds }),
  
  // Kanban view
  getKanbanView: (type = 'leads') => api.get(`/pipeline/kanban?type=${type}`),
  
  // Drag & drop
  moveToStage: (data) => api.post('/pipeline/move', data),
  reorderInStage: (data) => api.post('/pipeline/reorder', data),
  
  // Analytics
  getAnalytics: (period = 30) => api.get(`/pipeline/analytics?period=${period}`),
  
  // Convert lead to deal
  convertToDeal: (leadId, data) => api.post(`/pipeline/convert/${leadId}`, data)
}

// Deals API
export const dealsAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getOne: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  delete: (id) => api.delete(`/deals/${id}`),
  markAsWon: (id, data) => api.post(`/deals/${id}/won`, data),
  markAsLost: (id, data) => api.post(`/deals/${id}/lost`, data),
  getStats: (period = 30) => api.get(`/deals/stats?period=${period}`)
}

// Super Admin API
export const superAdminAPI = {
  login: (data) => axios.post(`${API_URL}/super-admin/login`, data),
  verify: () => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  getDashboard: () => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  getCompanies: (params) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/companies`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
  },
  getCompanyDetails: (companyId) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/companies/${companyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  toggleCompanyStatus: (companyId) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.patch(`${API_URL}/super-admin/companies/${companyId}/toggle-status`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  getUsers: (params) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
  },
  // Issues management
  getIssues: (params) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/issues`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
  },
  getIssueDetails: (issueId) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.get(`${API_URL}/super-admin/issues/${issueId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  updateIssueStatus: (issueId, status) => {
    const token = localStorage.getItem('superAdminToken')
    return axios.patch(`${API_URL}/super-admin/issues/${issueId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }
}

// 1:1 Chat API for authenticated company users (ADMIN / STAFF / CUSTOMER)
export const chatAPI = {
  start: (withUserId) => api.post('/chat/start', { withUserId }),
  send: (conversationId, content) => api.post('/chat/send', { conversationId, content }),
  listConversations: () => api.get('/chat/conversations'),
  getConversation: (conversationId) => api.get(`/chat/${conversationId}`)
}

// Super Admin chat API (uses superAdminToken and bypasses company headers)
export const superAdminChatAPI = {
  startWithCompany: (companyId) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      console.error('superAdminChatAPI: No superAdminToken found in localStorage')
      return Promise.reject(new Error('Super Admin not authenticated'))
    }
    return axios.post(`${API_URL}/chat/super-admin/start-company`, { companyId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  startWithCustomer: (customerUserId, companyId) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      console.error('superAdminChatAPI: No superAdminToken found in localStorage')
      return Promise.reject(new Error('Super Admin not authenticated'))
    }
    return axios.post(`${API_URL}/chat/super-admin/start-customer`, { customerUserId, companyId }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  send: (conversationId, content) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      return Promise.reject(new Error('Super Admin not authenticated'))
    }
    return axios.post(`${API_URL}/chat/super-admin/send`, { conversationId, content }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  listConversations: () => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      return Promise.reject(new Error('Super Admin not authenticated'))
    }
    return axios.get(`${API_URL}/chat/super-admin/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  },
  getConversation: (conversationId) => {
    const token = localStorage.getItem('superAdminToken')
    if (!token) {
      return Promise.reject(new Error('Super Admin not authenticated'))
    }
    return axios.get(`${API_URL}/chat/super-admin/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }
}

// Email API
export const emailAPI = {
  // Gmail OAuth
  getGmailAuthUrl: () => api.get('/email/gmail/auth-url'),
  disconnectGmail: () => api.delete('/email/gmail/disconnect'),
  getGmailStatus: () => api.get('/email/gmail/status'),
  
  // Email Operations
  sendEmail: (data) => api.post('/email/send', data),
  getInbox: (params) => api.get('/email/inbox', { params }),
  getSent: (params) => api.get('/email/sent', { params }),
  getEmail: (id) => api.get(`/email/message/${id}`),
  deleteEmail: (id) => api.delete(`/email/message/${id}`),
  
  // CRM Emails
  getCrmEmails: (params) => api.get('/email/crm', { params }),
  getEmailStats: () => api.get('/email/stats'),
  getEmailHistory: (entityType, entityId) => api.get(`/email/history/${entityType}/${entityId}`),
  
  // Templates
  getTemplates: () => api.get('/email/templates'),
  createTemplate: (data) => api.post('/email/templates', data),
  updateTemplate: (id, data) => api.put(`/email/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/email/templates/${id}`)
}

