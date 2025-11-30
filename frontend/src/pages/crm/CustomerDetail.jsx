import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { customersAPI, issuesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Trash2,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [id])

  const fetchCustomer = async () => {
    try {
      const response = await customersAPI.getOne(id)
      if (response.data.success) {
        setCustomer(response.data.data.customer)
      }
    } catch (error) {
      toast.error('Failed to fetch customer')
      navigate('/customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this customer from your company?')) return
    try {
      await customersAPI.delete(id)
      toast.success('Customer removed successfully')
      navigate('/customers')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove customer')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      OPEN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
      IN_PROGRESS: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      RESOLVED: 'bg-green-100 dark:bg-green-900/30 text-green-600',
      CLOSED: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600'
    }
    return colors[status] || colors.OPEN
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CLOSED': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-amber-500" />
      default: return <AlertCircle className="w-4 h-4 text-blue-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!customer) return null

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-2 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Customers
      </button>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="relative h-32 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600" />
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-dark-800 border-4 border-white dark:border-dark-800 flex items-center justify-center text-3xl font-bold shadow-lg">
              {customer.avatar ? (
                <img src={customer.avatar} alt={customer.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                <span className="text-primary-500">{customer.name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <span className="badge badge-success">Customer</span>
              </div>
              {customer.bio && (
                <p className="text-dark-500">{customer.bio}</p>
              )}
            </div>
            <button onClick={handleRemove} className="btn btn-danger">
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-200 dark:border-dark-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Email</p>
                <a href={`mailto:${customer.email}`} className="font-medium hover:text-primary-500">
                  {customer.email}
                </a>
              </div>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-500">Phone</p>
                  <a href={`tel:${customer.phone}`} className="font-medium hover:text-primary-500">
                    {customer.phone}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Joined</p>
                <p className="font-medium">{new Date(customer.joinedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customer Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary-500" />
            Issues ({customer.issues?.length || 0})
          </h2>
          <Link to="/issues" className="text-sm text-primary-500 hover:text-primary-600">
            View All Issues
          </Link>
        </div>
        <div className="divide-y divide-dark-100 dark:divide-dark-800">
          {customer.issues?.length > 0 ? (
            customer.issues.map((issue) => (
              <Link
                key={issue.id}
                to="/issues"
                className="flex items-center gap-4 p-4 hover:bg-dark-50 dark:hover:bg-dark-800"
              >
                {getStatusIcon(issue.status)}
                <div className="flex-1">
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-sm text-dark-500">
                    {new Date(issue.createdAt).toLocaleDateString()} • {issue._count?.calls || 0} calls
                  </p>
                </div>
                <span className={`badge text-xs ${getStatusColor(issue.status)}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-dark-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No issues from this customer</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CustomerDetail
