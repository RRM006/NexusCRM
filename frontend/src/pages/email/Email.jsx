import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Send, 
  FileText, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Star,
  BarChart3,
  Check,
  X,
  ExternalLink,
  Loader2,
  Inbox,
  Eye,
  MousePointer,
  AlertTriangle
} from 'lucide-react'
import { emailAPI } from '../../services/api'
import EmailCompose from '../../components/email/EmailCompose'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'crm', name: 'CRM Emails', icon: BarChart3 },
  { id: 'templates', name: 'Templates', icon: FileText }
]

const Email = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('inbox')
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [gmailStatus, setGmailStatus] = useState({ isConnected: false, email: null })
  const [isLoading, setIsLoading] = useState(true)
  const [emails, setEmails] = useState([])
  const [templates, setTemplates] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Template form state
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    bodyHtml: '',
    category: ''
  })

  useEffect(() => {
    checkGmailStatus()
  }, [])

  useEffect(() => {
    if (gmailStatus.isConnected) {
      fetchData()
    }
  }, [activeTab, gmailStatus.isConnected])

  const checkGmailStatus = async () => {
    try {
      const response = await emailAPI.getGmailStatus()
      if (response.data.success) {
        setGmailStatus(response.data.data)
      }
    } catch (error) {
      console.error('Failed to check Gmail status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      switch (activeTab) {
        case 'inbox':
          const inboxRes = await emailAPI.getInbox({ maxResults: 50, query: searchQuery || undefined })
          if (inboxRes.data.success) {
            setEmails(inboxRes.data.data.emails)
          }
          break
        case 'sent':
          const sentRes = await emailAPI.getSent({ maxResults: 50 })
          if (sentRes.data.success) {
            setEmails(sentRes.data.data.emails)
          }
          break
        case 'crm':
          const [crmRes, statsRes] = await Promise.all([
            emailAPI.getCrmEmails({ limit: 50 }),
            emailAPI.getEmailStats()
          ])
          if (crmRes.data.success) {
            setEmails(crmRes.data.data.emails)
          }
          if (statsRes.data.success) {
            setStats(statsRes.data.data)
          }
          break
        case 'templates':
          const templatesRes = await emailAPI.getTemplates()
          if (templatesRes.data.success) {
            setTemplates(templatesRes.data.data.templates)
          }
          break
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to fetch emails')
    } finally {
      setIsLoading(false)
    }
  }

  const connectGmail = async () => {
    try {
      const response = await emailAPI.getGmailAuthUrl()
      if (response.data.success) {
        // Add user ID to state for callback
        const authUrl = new URL(response.data.data.authUrl)
        authUrl.searchParams.set('state', user.id)
        window.location.href = authUrl.toString()
      }
    } catch (error) {
      toast.error('Failed to start Gmail connection')
    }
  }

  const disconnectGmail = async () => {
    try {
      await emailAPI.disconnectGmail()
      setGmailStatus({ isConnected: false, email: null })
      toast.success('Gmail disconnected')
    } catch (error) {
      toast.error('Failed to disconnect Gmail')
    }
  }

  const handleDeleteEmail = async (id) => {
    try {
      await emailAPI.deleteEmail(id)
      setEmails(emails.filter(e => e.id !== id))
      toast.success('Email deleted')
    } catch (error) {
      toast.error('Failed to delete email')
    }
  }

  const handleViewEmail = async (email) => {
    try {
      const response = await emailAPI.getEmail(email.id)
      if (response.data.success) {
        setSelectedEmail(response.data.data.email)
      }
    } catch (error) {
      toast.error('Failed to load email')
    }
  }

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await emailAPI.updateTemplate(editingTemplate.id, templateForm)
        toast.success('Template updated')
      } else {
        await emailAPI.createTemplate(templateForm)
        toast.success('Template created')
      }
      setShowTemplateForm(false)
      setEditingTemplate(null)
      setTemplateForm({ name: '', subject: '', bodyHtml: '', category: '' })
      fetchData()
    } catch (error) {
      toast.error('Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id) => {
    try {
      await emailAPI.deleteTemplate(id)
      toast.success('Template deleted')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Check for connection callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') {
      toast.success('Gmail connected successfully!')
      checkGmailStatus()
      window.history.replaceState({}, '', '/email')
    } else if (params.get('error')) {
      toast.error('Failed to connect Gmail. Please try again.')
      window.history.replaceState({}, '', '/email')
    }
  }, [])

  if (isLoading && !gmailStatus.isConnected) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  // Gmail not connected
  if (!gmailStatus.isConnected) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Gmail</h2>
          <p className="text-dark-500 mb-6">
            Connect your Gmail account to send and receive emails directly from your CRM.
            Track opens, clicks, and manage all your customer communications in one place.
          </p>
          <button
            onClick={connectGmail}
            className="btn btn-primary px-8 py-3"
          >
            <Mail className="w-5 h-5" />
            Connect Gmail
          </button>
          <p className="text-xs text-dark-400 mt-4">
            We only request permission to send and read emails. Your data is secure.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Email</h1>
          <p className="text-dark-500">
            Connected as <span className="font-medium text-primary-500">{gmailStatus.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            className="btn btn-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Compose
          </button>
        </div>
      </div>

      {/* Stats (for CRM tab) */}
      {activeTab === 'crm' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-dark-500">Sent</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.openRate}%</p>
                <p className="text-sm text-dark-500">Open Rate</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MousePointer className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.clickRate}%</p>
                <p className="text-sm text-dark-500">Click Rate</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bounceRate}%</p>
                <p className="text-sm text-dark-500">Bounce Rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-dark-200 dark:border-dark-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
          
          {/* Disconnect button */}
          <div className="ml-auto px-4">
            <button
              onClick={disconnectGmail}
              className="text-sm text-dark-500 hover:text-red-500 transition-colors"
            >
              Disconnect Gmail
            </button>
          </div>
        </div>

        {/* Search (for inbox) */}
        {(activeTab === 'inbox' || activeTab === 'sent') && (
          <div className="p-4 border-b border-dark-200 dark:border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                className="input pl-10"
              />
            </div>
          </div>
        )}

        {/* Email List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Inbox/Sent */}
            {(activeTab === 'inbox' || activeTab === 'sent') && (
              <div className="divide-y divide-dark-200 dark:divide-dark-700">
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-dark-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No emails found</p>
                  </div>
                ) : (
                  emails.map((email) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800 cursor-pointer transition-colors ${
                        !email.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                      }`}
                      onClick={() => handleViewEmail(email)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                            {activeTab === 'inbox' ? email.from : email.to}
                          </p>
                          {!email.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${!email.isRead ? 'text-dark-700 dark:text-dark-300' : 'text-dark-500'}`}>
                          {email.subject}
                        </p>
                        <p className="text-xs text-dark-400 truncate">{email.snippet}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-500 whitespace-nowrap">
                          {formatDate(email.date)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEmail(email.id)
                          }}
                          className="p-1 rounded hover:bg-dark-200 dark:hover:bg-dark-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-dark-400 hover:text-red-500" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* CRM Emails */}
            {activeTab === 'crm' && (
              <div className="divide-y divide-dark-200 dark:divide-dark-700">
                {emails.length === 0 ? (
                  <div className="text-center py-12 text-dark-500">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No CRM emails sent yet</p>
                  </div>
                ) : (
                  emails.map((email) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{email.toEmail}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            email.status === 'OPENED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            email.status === 'CLICKED' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                            email.status === 'BOUNCED' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {email.status}
                          </span>
                        </div>
                        <p className="text-sm text-dark-600 dark:text-dark-400 truncate">{email.subject}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-dark-500">
                          {email.openCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {email.openCount} opens
                            </span>
                          )}
                          {email.clickCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MousePointer className="w-3 h-3" /> {email.clickCount} clicks
                            </span>
                          )}
                          {email.contact && (
                            <span>Contact: {email.contact.firstName} {email.contact.lastName}</span>
                          )}
                          {email.lead && (
                            <span>Lead: {email.lead.title}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-dark-500 whitespace-nowrap">
                        {formatDate(email.createdAt)}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* Templates */}
            {activeTab === 'templates' && (
              <div className="p-4">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => {
                      setEditingTemplate(null)
                      setTemplateForm({ name: '', subject: '', bodyHtml: '', category: '' })
                      setShowTemplateForm(true)
                    }}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    New Template
                  </button>
                </div>

                {showTemplateForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 mb-6"
                  >
                    <h3 className="font-semibold mb-4">
                      {editingTemplate ? 'Edit Template' : 'New Template'}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Template Name</label>
                          <input
                            type="text"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                            className="input"
                            placeholder="e.g., Welcome Email"
                          />
                        </div>
                        <div>
                          <label className="label">Category</label>
                          <input
                            type="text"
                            value={templateForm.category}
                            onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                            className="input"
                            placeholder="e.g., Onboarding"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Subject Line</label>
                        <input
                          type="text"
                          value={templateForm.subject}
                          onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                          className="input"
                          placeholder="Email subject"
                        />
                      </div>
                      <div>
                        <label className="label">Body (HTML supported)</label>
                        <textarea
                          value={templateForm.bodyHtml}
                          onChange={(e) => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
                          className="input min-h-[200px]"
                          placeholder="Write your email template... Use {{variableName}} for dynamic content"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setShowTemplateForm(false)
                            setEditingTemplate(null)
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          className="btn btn-primary"
                        >
                          {editingTemplate ? 'Update' : 'Create'} Template
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {templates.length === 0 && !showTemplateForm ? (
                    <div className="col-span-2 text-center py-12 text-dark-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No templates yet. Create your first template!</p>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            {template.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-400">
                                {template.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTemplate(template)
                                setTemplateForm({
                                  name: template.name,
                                  subject: template.subject,
                                  bodyHtml: template.bodyHtml,
                                  category: template.category || ''
                                })
                                setShowTemplateForm(true)
                              }}
                              className="p-1.5 rounded hover:bg-dark-100 dark:hover:bg-dark-700"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1.5 rounded hover:bg-dark-100 dark:hover:bg-dark-700 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-dark-500 mt-2 truncate">
                          Subject: {template.subject}
                        </p>
                        <p className="text-xs text-dark-400 mt-1">
                          Created by {template.createdBy?.name}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEmail(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-200 dark:border-dark-700">
              <h3 className="font-semibold truncate">{selectedEmail.subject}</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 border-b border-dark-200 dark:border-dark-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                  {selectedEmail.from?.charAt(0)?.toUpperCase() || 'E'}
                </div>
                <div>
                  <p className="font-medium">{selectedEmail.from}</p>
                  <p className="text-sm text-dark-500">To: {selectedEmail.to}</p>
                  {selectedEmail.cc && (
                    <p className="text-sm text-dark-500">Cc: {selectedEmail.cc}</p>
                  )}
                </div>
                <span className="ml-auto text-sm text-dark-500">
                  {new Date(selectedEmail.date).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedEmail.bodyHtml ? (
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{selectedEmail.bodyText}</pre>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
              <button
                onClick={() => {
                  setSelectedEmail(null)
                  setIsComposeOpen(true)
                }}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4" />
                Reply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Compose Modal */}
      <EmailCompose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSent={() => {
          if (activeTab === 'crm') fetchData()
        }}
      />
    </div>
  )
}

export default Email

