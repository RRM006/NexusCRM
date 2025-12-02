import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useCompany } from '../context/CompanyContext'
import { useTheme } from '../context/ThemeContext'
import NotificationBell from '../components/NotificationBell'
import { AIChatbot } from '../components/ai'
import { FloatingChatButton } from '../components/chat'
import {
  LayoutDashboard,
  Users,
  Target,
  UserCircle,
  CheckSquare,
  FileText,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  Sparkles,
  Search,
  AlertCircle,
  Mail,
  Bot,
  Kanban
} from 'lucide-react'

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const { currentCompany, currentRole, companies, switchCompany } = useCompany()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: `/dashboard/${currentRole?.toLowerCase() || 'admin'}` },
    { name: 'Pipeline', icon: Kanban, href: '/pipeline', roles: ['ADMIN', 'STAFF'] },
    { name: 'Email', icon: Mail, href: '/email' },
    { name: 'Customers', icon: Users, href: '/customers', roles: ['ADMIN'] },
    { name: 'Leads', icon: Target, href: '/leads', roles: ['ADMIN', 'STAFF'] },
    { name: 'Contacts', icon: UserCircle, href: '/contacts', roles: ['ADMIN', 'STAFF'] },
    { name: 'Issues', icon: AlertCircle, href: '/issues' },
    { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Notes', icon: FileText, href: '/notes' },
    { name: 'Activities', icon: Activity, href: '/activities' },
  ]

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(currentRole)
  )

  const handleLogout = async () => {
    await logout()
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      case 'STAFF': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'CUSTOMER': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-dark-900 border-r border-dark-200 dark:border-dark-800 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-200 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">NexusCRM</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Company Switcher */}
          <div className="p-4 border-b border-dark-200 dark:border-dark-800">
            <div className="relative">
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                  {currentCompany?.name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold truncate">{currentCompany?.name || 'Select Company'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(currentRole)}`}>
                    {currentRole || 'No Role'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${companyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {companyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 z-50 max-h-64 overflow-auto"
                  >
                    {companies.map((company) => (
                      <button
                        key={`${company.id}-${company.role}`}
                        onClick={() => {
                          switchCompany(company.id, company.role)
                          setCompanyDropdownOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors ${
                          currentCompany?.id === company.id && currentRole === company.role
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-sm font-semibold">
                          {company.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{company.name}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(company.role)}`}>
                            {company.role}
                          </span>
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-dark-200 dark:border-dark-700 mt-2 pt-2 px-4">
                      <button
                        onClick={() => {
                          setCompanyDropdownOpen(false)
                          navigate('/select-role')
                        }}
                        className="w-full flex items-center gap-2 py-2 text-sm text-primary-500 hover:text-primary-600"
                      >
                        <Building2 className="w-4 h-4" />
                        Manage Companies
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-dark-200 dark:border-dark-800 space-y-2">
            {/* AI Assistant Button */}
            <button
              onClick={() => {
                setAiChatOpen(true)
                setSidebarOpen(false)
              }}
              className="sidebar-link w-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 border border-violet-500/20"
            >
              <Bot className="w-5 h-5 text-violet-500" />
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent font-medium">
                AI Assistant
              </span>
              <Sparkles className="w-4 h-4 text-violet-500 ml-auto" />
            </button>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Settings className="w-5 h-5" />
              Settings
            </NavLink>
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-800">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            {/* Left: Mobile menu & Search */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-dark-100 dark:bg-dark-800 rounded-xl">
                <Search className="w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-48 lg:w-64"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-primary-500" />
                )}
              </button>

              <NotificationBell />

              {/* User Menu */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <div className="avatar avatar-md">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="rounded-full" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-dark-500">{user?.email}</p>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-56 py-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 z-50"
                    >
                      <div className="px-4 py-3 border-b border-dark-200 dark:border-dark-700">
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-sm text-dark-500">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            navigate('/profile')
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-50 dark:hover:bg-dark-700"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            navigate('/settings')
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-dark-50 dark:hover:bg-dark-700"
                        >
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-dark-200 dark:border-dark-700 pt-2">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false)
                            handleLogout()
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot */}
      <AIChatbot isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} />

      {/* Floating Chat Button - shows all conversations */}
      <FloatingChatButton />
    </div>
  )
}

export default DashboardLayout

