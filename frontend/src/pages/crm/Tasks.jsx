import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { tasksAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  CheckSquare,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  Circle
} from 'lucide-react'
import { validateForm, getTodayDateString } from '../../utils/validation'

const Tasks = () => {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation config
  const validationConfig = {
    title: { required: true, min: 3, max: 100, label: 'Title' },
    description: { required: false, max: 500, label: 'Description' },
    dueDate: { required: false, futureDate: true, allowToday: true, label: 'Due Date' }
  }

  useEffect(() => {
    fetchTasks()
  }, [pagination.page, searchQuery, statusFilter])

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery,
        status: statusFilter
      })
      if (response.data.success) {
        setTasks(response.data.data.tasks)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch tasks')
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
      if (editingTask) {
        await tasksAPI.update(editingTask.id, formData)
        toast.success('Task updated successfully')
      } else {
        await tasksAPI.create(formData)
        toast.success('Task created successfully')
      }
      setShowModal(false)
      setEditingTask(null)
      resetForm()
      fetchTasks()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: ''
    })
    setErrors({})
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await tasksAPI.delete(id)
      toast.success('Task deleted successfully')
      fetchTasks()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task')
    }
  }

  const handleStatusChange = async (task, newStatus) => {
    try {
      await tasksAPI.update(task.id, { status: newStatus })
      toast.success('Task status updated')
      fetchTasks()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-amber-500" />
      case 'CANCELLED':
        return <X className="w-5 h-5 text-red-500" />
      default:
        return <Circle className="w-5 h-5 text-dark-400" />
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 dark:bg-red-900/30 text-red-600',
      HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
      MEDIUM: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      LOW: 'bg-green-100 dark:bg-green-900/30 text-green-600'
    }
    return colors[priority] || colors.MEDIUM
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Tasks</h1>
          <p className="text-dark-500">Manage your tasks and to-dos</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null)
            resetForm()
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Task
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
              placeholder="Search tasks..."
              className="input pl-12"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800/50"
              >
                <button
                  onClick={() => handleStatusChange(
                    task,
                    task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
                  )}
                  className="mt-1"
                >
                  {getStatusIcon(task.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-dark-400' : ''}`}>
                      {task.title}
                    </h3>
                    <span className={`badge text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-dark-500 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-dark-500">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {task.assignedTo && (
                      <span>Assigned to: {task.assignedTo.name}</span>
                    )}
                    {task.customer && (
                      <span>Customer: {task.customer.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg"
                  >
                    <Pencil className="w-4 h-4 text-dark-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-dark-500 mb-6">Create your first task to get started</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Add Task
            </button>
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
                  {editingTask ? 'Edit Task' : 'Add Task'}
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
                    placeholder="Task title (min 3 characters)"
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
                    <span className={`text-xs ${formData.description.length > 450 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.description.length}/500
                    </span>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                    }}
                    maxLength={500}
                    className={`input min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="input"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
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
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, dueDate: e.target.value }))
                      setErrors(prev => ({ ...prev, dueDate: null }))
                    }}
                    min={getTodayDateString()}
                    className={`input ${errors.dueDate ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.dueDate && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.dueDate}
                    </p>
                  )}
                  <p className="text-xs text-dark-400 mt-1">Cannot select a past date</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); setErrors({}) }} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingTask ? 'Update Task' : 'Add Task'}
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

export default Tasks

