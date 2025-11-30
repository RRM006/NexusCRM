import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [companies, setCompanies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'))
  const navigate = useNavigate()

  // Initialize auth state
  const initAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.data.user)
        setCompanies(response.data.data.companies || [])
      }
    } catch (error) {
      console.error('Auth init error:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setAccessToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    initAuth()
  }, [initAuth])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      if (response.data.success) {
        const { user, companies, accessToken, refreshToken } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setAccessToken(accessToken)
        setUser(user)
        setCompanies(companies || [])

        toast.success('Welcome back!')
        
        if (companies && companies.length > 0) {
          // Has companies, redirect to role selection
          navigate('/select-role')
        } else {
          // No companies, redirect to role selection to create/join
          navigate('/select-role')
        }

        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const signup = async (name, email, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/signup', { 
        name, 
        email, 
        password, 
        confirmPassword 
      })
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setAccessToken(accessToken)
        setUser(user)
        setCompanies([])

        toast.success('Account created successfully!')
        navigate('/select-role')

        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed'
      const errors = error.response?.data?.errors || []
      toast.error(message)
      return { success: false, error: message, errors }
    }
  }

  const googleSignIn = async (credential) => {
    try {
      const response = await api.post('/auth/google', { credential })
      
      if (response.data.success) {
        const { user, companies, accessToken, refreshToken, isNewUser, accountLinked } = response.data.data
        
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        setAccessToken(accessToken)
        setUser(user)
        setCompanies(companies || [])

        if (isNewUser) {
          toast.success('Account created with Google!')
        } else if (accountLinked) {
          toast.success('Google account linked successfully!')
        } else {
          toast.success('Welcome back!')
        }
        
        navigate('/select-role')
        return { success: true, isNewUser }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Google sign-in failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await api.post('/auth/logout', { refreshToken })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('currentCompanyId')
      localStorage.removeItem('currentRole')
      setAccessToken(null)
      setUser(null)
      setCompanies([])
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      if (response.data.success) {
        setUser(response.data.data.user)
        setCompanies(response.data.data.companies || [])
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/profile', data)
      if (response.data.success) {
        setUser(response.data.data.user)
        toast.success('Profile updated successfully')
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      })
      if (response.data.success) {
        toast.success('Password changed successfully. Please log in again.')
        await logout()
        return { success: true }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    user,
    companies,
    isLoading,
    isAuthenticated: !!user,
    accessToken,
    login,
    signup,
    googleSignIn,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
    setCompanies
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

