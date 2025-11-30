import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const CompanyContext = createContext()

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    // Return safe defaults instead of throwing
    return {
      currentCompany: null,
      currentRole: null,
      companies: [],
      isLoading: false,
      switchCompany: () => {},
      createCompany: async () => ({ success: false }),
      joinCompany: async () => ({ success: false }),
      searchCompanies: async () => [],
      leaveCompany: async () => ({ success: false }),
    }
  }
  return context
}

export const CompanyProvider = ({ children }) => {
  const { user, companies, setCompanies, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [currentCompany, setCurrentCompany] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    if (isAuthenticated && companies.length > 0) {
      const savedCompanyId = localStorage.getItem('currentCompanyId')
      const savedRole = localStorage.getItem('currentRole')
      
      if (savedCompanyId && savedRole) {
        const company = companies.find(c => c.id === savedCompanyId)
        if (company && company.role === savedRole) {
          setCurrentCompany(company)
          setCurrentRole(savedRole)
        }
      }
    } else if (!isAuthenticated) {
      setCurrentCompany(null)
      setCurrentRole(null)
    }
  }, [isAuthenticated, companies])

  // Switch company/role
  const switchCompany = useCallback((companyId, role) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompany(company)
      setCurrentRole(role || company.role)
      localStorage.setItem('currentCompanyId', companyId)
      localStorage.setItem('currentRole', role || company.role)
      
      // Navigate to appropriate dashboard
      switch (role || company.role) {
        case 'ADMIN':
          navigate('/dashboard/admin')
          break
        case 'STAFF':
          navigate('/dashboard/staff')
          break
        case 'CUSTOMER':
          navigate('/dashboard/customer')
          break
        default:
          navigate('/dashboard/admin')
      }
      
      toast.success(`Switched to ${company.name}`)
    }
  }, [companies, navigate])

  // Create new company
  const createCompany = async (companyData) => {
    setIsLoading(true)
    try {
      const response = await api.post('/companies', companyData)
      if (response.data.success) {
        const newCompany = {
          ...response.data.data.company,
          role: response.data.data.role
        }
        
        setCompanies(prev => [...prev, newCompany])
        setCurrentCompany(newCompany)
        setCurrentRole('ADMIN')
        localStorage.setItem('currentCompanyId', newCompany.id)
        localStorage.setItem('currentRole', 'ADMIN')
        
        toast.success('Company created successfully!')
        navigate('/dashboard/admin')
        return { success: true, company: newCompany }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create company'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  // Join company as customer
  const joinCompany = async (companyId) => {
    setIsLoading(true)
    try {
      const response = await api.post('/companies/join', { companyId })
      if (response.data.success) {
        const joinedCompany = {
          ...response.data.data.company,
          role: response.data.data.role
        }
        
        setCompanies(prev => [...prev, joinedCompany])
        setCurrentCompany(joinedCompany)
        setCurrentRole('CUSTOMER')
        localStorage.setItem('currentCompanyId', joinedCompany.id)
        localStorage.setItem('currentRole', 'CUSTOMER')
        
        toast.success('Joined company successfully!')
        navigate('/dashboard/customer')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join company'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }

  // Search companies
  const searchCompanies = async (query) => {
    try {
      const response = await api.get(`/companies/search?q=${encodeURIComponent(query)}`)
      if (response.data.success) {
        return response.data.data.companies
      }
      return []
    } catch (error) {
      console.error('Search companies error:', error)
      return []
    }
  }

  // Leave company
  const leaveCompany = async (companyId) => {
    try {
      const response = await api.delete(`/user-company-roles/leave/${companyId}`)
      if (response.data.success) {
        setCompanies(prev => prev.filter(c => c.id !== companyId))
        
        if (currentCompany?.id === companyId) {
          setCurrentCompany(null)
          setCurrentRole(null)
          localStorage.removeItem('currentCompanyId')
          localStorage.removeItem('currentRole')
          navigate('/select-role')
        }
        
        toast.success('Left company successfully')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to leave company'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    currentCompany,
    currentRole,
    companies,
    isLoading,
    switchCompany,
    createCompany,
    joinCompany,
    searchCompanies,
    leaveCompany
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

