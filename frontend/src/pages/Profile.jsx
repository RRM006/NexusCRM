import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  User,
  Mail,
  Phone,
  FileText,
  Loader2,
  Camera
} from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z.string()
    .max(20, 'Phone must be less than 20 characters')
    .optional(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
})

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    }
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await updateProfile(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Profile</h1>
        <p className="text-dark-500">Manage your personal information</p>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-3xl font-bold">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-dark-500">{user?.email}</p>
            <p className="text-xs text-dark-500 mt-1">
              Member since {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                {...register('name')}
                maxLength={100}
                className={`input pl-12 ${errors.name ? 'input-error' : ''}`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input pl-12 bg-dark-50 dark:bg-dark-800 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 000-0000"
                maxLength={20}
                className={`input pl-12 ${errors.phone ? 'input-error' : ''}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="label">Bio</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-dark-400" />
              <textarea
                {...register('bio')}
                placeholder="Tell us about yourself..."
                maxLength={500}
                className={`input pl-12 min-h-[120px] ${errors.bio ? 'input-error' : ''}`}
              />
            </div>
            {errors.bio && (
              <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </motion.div>

      {/* Account Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Account Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
            <p className="text-sm text-dark-500">Account ID</p>
            <p className="font-mono text-sm mt-1">{user?.id?.slice(0, 8)}...</p>
          </div>
          <div className="p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
            <p className="text-sm text-dark-500">Email Verified</p>
            <p className="font-medium mt-1">
              {user?.isEmailVerified ? (
                <span className="text-green-500">Verified</span>
              ) : (
                <span className="text-amber-500">Pending</span>
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Profile

