import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { leadsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Target,
  DollarSign,
  Calendar,
  User,
  CheckSquare,
  FileText,
  Activity,
  Pencil,
  Trash2
} from 'lucide-react'

const LeadDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLead()
  }, [id])

  const fetchLead = async () => {
    try {
      const response = await leadsAPI.getOne(id)
      if (response.data.success) {
        setLead(response.data.data.lead)
      }
    } catch (error) {
      toast.error('Failed to fetch lead')
      navigate('/leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return
    try {
      await leadsAPI.delete(id)
      toast.success('Lead deleted successfully')
      navigate('/leads')
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center gap-2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Leads
      </button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-2xl">
            {lead.title.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{lead.title}</h1>
              <span className={`badge ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            {lead.description && (
              <p className="text-dark-500 mb-4">{lead.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-dark-500">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ${lead.value?.toLocaleString() || 0}
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {lead.source}
              </div>
              {lead.expectedCloseDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected: {new Date(lead.expectedCloseDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary">
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-200 dark:border-dark-800">
          {lead.customer && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Customer</p>
                <p className="font-medium">{lead.customer.name}</p>
              </div>
            </div>
          )}
          {lead.assignedTo && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Assigned To</p>
                <p className="font-medium">{lead.assignedTo.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Priority</p>
              <p className="font-medium">{lead.priority}/5</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Created</p>
              <p className="font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              Tasks ({lead.tasks?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {lead.tasks?.length > 0 ? (
              lead.tasks.map((task) => (
                <div key={task.id} className="p-4">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-dark-500">
                    Status: {task.status} • Priority: {task.priority}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                No tasks for this lead
              </div>
            )}
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Notes ({lead.notes?.length || 0})
            </h2>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {lead.notes?.length > 0 ? (
              lead.notes.map((note) => (
                <div key={note.id} className="p-4">
                  <p className="text-dark-700 dark:text-dark-300">{note.content}</p>
                  <p className="text-xs text-dark-500 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                No notes for this lead
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <div className="p-6 border-b border-dark-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Activity Timeline
          </h2>
        </div>
        <div className="p-6">
          {lead.activities?.length > 0 ? (
            <div className="space-y-6">
              {lead.activities.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary-500" />
                    </div>
                    {index !== lead.activities.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-dark-200 dark:bg-dark-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-dark-500">
                      {activity.createdBy?.name} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-dark-500 py-8">
              No activity recorded
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default LeadDetail

