import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI } from '../../services/api'
import {
  CheckSquare,
  Target,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const StaffDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getStaffDashboard()
        if (response.data.success) {
          setDashboardData(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'text-red-500 bg-red-100 dark:bg-red-900/30',
      HIGH: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
      MEDIUM: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
      LOW: 'text-green-500 bg-green-100 dark:bg-green-900/30'
    }
    return colors[priority] || colors.MEDIUM
  }

  const getStatusColor = (status) => {
    const colors = {
      TODO: 'badge-info',
      IN_PROGRESS: 'badge-warning',
      COMPLETED: 'badge-success',
      CANCELLED: 'badge-danger'
    }
    return colors[status] || 'badge-info'
  }

  const getLeadStatusColor = (status) => {
    const colors = {
      NEW: 'badge-info',
      CONTACTED: 'badge-primary',
      QUALIFIED: 'badge-warning',
      PROPOSAL: 'badge-warning',
      NEGOTIATION: 'badge-primary',
      WON: 'badge-success',
      LOST: 'badge-danger'
    }
    return colors[status] || 'badge-info'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold"
        >
          Hi, {user?.name}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-dark-500 mt-1"
        >
          Here's your workload for today.
        </motion.p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardData?.stats?.myTasks || 0}</p>
              <p className="text-dark-500 text-sm">Total Tasks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardData?.stats?.openTasks || 0}</p>
              <p className="text-dark-500 text-sm">Open Tasks</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{dashboardData?.stats?.myLeads || 0}</p>
              <p className="text-dark-500 text-sm">My Leads</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {dashboardData?.myOpenTasks?.length > 0 ? (
              dashboardData.myOpenTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : task.priority === 'URGENT' || task.priority === 'HIGH' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge text-xs ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-dark-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {task.customer && (
                        <p className="text-xs text-dark-500 mt-1">
                          Customer: {task.customer.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>All caught up! No pending tasks.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* My Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold">My Leads</h2>
            <Link to="/leads" className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {dashboardData?.myLeads?.length > 0 ? (
              dashboardData.myLeads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                    {lead.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.title}</p>
                    <p className="text-sm text-dark-500">
                      ${lead.value?.toLocaleString() || 0}
                    </p>
                  </div>
                  <span className={`badge ${getLeadStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leads assigned to you</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link to="/activities" className="text-sm text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {dashboardData?.recentActivities?.length > 0 ? (
              dashboardData.recentActivities.slice(0, 8).map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary-500" />
                    </div>
                    {index !== Math.min(dashboardData.recentActivities.length - 1, 7) && (
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
              ))
            ) : (
              <div className="text-center text-dark-500 py-8">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default StaffDashboard

