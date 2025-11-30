import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { customersAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  Users,
  Search,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react'

const Customers = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, searchQuery])

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery
      })
      if (response.data.success) {
        setCustomers(response.data.data.customers)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this customer from your company?')) return
    try {
      await customersAPI.delete(id)
      toast.success('Customer removed successfully')
      fetchCustomers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove customer')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Customers</h1>
          <p className="text-dark-500">Users who have joined your company as customers</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Customers are users who have joined your company. They can create support issues and view their assigned tasks.
            New customers can join by searching for your company and clicking "Join".
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or email..."
            className="input pl-12"
          />
        </div>
      </div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length > 0 ? (
          <>
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm">
                            {customer.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.bio && (
                              <p className="text-xs text-dark-500 line-clamp-1">{customer.bio}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${customer.email}`} className="text-dark-500 hover:text-primary-500 flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </a>
                      </td>
                      <td>
                        {customer.phone ? (
                          <a href={`tel:${customer.phone}`} className="text-dark-500 hover:text-primary-500 flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-dark-400">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-dark-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(customer.joinedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                            title="View"
                          >
                            <Eye className="w-4 h-4 text-dark-400" />
                          </button>
                          <button
                            onClick={() => handleRemoveCustomer(customer.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Remove from company"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-dark-200 dark:border-dark-800">
                <p className="text-sm text-dark-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} customers
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-dark-500 max-w-md mx-auto">
              Customers will appear here when users join your company. 
              Share your company name so users can search and join.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Customers
