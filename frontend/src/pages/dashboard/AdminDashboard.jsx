import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCompany } from '../../context/CompanyContext'
import { useCall } from '../../context/CallContext'
import { dashboardAPI } from '../../services/api'
import {
  Users,
  Target,
  CheckSquare,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  MoreHorizontal,
  AlertCircle,
  Phone,
  PhoneIncoming,
  Wifi,
  WifiOff,
  Headphones
} from 'lucide-react'

const StatCard = ({ title, value, change, changeType, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${
        changeType === 'up' ? 'text-green-500' : 'text-red-500'
      }`}>
        {changeType === 'up' ? (
          <ArrowUpRight className="w-4 h-4" />
        ) : (
          <ArrowDownRight className="w-4 h-4" />
        )}
        {change}%
      </div>
    </div>
    <h3 className="text-3xl font-bold mb-1">{value}</h3>
    <p className="text-dark-500 text-sm">{title}</p>
  </motion.div>
)

const AdminDashboard = () => {
  const { currentCompany } = useCompany()
  const { isSocketConnected, incomingCall, callStatus } = useCall()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getAdminStats()
        if (response.data.success) {
          setStats(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.stats?.customers || 0,
      change: 12.5,
      changeType: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Leads',
      value: stats?.stats?.leads || 0,
      change: 8.2,
      changeType: 'up',
      icon: Target,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Open Issues',
      value: stats?.stats?.openIssues || 0,
      change: 5.2,
      changeType: 'up',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Revenue',
      value: `$${((stats?.stats?.wonDealsValue || 0) / 1000).toFixed(1)}k`,
      change: 15.3,
      changeType: 'up',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    }
  ]

  const getStatusColor = (status) => {
    const colors = {
      NEW: 'badge-info',
      CONTACTED: 'badge-primary',
      QUALIFIED: 'badge-warning',
      PROPOSAL: 'badge-warning',
      NEGOTIATION: 'badge-primary',
      WON: 'badge-success',
      LOST: 'badge-danger',
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-danger',
      PENDING: 'badge-warning'
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl lg:text-3xl font-bold"
          >
            Welcome back! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 mt-1"
          >
            Here's what's happening with {currentCompany?.name} today.
          </motion.p>
        </div>

        {/* Call Center Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            isSocketConnected 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isSocketConnected 
                ? 'bg-emerald-100 dark:bg-emerald-900/40' 
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {isSocketConnected ? (
                <Headphones className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <p className={`font-medium text-sm ${
                isSocketConnected 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}>
                {isSocketConnected ? 'Call Center Active' : 'Connecting...'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSocketConnected ? 'Ready to receive calls' : 'Establishing connection'}
              </p>
            </div>
            {isSocketConnected && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-emerald-500 ml-2"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <StatCard key={stat.title} {...stat} delay={0.1 + i * 0.1} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg font-semibold">Recent Leads</h2>
            <Link to="/leads" className="text-sm text-primary-500 hover:text-primary-600">
              View all
            </Link>
          </div>
          <div className="divide-y divide-dark-100 dark:divide-dark-800">
            {stats?.recent?.leads?.length > 0 ? (
              stats.recent.leads.map((lead) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                    {lead.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{lead.title}</p>
                    <p className="text-sm text-dark-500">
                      ${lead.value?.toLocaleString() || 0}
                    </p>
                  </div>
                  <span className={`badge ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-dark-500">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No leads yet</p>
                <Link to="/leads" className="text-primary-500 text-sm">
                  Create your first lead
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activities */}
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
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {stats?.recent?.activities?.length > 0 ? (
              stats.recent.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm">{activity.title}</p>
                    <p className="text-xs text-dark-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
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

      {/* Recent Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold">Recent Issues</h2>
          <Link to="/issues" className="text-sm text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>
        <div className="divide-y divide-dark-100 dark:divide-dark-800">
          {stats?.recent?.issues?.length > 0 ? (
            stats.recent.issues.map((issue) => (
              <Link
                key={issue.id}
                to="/issues"
                className="flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
              >
                <AlertCircle className={`w-5 h-5 ${
                  issue.status === 'OPEN' ? 'text-blue-500' :
                  issue.status === 'IN_PROGRESS' ? 'text-amber-500' :
                  issue.status === 'RESOLVED' ? 'text-green-500' : 'text-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{issue.title}</p>
                  <p className="text-sm text-dark-500">
                    {issue.customer?.name} • {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`badge ${
                  issue.status === 'OPEN' ? 'badge-info' :
                  issue.status === 'IN_PROGRESS' ? 'badge-warning' :
                  issue.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'
                }`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-dark-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No issues yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold">Recent Customers</h2>
          <Link to="/customers" className="text-sm text-primary-500 hover:text-primary-600">
            View all
          </Link>
        </div>
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent?.customers?.length > 0 ? (
                stats.recent.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-sm">
                          {customer.name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="text-dark-500">{customer.email}</td>
                    <td className="text-dark-500">
                      {new Date(customer.joinedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link
                        to={`/customers/${customer.id}`}
                        className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg inline-block"
                      >
                        <MoreHorizontal className="w-5 h-5 text-dark-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-dark-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No customers yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard
