import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCompany } from '../../context/CompanyContext'
import { useTheme } from '../../context/ThemeContext'
import {
  Building2,
  Users,
  Plus,
  Search,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Loader2,
  CheckCircle
} from 'lucide-react'

const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().optional(),
  size: z.string().optional()
})

const RoleSelection = () => {
  const { user, logout, companies } = useAuth()
  const { switchCompany, createCompany, searchCompanies, joinCompany } = useCompany()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [mode, setMode] = useState(companies.length > 0 ? 'select' : 'choose') // 'choose', 'create', 'join', 'select'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createCompanySchema)
  })

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchCompanies(query)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCreateCompany = async (data) => {
    setIsLoading(true)
    try {
      await createCompany(data)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinCompany = async (companyId) => {
    setIsLoading(true)
    try {
      await joinCompany(companyId)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCompany = (company) => {
    switchCompany(company.id, company.role)
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">NexusCRM</span>
            </div>

            <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-3">
                <div className="avatar avatar-md">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Select Existing Company */}
            {mode === 'select' && companies.length > 0 && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Select Workspace</h1>
                  <p className="text-dark-500">Choose a company to continue</p>
                </div>

                <div className="card p-2 space-y-2 mb-6">
                  {companies.map((company) => (
                    <button
                      key={`${company.id}-${company.role}`}
                      onClick={() => handleSelectCompany(company)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{company.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(company.role)}`}>
                          {company.role}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-dark-400" />
                    </button>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setMode('create')}
                    className="btn btn-primary"
                  >
                    <Plus className="w-5 h-5" />
                    Create Company
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className="btn btn-secondary"
                  >
                    <Users className="w-5 h-5" />
                    Join Company
                  </button>
                </div>
              </motion.div>
            )}

            {/* Choose Mode */}
            {mode === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
                  <p className="text-dark-500">How would you like to get started?</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setMode('create')}
                    className="card p-6 text-left hover:shadow-lg hover:border-primary-500 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Create Company</h3>
                    <p className="text-dark-500 text-sm">
                      Start your own company and become the admin
                    </p>
                  </button>

                  <button
                    onClick={() => setMode('join')}
                    className="card p-6 text-left hover:shadow-lg hover:border-primary-500 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Join as Customer</h3>
                    <p className="text-dark-500 text-sm">
                      Join an existing company as a customer
                    </p>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Create Company */}
            {mode === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button
                  onClick={() => setMode(companies.length > 0 ? 'select' : 'choose')}
                  className="text-sm text-dark-500 hover:text-dark-700 dark:hover:text-dark-300 mb-6 flex items-center gap-2"
                >
                  ← Back
                </button>

                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Create Your Company</h1>
                  <p className="text-dark-500">Set up your workspace and become an admin</p>
                </div>

                <form onSubmit={handleSubmit(handleCreateCompany)} className="card p-6 space-y-5">
                  <div>
                    <label className="label">Company Name *</label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Enter company name"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Industry</label>
                    <select {...register('industry')} className="input">
                      <option value="">Select industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Services">Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Company Size</label>
                    <select {...register('size')} className="input">
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Company
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Join Company */}
            {mode === 'join' && (
              <motion.div
                key="join"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button
                  onClick={() => setMode(companies.length > 0 ? 'select' : 'choose')}
                  className="text-sm text-dark-500 hover:text-dark-700 dark:hover:text-dark-300 mb-6 flex items-center gap-2"
                >
                  ← Back
                </button>

                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Join a Company</h1>
                  <p className="text-dark-500">Search and join an existing company as a customer</p>
                </div>

                <div className="card p-6">
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search companies..."
                      className="input pl-12"
                    />
                  </div>

                  {isSearching && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  )}

                  {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                            {company.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{company.name}</p>
                            {company.industry && (
                              <p className="text-sm text-dark-500">{company.industry}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleJoinCompany(company.id)}
                            disabled={isLoading}
                            className="btn btn-primary btn-sm"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Join'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="text-center py-8 text-dark-500">
                      No companies found matching "{searchQuery}"
                    </div>
                  )}

                  {!isSearching && searchQuery.length < 2 && (
                    <div className="text-center py-8 text-dark-500">
                      Enter at least 2 characters to search
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default RoleSelection

