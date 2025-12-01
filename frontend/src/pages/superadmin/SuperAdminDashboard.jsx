import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  Target,
  Briefcase,
  Activity,
  LogOut,
  Shield,
  Search,
  ChevronRight,
  MoreVertical,
  Power,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { superAdminAPI } from '../../services/api'

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, delay }) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/30',
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/30',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    rose: 'from-rose-500 to-rose-600 shadow-rose-500/30',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
    fuchsia: 'from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-500/30',
    sky: 'from-sky-500 to-sky-600 shadow-sky-500/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-slate-400 text-sm">{title}</p>
    </motion.div>
  )
}

// Company Row Component
const CompanyRow = ({ company, onToggleStatus, onViewDetails }) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
            {company.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-white">{company.name}</p>
            <p className="text-sm text-slate-500">{company.slug}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <p className="text-slate-300">{company.owner?.name || 'N/A'}</p>
        <p className="text-sm text-slate-500">{company.owner?.email || ''}</p>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-slate-300">{company.stats?.totalMembers || 0}</span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-slate-300">{company.stats?.totalCustomers || 0}</span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-slate-300">{company.stats?.totalLeads || 0}</span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-slate-300">{company.stats?.totalDeals || 0}</span>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-emerald-400 font-medium">
          ${(company.stats?.totalRevenue || 0).toLocaleString()}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          company.isActive 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {company.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-4 px-4">
        <p className="text-slate-400 text-sm">
          {new Date(company.createdAt).toLocaleDateString()}
        </p>
      </td>
      <td className="py-4 px-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10">
              <button
                onClick={() => {
                  onViewDetails(company.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => {
                  onToggleStatus(company.id)
                  setShowMenu(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2"
              >
                <Power className={`w-4 h-4 ${company.isActive ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className={company.isActive ? 'text-rose-400' : 'text-emerald-400'}>
                  {company.isActive ? 'Deactivate' : 'Activate'}
                </span>
              </button>
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

const SuperAdminDashboard = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
  // Issues state
  const [issues, setIssues] = useState([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesStats, setIssuesStats] = useState({ OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 })
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [updatingIssue, setUpdatingIssue] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssues()
    }
  }, [activeTab])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await superAdminAPI.getDashboard()
      if (response.data.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('superAdminToken')
        navigate('/admin')
        toast.error('Session expired. Please login again.')
      } else {
        toast.error('Failed to load dashboard data')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken')
    toast.success('Logged out successfully')
    navigate('/admin')
  }

  const fetchIssues = async () => {
    setIssuesLoading(true)
    try {
      const response = await superAdminAPI.getIssues()
      if (response.data.success) {
        setIssues(response.data.data.issues)
        setIssuesStats(response.data.data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error)
      toast.error('Failed to load issues')
    } finally {
      setIssuesLoading(false)
    }
  }

  const handleUpdateIssueStatus = async (issueId, newStatus) => {
    setUpdatingIssue(issueId)
    try {
      const response = await superAdminAPI.updateIssueStatus(issueId, newStatus)
      if (response.data.success) {
        toast.success(`Issue ${newStatus.toLowerCase()}`)
        fetchIssues()
        setSelectedIssue(null)
      }
    } catch (error) {
      console.error('Failed to update issue:', error)
      toast.error('Failed to update issue status')
    } finally {
      setUpdatingIssue(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'CLOSED': return <XCircle className="w-5 h-5 text-slate-400" />
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-amber-400" />
      default: return <AlertCircle className="w-5 h-5 text-blue-400" />
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400'
      case 'CLOSED': return 'bg-slate-500/20 text-slate-400'
      case 'IN_PROGRESS': return 'bg-amber-500/20 text-amber-400'
      default: return 'bg-blue-500/20 text-blue-400'
    }
  }

  const handleToggleCompanyStatus = async (companyId) => {
    try {
      const response = await superAdminAPI.toggleCompanyStatus(companyId)
      if (response.data.success) {
        toast.success(response.data.message)
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to update company status')
    }
  }

  const handleViewCompanyDetails = (companyId) => {
    // For now, just show a toast. Can be expanded to a modal or new page
    toast.info('Company details view coming soon!')
  }

  const filteredCompanies = stats?.companies?.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NexusCRM Admin</h1>
                <p className="text-sm text-slate-400">Platform Administration</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={fetchDashboardData}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5 text-slate-400" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Companies"
            value={stats?.overview?.totalCompanies || 0}
            icon={Building2}
            trend="up"
            trendValue={`+${stats?.overview?.newCompaniesThisMonth || 0} this month`}
            color="indigo"
            delay={0}
          />
          <StatCard
            title="Total Users"
            value={stats?.overview?.totalUsers || 0}
            icon={Users}
            trend="up"
            trendValue={`+${stats?.overview?.newUsersThisMonth || 0} this month`}
            color="violet"
            delay={0.1}
          />
          <StatCard
            title="Total Customers"
            value={stats?.overview?.totalCustomers || 0}
            icon={UserCheck}
            color="emerald"
            delay={0.2}
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.overview?.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            color="amber"
            delay={0.3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Companies"
            value={stats?.overview?.activeCompanies || 0}
            icon={Activity}
            color="cyan"
            delay={0.4}
          />
          <StatCard
            title="Total Staff"
            value={stats?.overview?.totalStaff || 0}
            icon={Briefcase}
            color="fuchsia"
            delay={0.5}
          />
          <StatCard
            title="Total Leads"
            value={stats?.overview?.totalLeads || 0}
            icon={Target}
            color="sky"
            delay={0.6}
          />
          <StatCard
            title="Total Deals"
            value={stats?.overview?.totalDeals || 0}
            icon={TrendingUp}
            color="rose"
            delay={0.7}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'companies', 'issues', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab === 'issues' && <AlertCircle className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'issues' && issuesStats.OPEN > 0 && (
                <span className="px-2 py-0.5 text-xs bg-rose-500 text-white rounded-full">
                  {issuesStats.OPEN}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Companies Table */}
        {activeTab === 'overview' || activeTab === 'companies' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Registered Companies</h2>
                  <p className="text-sm text-slate-400">Manage all companies on the platform</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Owner</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Members</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Customers</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Leads</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Deals</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Created</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <CompanyRow
                        key={company.id}
                        company={company}
                        onToggleStatus={handleToggleCompanyStatus}
                        onViewDetails={handleViewCompanyDetails}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        {searchQuery ? 'No companies found matching your search' : 'No companies registered yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : null}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Issues Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{issuesStats.OPEN}</p>
                  <p className="text-sm text-slate-400">Open</p>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4">
                <Clock className="w-8 h-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{issuesStats.IN_PROGRESS}</p>
                  <p className="text-sm text-slate-400">In Progress</p>
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{issuesStats.RESOLVED}</p>
                  <p className="text-sm text-slate-400">Resolved</p>
                </div>
              </div>
              <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4 flex items-center gap-4">
                <XCircle className="w-8 h-8 text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{issuesStats.CLOSED}</p>
                  <p className="text-sm text-slate-400">Closed</p>
                </div>
              </div>
            </div>

            {/* Issues Table */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">All Issues</h2>
                    <p className="text-sm text-slate-400">Manage issues from all companies</p>
                  </div>
                  <button
                    onClick={fetchIssues}
                    className="p-2.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${issuesLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {issuesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : issues.length > 0 ? (
                <div className="divide-y divide-slate-700/50">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {getStatusIcon(issue.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white truncate">{issue.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(issue.status)}`}>
                              {issue.status.replace('_', ' ')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400">
                              {issue.priority}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-1 mb-2">{issue.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {issue.company?.name || 'Unknown Company'}
                            </span>
                            {issue.createdBy && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {issue.createdBy.name}
                              </span>
                            )}
                            <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                            {issue.identifier && <span className="text-indigo-400">{issue.identifier}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {issue.linearUrl && (
                            <a
                              href={issue.linearUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-slate-600/50 rounded-lg transition-colors"
                              title="View in Linear"
                            >
                              <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                          )}
                          {issue.status !== 'RESOLVED' && issue.status !== 'CLOSED' && (
                            <div className="flex gap-1">
                              {issue.status === 'OPEN' && (
                                <button
                                  onClick={() => handleUpdateIssueStatus(issue.id, 'IN_PROGRESS')}
                                  disabled={updatingIssue === issue.id}
                                  className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {updatingIssue === issue.id ? 'Updating...' : 'Start'}
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateIssueStatus(issue.id, 'RESOLVED')}
                                disabled={updatingIssue === issue.id}
                                className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {updatingIssue === issue.id ? 'Updating...' : 'Resolve'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">No issues from Company Admins</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Issues created by Company Admins will appear here.<br/>
                    Customer issues are handled by their respective Company Admins.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Company Growth Chart */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Company Growth</h3>
                  <p className="text-sm text-slate-400">Last 6 months</p>
                </div>
              </div>
              <div className="space-y-4">
                {stats?.growth?.companies?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 w-16">{item.month}</span>
                    <div className="flex-1 h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.count / Math.max(...stats.growth.companies.map(c => c.count), 1)) * 100, 100)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg flex items-center justify-end pr-2"
                      >
                        <span className="text-xs font-medium text-white">{item.count}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <PieChart className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">User Growth</h3>
                  <p className="text-sm text-slate-400">Last 6 months</p>
                </div>
              </div>
              <div className="space-y-4">
                {stats?.growth?.users?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 w-16">{item.month}</span>
                    <div className="flex-1 h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.count / Math.max(...stats.growth.users.map(u => u.count), 1)) * 100, 100)}%` }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-end pr-2"
                      >
                        <span className="text-xs font-medium text-white">{item.count}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Companies */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Recently Registered</h3>
                    <p className="text-sm text-slate-400">Latest companies on the platform</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {stats?.recentCompanies?.slice(0, 5).map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{company.name}</p>
                        <p className="text-sm text-slate-400">{company.industry}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {new Date(company.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {company.stats?.totalMembers || 0} members
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default SuperAdminDashboard

