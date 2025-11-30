import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useCompany } from './context/CompanyContext'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import DashboardLayout from './layouts/DashboardLayout'

// Auth Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import RoleSelection from './pages/auth/RoleSelection'

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard'
import StaffDashboard from './pages/dashboard/StaffDashboard'
import CustomerDashboard from './pages/dashboard/CustomerDashboard'

// CRM Pages
import Customers from './pages/crm/Customers'
import CustomerDetail from './pages/crm/CustomerDetail'
import Leads from './pages/crm/Leads'
import LeadDetail from './pages/crm/LeadDetail'
import Contacts from './pages/crm/Contacts'
import Tasks from './pages/crm/Tasks'
import Notes from './pages/crm/Notes'
import Activities from './pages/crm/Activities'
import Issues from './pages/crm/Issues'
import Pipeline from './pages/crm/Pipeline'
import Email from './pages/email/Email'

// Settings
import Settings from './pages/Settings'
import Profile from './pages/Profile'

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-dark-400 font-medium">Loading...</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth()
  const { currentCompany, currentRole } = useCompany()

  if (isLoading) return <LoadingScreen />
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!currentCompany) {
    return <Navigate to="/select-role" replace />
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    // Redirect to appropriate dashboard based on role
    switch (currentRole) {
      case 'ADMIN':
        return <Navigate to="/dashboard/admin" replace />
      case 'STAFF':
        return <Navigate to="/dashboard/staff" replace />
      case 'CUSTOMER':
        return <Navigate to="/dashboard/customer" replace />
      default:
        return <Navigate to="/select-role" replace />
    }
  }

  return children
}

// Public Route Component
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth()
  const { currentCompany, currentRole } = useCompany()

  if (isLoading) return <LoadingScreen />

  if (user && currentCompany) {
    switch (currentRole) {
      case 'ADMIN':
        return <Navigate to="/dashboard/admin" replace />
      case 'STAFF':
        return <Navigate to="/dashboard/staff" replace />
      case 'CUSTOMER':
        return <Navigate to="/dashboard/customer" replace />
      default:
        return <Navigate to="/select-role" replace />
    }
  }

  return children
}

function App() {
  const { isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      </Route>

      {/* Role Selection */}
      <Route path="/select-role" element={<RoleSelection />} />

      {/* Dashboard Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {/* Dashboards */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/staff" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <StaffDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/customer" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'CUSTOMER']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />

        {/* CRM Routes */}
        <Route path="/customers" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Customers />
          </ProtectedRoute>
        } />
        <Route path="/customers/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CustomerDetail />
          </ProtectedRoute>
        } />
        <Route path="/leads" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <Leads />
          </ProtectedRoute>
        } />
        <Route path="/leads/:id" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <LeadDetail />
          </ProtectedRoute>
        } />
        <Route path="/contacts" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <Contacts />
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/pipeline" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <Pipeline />
          </ProtectedRoute>
        } />
        <Route path="/email" element={<Email />} />
        
        {/* Customer-specific route redirect */}

        {/* Settings & Profile */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch all - 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

