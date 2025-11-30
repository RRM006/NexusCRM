import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import {
  Sparkles,
  ArrowRight,
  Users,
  Target,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  Building2,
  Layers
} from 'lucide-react'

const Landing = () => {
  const { theme, toggleTheme } = useTheme()

  const features = [
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Track and manage all your customer interactions in one centralized platform.'
    },
    {
      icon: Target,
      title: 'Lead Tracking',
      description: 'Convert more leads with our intelligent pipeline management system.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Make data-driven decisions with real-time insights and reporting.'
    },
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Control who sees what with granular permission settings.'
    },
    {
      icon: Building2,
      title: 'Multi-Tenant',
      description: 'Manage multiple companies with a single account seamlessly.'
    },
    {
      icon: Layers,
      title: 'Workspace Switching',
      description: 'Switch between companies and roles with a single click.'
    }
  ]

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '500+', label: 'Companies' },
    { value: '1M+', label: 'Leads Managed' },
    { value: '99.9%', label: 'Uptime' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-950/80 backdrop-blur-xl border-b border-dark-200 dark:border-dark-800">
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
              <Link to="/login" className="text-sm font-medium hover:text-primary-500 transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Introducing NexusCRM 2.0
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                The Modern CRM for
                <br />
                <span className="gradient-text">Growing Teams</span>
              </h1>

              <p className="text-lg lg:text-xl text-dark-600 dark:text-dark-400 max-w-2xl mx-auto mb-10">
                Streamline your sales process, manage customer relationships, and grow your business 
                with our powerful multi-tenant CRM platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="btn btn-primary px-8 py-3 text-base">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn btn-secondary px-8 py-3 text-base">
                  Sign In
                </Link>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-dark-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-dark-50 dark:bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-dark-600 dark:text-dark-400 max-w-2xl mx-auto">
                Powerful features designed to help you manage your customer relationships effectively.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-dark-600 dark:text-dark-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Tenant Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                One Account,
                <br />
                <span className="gradient-text">Multiple Companies</span>
              </h2>
              <p className="text-lg text-dark-600 dark:text-dark-400 mb-8">
                Our multi-tenant architecture allows you to manage multiple companies, 
                switch roles seamlessly, and maintain complete data isolation.
              </p>

              <div className="space-y-4">
                {[
                  'Be an Admin for your own company',
                  'Work as Staff in another organization',
                  'Join companies as a Customer',
                  'Switch between roles instantly'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/signup" className="btn btn-primary mt-8">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl" />
              <div className="relative card p-8">
                <div className="space-y-4">
                  {[
                    { name: 'Acme Corp', role: 'ADMIN', color: 'from-red-400 to-red-600' },
                    { name: 'Tech Solutions', role: 'STAFF', color: 'from-blue-400 to-blue-600' },
                    { name: 'Global Services', role: 'CUSTOMER', color: 'from-green-400 to-green-600' }
                  ].map((company, i) => (
                    <motion.div
                      key={company.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold`}>
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{company.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          company.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          company.role === 'STAFF' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {company.role}
                        </span>
                      </div>
                      <Globe className="w-5 h-5 text-dark-400" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary-600 via-accent-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Join thousands of companies using NexusCRM to manage their customer relationships 
              and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn bg-white text-primary-600 hover:bg-dark-100 px-8 py-3 text-base shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-base"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-dark-900 dark:bg-dark-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">NexusCRM</span>
            </div>
            <p className="text-dark-400 text-sm">
              © {new Date().getFullYear()} NexusCRM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

