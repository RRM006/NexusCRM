import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { contactsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  UserCircle,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  AlertCircle
} from 'lucide-react'
import { validateForm } from '../../utils/validation'

const Contacts = () => {
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    isPrimary: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation config
  const validationConfig = {
    firstName: { required: true, min: 2, max: 50, label: 'First Name' },
    lastName: { required: true, min: 2, max: 50, label: 'Last Name' },
    email: { required: true, min: 5, max: 255, pattern: 'email', label: 'Email' },
    phone: { required: false, min: 10, max: 20, pattern: 'phone', label: 'Phone' },
    jobTitle: { required: false, min: 2, max: 100, label: 'Job Title' },
    department: { required: false, min: 2, max: 100, label: 'Department' }
  }

  useEffect(() => {
    fetchContacts()
  }, [pagination.page, searchQuery])

  const fetchContacts = async () => {
    try {
      const response = await contactsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery
      })
      if (response.data.success) {
        setContacts(response.data.data.contacts)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch contacts')
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
      if (editingContact) {
        await contactsAPI.update(editingContact.id, formData)
        toast.success('Contact updated successfully')
      } else {
        await contactsAPI.create(formData)
        toast.success('Contact created successfully')
      }
      setShowModal(false)
      setEditingContact(null)
      resetForm()
      fetchContacts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contact')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      department: '',
      isPrimary: false
    })
    setErrors({})
  }

  const handleEdit = (contact) => {
    setEditingContact(contact)
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      isPrimary: contact.isPrimary
    })
    setErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return
    try {
      await contactsAPI.delete(id)
      toast.success('Contact deleted successfully')
      fetchContacts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete contact')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Contacts</h1>
          <p className="text-dark-500">Manage your contact directory</p>
        </div>
        <button
          onClick={() => {
            setEditingContact(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Contacts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="avatar avatar-lg">
                    {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                  </div>
                  {contact.isPrimary && (
                    <span className="badge badge-primary">Primary</span>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-1">
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.jobTitle && (
                  <p className="text-dark-500 text-sm flex items-center gap-1 mb-3">
                    <Briefcase className="w-4 h-4" />
                    {contact.jobTitle}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-dark-500 hover:text-primary-500"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-dark-500 hover:text-primary-500"
                    >
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </a>
                  )}
                </div>

                {contact.customer && (
                  <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-800">
                    <p className="text-xs text-dark-500">
                      Company: {contact.customer.name}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-1 mt-4">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                  >
                    <Pencil className="w-4 h-4 text-dark-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <UserCircle className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
            <p className="text-dark-500 mb-6">Start by adding your first contact</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Add Contact
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
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
                  {editingContact ? 'Edit Contact' : 'Add Contact'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label">First Name <span className="text-red-500">*</span></label>
                      <span className={`text-xs ${formData.firstName.length > 45 ? 'text-amber-500' : 'text-dark-400'}`}>
                        {formData.firstName.length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          setFormData(prev => ({ ...prev, firstName: e.target.value }))
                          setErrors(prev => ({ ...prev, firstName: null }))
                        }
                      }}
                      required
                      minLength={2}
                      maxLength={50}
                      className={`input ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Min 2 characters"
                    />
                    {errors.firstName && (
                      <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label">Last Name <span className="text-red-500">*</span></label>
                      <span className={`text-xs ${formData.lastName.length > 45 ? 'text-amber-500' : 'text-dark-400'}`}>
                        {formData.lastName.length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          setFormData(prev => ({ ...prev, lastName: e.target.value }))
                          setErrors(prev => ({ ...prev, lastName: null }))
                        }
                      }}
                      required
                      minLength={2}
                      maxLength={50}
                      className={`input ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="Min 2 characters"
                    />
                    {errors.lastName && (
                      <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Email <span className="text-red-500">*</span></label>
                    <span className={`text-xs ${formData.email.length > 230 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.email.length}/255
                    </span>
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      if (e.target.value.length <= 255) {
                        setFormData(prev => ({ ...prev, email: e.target.value }))
                        setErrors(prev => ({ ...prev, email: null }))
                      }
                    }}
                    required
                    maxLength={255}
                    className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Phone</label>
                    <span className={`text-xs ${formData.phone.length > 18 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.phone.length}/20
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      if (e.target.value.length <= 20) {
                        setFormData(prev => ({ ...prev, phone: e.target.value }))
                        setErrors(prev => ({ ...prev, phone: null }))
                      }
                    }}
                    maxLength={20}
                    className={`input ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="+1 (555) 000-0000"
                  />
                  {errors.phone && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label">Job Title</label>
                      <span className={`text-xs ${formData.jobTitle.length > 90 ? 'text-amber-500' : 'text-dark-400'}`}>
                        {formData.jobTitle.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) {
                          setFormData(prev => ({ ...prev, jobTitle: e.target.value }))
                        }
                      }}
                      maxLength={100}
                      className="input"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="label">Department</label>
                      <span className={`text-xs ${formData.department.length > 90 ? 'text-amber-500' : 'text-dark-400'}`}>
                        {formData.department.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => {
                        if (e.target.value.length <= 100) {
                          setFormData(prev => ({ ...prev, department: e.target.value }))
                        }
                      }}
                      maxLength={100}
                      className="input"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Mark as primary contact</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); setErrors({}) }} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingContact ? 'Update' : 'Add'}
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

export default Contacts

