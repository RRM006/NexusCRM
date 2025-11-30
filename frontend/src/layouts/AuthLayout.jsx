import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, Sparkles } from 'lucide-react'

const AuthLayout = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-600 to-primary-800" />
        
        {/* Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-accent-500/20 blur-3xl"
          />
          <motion.div
            animate={{
              y: [-20, 20, -20],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-primary-400/20 blur-2xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">NexusCRM</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              Transform Your
              <br />
              <span className="text-primary-200">Customer Relationships</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md leading-relaxed">
              The modern CRM platform that helps teams manage leads, customers, 
              and close deals faster than ever before.
            </p>
          </motion.div>

          {/* Features */}
          <div className="mt-12 space-y-4">
            {[
              'Multi-tenant architecture',
              'Role-based access control',
              'Real-time collaboration'
            ].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-primary-300" />
                <span className="text-white/90">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">NexusCRM</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="ml-auto p-2.5 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-primary-500" />
            )}
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-dark-500">
          © {new Date().getFullYear()} NexusCRM. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

