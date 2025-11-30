import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { activitiesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Activity,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  FileText,
  Target,
  UserPlus,
  Trophy,
  XCircle,
  Loader2
} from 'lucide-react'

const Activities = () => {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchActivities()
  }, [pagination.page, typeFilter])

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        type: typeFilter
      })
      if (response.data.success) {
        setActivities(response.data.data.activities)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch activities')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    const icons = {
      CALL: Phone,
      EMAIL: Mail,
      MEETING: Calendar,
      TASK_COMPLETED: CheckCircle,
      NOTE_ADDED: FileText,
      LEAD_CREATED: Target,
      LEAD_STATUS_CHANGED: Activity,
      CUSTOMER_CREATED: UserPlus,
      DEAL_WON: Trophy,
      DEAL_LOST: XCircle,
      OTHER: Activity
    }
    return icons[type] || Activity
  }

  const getActivityColor = (type) => {
    const colors = {
      CALL: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500',
      EMAIL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-500',
      MEETING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-500',
      TASK_COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-500',
      NOTE_ADDED: 'bg-gray-100 dark:bg-gray-900/30 text-gray-500',
      LEAD_CREATED: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500',
      LEAD_STATUS_CHANGED: 'bg-pink-100 dark:bg-pink-900/30 text-pink-500',
      CUSTOMER_CREATED: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500',
      DEAL_WON: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500',
      DEAL_LOST: 'bg-red-100 dark:bg-red-900/30 text-red-500',
      OTHER: 'bg-gray-100 dark:bg-gray-900/30 text-gray-500'
    }
    return colors[type] || colors.OTHER
  }

  const formatActivityType = (type) => {
    return type.replace(/_/g, ' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Activity Feed</h1>
          <p className="text-dark-500">Track all activities across your CRM</p>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">All Activities</option>
          <option value="CALL">Calls</option>
          <option value="EMAIL">Emails</option>
          <option value="MEETING">Meetings</option>
          <option value="TASK_COMPLETED">Tasks Completed</option>
          <option value="NOTE_ADDED">Notes Added</option>
          <option value="LEAD_CREATED">Leads Created</option>
          <option value="CUSTOMER_CREATED">Customers Created</option>
          <option value="DEAL_WON">Deals Won</option>
          <option value="DEAL_LOST">Deals Lost</option>
        </select>
      </div>

      {/* Activities Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-6">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index !== activities.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-dark-200 dark:bg-dark-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-800">
                        {formatActivityType(activity.type)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-dark-500 mb-2">{activity.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-dark-500">
                      <span>{activity.createdBy?.name}</span>
                      <span>•</span>
                      <span>{new Date(activity.createdAt).toLocaleString()}</span>
                      {activity.customer && (
                        <>
                          <span>•</span>
                          <span>Customer: {activity.customer.name}</span>
                        </>
                      )}
                      {activity.lead && (
                        <>
                          <span>•</span>
                          <span>Lead: {activity.lead.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
            <p className="text-dark-500">Activities will appear here as you use the CRM</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-dark-200 dark:border-dark-800 mt-6">
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
    </div>
  )
}

export default Activities

