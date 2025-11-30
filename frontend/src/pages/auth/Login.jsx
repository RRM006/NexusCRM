import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import GoogleSignInButton from '../../components/GoogleSignInButton'

const loginSchema = z.object({
  email: z.string()
    .email('Please enter a valid email')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password must be less than 100 characters')
})

const Login = () => {
  const { login, googleSignIn } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsGoogleLoading(true)
    try {
      await googleSignIn(credentialResponse.credential)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('Google sign-in failed')
  }

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-dark-500">Sign in to continue to your dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter your email"
              maxLength={255}
              className={`input pl-12 ${errors.email ? 'input-error' : ''}`}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-1"
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Enter your password"
              maxLength={100}
              className={`input pl-12 pr-12 ${errors.password ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-sm mt-1"
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-dark-300 text-primary-500 focus:ring-primary-500" />
            <span className="text-sm text-dark-600 dark:text-dark-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="btn btn-primary w-full py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-200 dark:border-dark-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-dark-800 text-dark-500">Or continue with</span>
        </div>
      </div>

      {/* Google Sign-In */}
      <div className="relative">
        {isGoogleLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-dark-800/50 flex items-center justify-center rounded-lg z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        )}
        <GoogleSignInButton 
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          text="signin_with"
        />
      </div>

      <p className="text-center mt-8 text-dark-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary-500 hover:text-primary-600 font-medium">
          Create Account
        </Link>
      </p>
    </div>
  )
}

export default Login

