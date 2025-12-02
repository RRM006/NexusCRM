import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCompany } from '../../context/CompanyContext'
import { dashboardAPI } from '../../services/api'
import { CallSupportButton } from '../../components/calling'
import { ChatButton, ChatBox } from '../../components/chat'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  CheckSquare,
  Activity,
  ExternalLink,
  Clock,
  AlertCircle,
  Plus,
  Headphones,
  MessageCircle
} from 'lucide-react'

const CustomerDashboard = () => {
  const { user } = useAuth()
  const { currentCompany } = useCompany()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getCustomerDashboard()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const company = dashboardData?.company
  const supportStaff = dashboardData?.supportStaff || []
  // Get first admin/staff to message, fallback to company owner
  const primaryContact = supportStaff[0] || (company?.ownerId ? { id: company.ownerId, name: company.ownerName || company.name } : null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl lg:text-3xl font-bold"
          >
            Welcome, {user?.name}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 mt-1"
          >
            Here's your customer portal for {currentCompany?.name}.
          </motion.p>
        </div>

        {/* Call / Chat Support Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            {primaryContact && (
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-primary-500/40 transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Chat Support</span>
              </button>
            )}
            <CallSupportButton />
          </div>
        </motion.div>
      </div>

      {/* Chat Box Modal */}
      {primaryContact && (
        <ChatBox
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          targetUserId={primaryContact.id}
          targetUserName={primaryContact.name}
        />
      )}

      {/* Call Support Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700"
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Need Help?</h3>
              <p className="text-slate-400">Connect with our support team instantly via voice call</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Free voice calls</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>No phone required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Direct browser calling</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Company Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card overflow-hidden"
      >
        {/* Company Header */}
        <div className="relative h-32 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-800 border-4 border-white dark:border-dark-800 flex items-center justify-center shadow-lg">
              {company?.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <Building2 className="w-12 h-12 text-primary-500" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{company?.name}</h2>
              <span className="badge badge-success mt-1">Customer</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-200 dark:border-dark-800">
            {company?.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-dark-500 hover:text-primary-500 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {company?.email && (
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-3 text-dark-500 hover:text-primary-500 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span className="truncate">{company.email}</span>
              </a>
            )}
            {company?.phone && (
              <a
                href={`tel:${company.phone}`}
                className="flex items-center gap-3 text-dark-500 hover:text-primary-500 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span>{company.phone}</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Support Team - Message any admin/staff */}
      {supportStaff.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">💬 Contact Support Team</h2>
          <p className="text-sm text-dark-500 mb-4">Click on any team member to start a chat</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="avatar avatar-md">
                  {staff.avatar ? (
                    <img src={staff.avatar} alt={staff.name} className="rounded-full" />
                  ) : (
                    staff.name?.charAt(0) || 'S'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{staff.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    staff.role === 'ADMIN' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {staff.role}
                  </span>
                </div>
                <ChatButton
                  targetUserId={staff.id}
                  targetUserName={staff.name}
                  label={`Message ${staff.name}`}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-primary-500 hover:text-primary-600">
              View all
            </Link>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {dashboardData?.myTasks?.length > 0 ? (
              dashboardData.myTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getPriorityColor(task.priority)}`}>
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-dark-500 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-dark-500">
                          <Clock className="w-3 h-3" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks assigned to you</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link to="/activities" className="text-sm text-primary-500 hover:text-primary-600">
              View all
            </Link>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {dashboardData?.recentActivities?.length > 0 ? (
              dashboardData.recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm">{activity.title}</p>
                    <p className="text-xs text-dark-500">
                      {activity.createdBy?.name} • {new Date(activity.createdAt).toLocaleDateString()}
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
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/issues"
            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="font-medium">Create Issue</span>
          </Link>
          <Link
            to="/issues"
            className="flex items-center gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <span className="font-medium">My Issues</span>
          </Link>
          <Link
            to="/tasks"
            className="flex items-center gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <CheckSquare className="w-6 h-6 text-primary-500" />
            <span className="font-medium">My Tasks</span>
          </Link>
          <Link
            to="/activities"
            className="flex items-center gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Activity className="w-6 h-6 text-green-500" />
            <span className="font-medium">Activity Feed</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default CustomerDashboard
