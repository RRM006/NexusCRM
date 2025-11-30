import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { leadsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Target,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Loader2,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { validateForm, getTodayDateString } from '../../utils/validation'

const Leads = () => {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    status: 'NEW',
    source: 'OTHER',
    priority: 3,
    expectedCloseDate: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation config
  const validationConfig = {
    title: { required: true, min: 3, max: 100, label: 'Title' },
    description: { required: false, max: 1000, label: 'Description' },
    value: { required: false, min: 0, max: 999999999, label: 'Value' },
    expectedCloseDate: { required: false, futureDate: true, allowToday: true, label: 'Expected Close Date' }
  }

  useEffect(() => {
    fetchLeads()
  }, [pagination.page, searchQuery, statusFilter])

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter
      })
      if (response.data.success) {
        setLeads(response.data.data.leads)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
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
      const data = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        priority: parseInt(formData.priority),
        expectedCloseDate: formData.expectedCloseDate || null
      }
      
      if (editingLead) {
        await leadsAPI.update(editingLead.id, data)
        toast.success('Lead updated successfully')
      } else {
        await leadsAPI.create(data)
        toast.success('Lead created successfully')
      }
      setShowModal(false)
      setEditingLead(null)
      setFormData({ title: '', description: '', value: '', status: 'NEW', source: 'OTHER', priority: 3, expectedCloseDate: '' })
      setErrors({})
      fetchLeads()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save lead')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (lead) => {
    setEditingLead(lead)
    setFormData({
      title: lead.title,
      description: lead.description || '',
      value: lead.value?.toString() || '',
      status: lead.status,
      source: lead.source,
      priority: lead.priority,
      expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.split('T')[0] : ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return
    try {
      await leadsAPI.delete(id)
      toast.success('Lead deleted successfully')
      fetchLeads()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lead')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      NEW: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      CONTACTED: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      QUALIFIED: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      PROPOSAL: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      NEGOTIATION: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      WON: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      LOST: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    }
    return colors[status] || colors.NEW
  }

  const getPriorityLabel = (priority) => {
    const labels = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' }
    return labels[priority] || 'Medium'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Leads</h1>
          <p className="text-dark-500">Track and manage your sales pipeline</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null)
            setFormData({ title: '', description: '', value: '', status: 'NEW', source: 'OTHER', priority: 3, expectedCloseDate: '' })
            setErrors({})
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="input pl-12"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                    {lead.title.charAt(0)}
                  </div>
                  <span className={`badge ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{lead.title}</h3>
                {lead.description && (
                  <p className="text-dark-500 text-sm mb-4 line-clamp-2">{lead.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-dark-500 mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ${lead.value?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {lead.source}
                  </div>
                </div>

                {lead.customer && (
                  <div className="text-sm text-dark-500 mb-4">
                    Customer: {lead.customer.name}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-dark-100 dark:border-dark-800">
                  <span className="text-xs text-dark-500">
                    Priority: {getPriorityLabel(lead.priority)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                    >
                      <Eye className="w-4 h-4 text-dark-400" />
                    </button>
                    <button
                      onClick={() => handleEdit(lead)}
                      className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                    >
                      <Pencil className="w-4 h-4 text-dark-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Target className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No leads found</h3>
            <p className="text-dark-500 mb-6">Start building your pipeline by adding leads</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-dark-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
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

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
                <h2 className="text-xl font-semibold">
                  {editingLead ? 'Edit Lead' : 'Add Lead'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Title <span className="text-red-500">*</span></label>
                    <span className={`text-xs ${formData.title.length > 90 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.title.length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setFormData(prev => ({ ...prev, title: e.target.value }))
                        setErrors(prev => ({ ...prev, title: null }))
                      }
                    }}
                    required
                    minLength={3}
                    maxLength={100}
                    className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Lead title (min 3 characters)"
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
                    <label className="label">Description</label>
                    <span className={`text-xs ${formData.description.length > 900 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                    }}
                    maxLength={1000}
                    className={`input min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Lead description"
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
                    <label className="label">Value ($)</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      className="input"
                      placeholder="0"
                      min="0"
                      max="999999999"
                    />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input"
                    >
                      <option value="1">Very Low</option>
                      <option value="2">Low</option>
                      <option value="3">Medium</option>
                      <option value="4">High</option>
                      <option value="5">Very High</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="PROPOSAL">Proposal</option>
                      <option value="NEGOTIATION">Negotiation</option>
                      <option value="WON">Won</option>
                      <option value="LOST">Lost</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      className="input"
                    >
                      <option value="WEBSITE">Website</option>
                      <option value="REFERRAL">Referral</option>
                      <option value="SOCIAL_MEDIA">Social Media</option>
                      <option value="EMAIL_CAMPAIGN">Email Campaign</option>
                      <option value="COLD_CALL">Cold Call</option>
                      <option value="TRADE_SHOW">Trade Show</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Expected Close Date</label>
                  <input
                    type="date"
                    value={formData.expectedCloseDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))
                      setErrors(prev => ({ ...prev, expectedCloseDate: null }))
                    }}
                    min={getTodayDateString()}
                    className={`input ${errors.expectedCloseDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.expectedCloseDate && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.expectedCloseDate}
                    </p>
                  )}
                  <p className="text-xs text-dark-400 mt-1">Cannot select a past date</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setErrors({})
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : editingLead ? (
                      'Update Lead'
                    ) : (
                      'Add Lead'
                    )}
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

export default Leads

