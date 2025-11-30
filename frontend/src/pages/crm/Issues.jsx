import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompany } from '../../context/CompanyContext'
import { issuesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Loader2,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  PhoneCall,
  PhoneOff,
  PhoneMissed
} from 'lucide-react'
import { validateForm } from '../../utils/validation'

const Issues = () => {
  const { currentRole } = useCompany()
  const isAdmin = currentRole === 'ADMIN'
  const isCustomer = currentRole === 'CUSTOMER'
  
  const [issues, setIssues] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'GENERAL'
  })
  const [callData, setCallData] = useState({
    callType: 'OUTBOUND',
    duration: 0,
    status: 'COMPLETED',
    notes: ''
  })
  const [resolution, setResolution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation config
  const validationConfig = {
    title: { required: true, min: 5, max: 150, label: 'Title' },
    description: { required: true, min: 10, max: 2000, label: 'Description' }
  }

  useEffect(() => {
    fetchIssues()
  }, [pagination.page, statusFilter])

  const fetchIssues = async () => {
    try {
      const response = await issuesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter
      })
      if (response.data.success) {
        setIssues(response.data.data.issues)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch issues')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateIssue = async (e) => {
    e.preventDefault()
    
    // Validate form
    const { isValid, errors: validationErrors } = validateForm(formData, validationConfig)
    setErrors(validationErrors)
    
    if (!isValid) {
      toast.error('Please fix the validation errors')
      return
    }
    
    setIsSubmitting(true)
    try {
      await issuesAPI.create(formData)
      toast.success('Issue created successfully')
      setShowCreateModal(false)
      setFormData({ title: '', description: '', priority: 'MEDIUM', category: 'GENERAL' })
      setErrors({})
      fetchIssues()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create issue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveIssue = async (status) => {
    if (!selectedIssue) return
    setIsSubmitting(true)
    try {
      await issuesAPI.update(selectedIssue.id, { status, resolution })
      toast.success(`Issue ${status.toLowerCase()} successfully`)
      setShowDetailModal(false)
      setSelectedIssue(null)
      setResolution('')
      fetchIssues()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update issue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteIssue = async (id) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return
    try {
      await issuesAPI.delete(id)
      toast.success('Issue deleted successfully')
      fetchIssues()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete issue')
    }
  }

  const handleAddCall = async (e) => {
    e.preventDefault()
    if (!selectedIssue) return
    setIsSubmitting(true)
    try {
      await issuesAPI.addCall(selectedIssue.id, callData)
      toast.success('Call logged successfully')
      setShowCallModal(false)
      setCallData({ callType: 'OUTBOUND', duration: 0, status: 'COMPLETED', notes: '' })
      // Refresh issue details
      const response = await issuesAPI.getOne(selectedIssue.id)
      if (response.data.success) {
        setSelectedIssue(response.data.data.issue)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log call')
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewIssueDetails = async (issue) => {
    try {
      const response = await issuesAPI.getOne(issue.id)
      if (response.data.success) {
        setSelectedIssue(response.data.data.issue)
        setResolution(response.data.data.issue.resolution || '')
        setShowDetailModal(true)
      }
    } catch (error) {
      toast.error('Failed to load issue details')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      IN_PROGRESS: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      RESOLVED: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      CLOSED: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
    }
    return colors[status] || colors.OPEN
  }

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'bg-green-100 dark:bg-green-900/30 text-green-600',
      MEDIUM: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
      CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-600'
    }
    return colors[priority] || colors.MEDIUM
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CLOSED': return <XCircle className="w-5 h-5 text-gray-500" />
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-amber-500" />
      default: return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getCallStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <PhoneCall className="w-4 h-4 text-green-500" />
      case 'MISSED': return <PhoneMissed className="w-4 h-4 text-red-500" />
      case 'NO_ANSWER': return <PhoneOff className="w-4 h-4 text-amber-500" />
      default: return <Phone className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Issues</h1>
          <p className="text-dark-500">
            {isCustomer ? 'Submit and track your support issues' : 'Manage customer support issues'}
          </p>
        </div>
        {isCustomer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create Issue
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : issues.length > 0 ? (
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {issues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800/50"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(issue.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{issue.title}</h3>
                      <span className={`badge text-xs ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`badge text-xs ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <p className="text-sm text-dark-500 line-clamp-2 mb-2">{issue.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-dark-500">
                      {isAdmin && issue.customer && (
                        <span>Customer: {issue.customer.name} ({issue.customer.email})</span>
                      )}
                      <span>Created: {new Date(issue.createdAt).toLocaleString()}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {issue._count?.calls || 0} calls
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => viewIssueDetails(issue)}
                      className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-dark-400" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteIssue(issue.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No issues found</h3>
            <p className="text-dark-500 mb-6">
              {isCustomer ? 'Create your first support issue' : 'No customer issues to review'}
            </p>
            {isCustomer && (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Create Issue
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-dark-200 dark:border-dark-800">
            <p className="text-sm text-dark-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create Issue Modal (Customer Only) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
                <h2 className="text-xl font-semibold">Create New Issue</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIssue} className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Title <span className="text-red-500">*</span></label>
                    <span className={`text-xs ${formData.title.length > 135 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.title.length}/150
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      if (e.target.value.length <= 150) {
                        setFormData(prev => ({ ...prev, title: e.target.value }))
                        setErrors(prev => ({ ...prev, title: null }))
                      }
                    }}
                    required
                    minLength={5}
                    maxLength={150}
                    className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Brief description of your issue (min 5 characters)"
                  />
                  {errors.title && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Description <span className="text-red-500">*</span></label>
                    <span className={`text-xs ${formData.description.length > 1800 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.description.length}/2000
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                        setErrors(prev => ({ ...prev, description: null }))
                      }
                    }}
                    required
                    minLength={10}
                    maxLength={2000}
                    className={`input min-h-[120px] ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Please provide detailed information about your issue (min 10 characters)..."
                  />
                  {errors.description && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="input"
                    >
                      <option value="GENERAL">General</option>
                      <option value="BILLING">Billing</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="FEATURE_REQUEST">Feature Request</option>
                      <option value="BUG_REPORT">Bug Report</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowCreateModal(false); setErrors({}) }} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Issue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-xl my-8"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
                <div>
                  <h2 className="text-xl font-semibold">{selectedIssue.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${getStatusColor(selectedIssue.status)}`}>
                      {selectedIssue.status.replace('_', ' ')}
                    </span>
                    <span className={`badge text-xs ${getPriorityColor(selectedIssue.priority)}`}>
                      {selectedIssue.priority}
                    </span>
                    <span className="badge text-xs badge-info">{selectedIssue.category?.replace('_', ' ')}</span>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Customer Info (Admin Only) */}
                {isAdmin && selectedIssue.customer && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                    <div className="avatar avatar-lg">
                      {selectedIssue.customer.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedIssue.customer.name}</p>
                      <p className="text-sm text-dark-500">{selectedIssue.customer.email}</p>
                      {selectedIssue.customer.phone && (
                        <p className="text-sm text-dark-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedIssue.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-dark-600 dark:text-dark-400 whitespace-pre-wrap">{selectedIssue.description}</p>
                </div>

                {/* Resolution (if resolved) */}
                {selectedIssue.resolution && (
                  <div>
                    <h3 className="font-semibold mb-2">Resolution</h3>
                    <p className="text-dark-600 dark:text-dark-400 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      {selectedIssue.resolution}
                    </p>
                    {selectedIssue.resolvedBy && (
                      <p className="text-xs text-dark-500 mt-2">
                        Resolved by {selectedIssue.resolvedBy.name} on {new Date(selectedIssue.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Call History */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Call History ({selectedIssue.calls?.length || 0})
                    </h3>
                    {isAdmin && selectedIssue.status !== 'RESOLVED' && selectedIssue.status !== 'CLOSED' && (
                      <button
                        onClick={() => setShowCallModal(true)}
                        className="btn btn-secondary btn-sm"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Log Call
                      </button>
                    )}
                  </div>
                  
                  {selectedIssue.calls?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedIssue.calls.map((call) => (
                        <div key={call.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
                          {getCallStatusIcon(call.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{call.callType} Call</span>
                              <span className="text-xs text-dark-500">• {formatDuration(call.duration)}</span>
                              <span className="text-xs text-dark-500">• {call.status}</span>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-dark-500">{call.notes}</p>
                            )}
                            <p className="text-xs text-dark-500 mt-1">
                              {call.caller?.name} • {new Date(call.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-500 text-sm">No calls recorded for this issue</p>
                  )}
                </div>

                {/* Admin Resolution Section */}
                {isAdmin && selectedIssue.status !== 'RESOLVED' && selectedIssue.status !== 'CLOSED' && (
                  <div className="border-t border-dark-200 dark:border-dark-800 pt-6">
                    <h3 className="font-semibold mb-3">Resolve Issue</h3>
                    <textarea
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="input min-h-[100px] mb-4"
                      placeholder="Enter resolution details..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveIssue('IN_PROGRESS')}
                        disabled={isSubmitting}
                        className="btn btn-secondary"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleResolveIssue('RESOLVED')}
                        disabled={isSubmitting || !resolution}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resolve Issue'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Call Modal */}
      <AnimatePresence>
        {showCallModal && selectedIssue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowCallModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-primary-500" />
                  Log Call
                </h2>
                <button onClick={() => setShowCallModal(false)} className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCall} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Call Type</label>
                    <select
                      value={callData.callType}
                      onChange={(e) => setCallData(prev => ({ ...prev, callType: e.target.value }))}
                      className="input"
                    >
                      <option value="OUTBOUND">Outbound</option>
                      <option value="INBOUND">Inbound</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={callData.status}
                      onChange={(e) => setCallData(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="COMPLETED">Completed</option>
                      <option value="MISSED">Missed</option>
                      <option value="NO_ANSWER">No Answer</option>
                      <option value="BUSY">Busy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Duration (seconds)</label>
                  <input
                    type="number"
                    value={callData.duration}
                    onChange={(e) => setCallData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="input"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={callData.notes}
                    onChange={(e) => setCallData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input min-h-[80px]"
                    placeholder="Call notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCallModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Call'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Issues

