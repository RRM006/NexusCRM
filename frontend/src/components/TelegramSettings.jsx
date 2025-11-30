import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageCircle, 
  Phone, 
  Check, 
  X, 
  RefreshCw, 
  Bell, 
  ExternalLink,
  Loader2,
  Copy,
  CheckCircle
} from 'lucide-react'
import { telegramAPI } from '../services/api'
import toast from 'react-hot-toast'

const TelegramSettings = () => {
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)

  const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'NexusCRMBot'

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await telegramAPI.getStatus()
      if (response.data.success) {
        setStatus(response.data.data)
        if (response.data.data.phone) {
          setPhone(response.data.data.phone)
        }
      }
    } catch (error) {
      console.error('Failed to fetch Telegram status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePhone = async (e) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    setIsSaving(true)
    try {
      const response = await telegramAPI.updatePhone(phone)
      if (response.data.success) {
        toast.success('Phone number saved!')
        fetchStatus()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save phone number')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    try {
      const response = await telegramAPI.testNotification()
      if (response.data.success) {
        toast.success('Test notification sent! Check your Telegram.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send test notification')
    } finally {
      setIsTesting(false)
    }
  }

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink your Telegram account?')) {
      return
    }

    try {
      const response = await telegramAPI.unlink()
      if (response.data.success) {
        toast.success('Telegram account unlinked')
        fetchStatus()
      }
    } catch (error) {
      toast.error('Failed to unlink Telegram')
    }
  }

  const copyBotLink = () => {
    navigator.clipboard.writeText(`https://t.me/${BOT_USERNAME}`)
    setCopied(true)
    toast.success('Bot link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Telegram Integration</h3>
            <p className="text-blue-100">Manage your CRM from Telegram</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
          <div className="flex items-center gap-3">
            {status?.isTelegramLinked ? (
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <X className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <div>
              <p className="font-semibold">
                {status?.isTelegramLinked ? 'Connected' : 'Not Connected'}
              </p>
              {status?.isTelegramLinked && status?.telegramUsername && (
                <p className="text-sm text-dark-500">@{status.telegramUsername}</p>
              )}
            </div>
          </div>
          {status?.isTelegramLinked && (
            <button
              onClick={handleUnlink}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Unlink
            </button>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="label">Phone Number</label>
          <p className="text-sm text-dark-500 mb-2">
            Enter your phone number to link with Telegram bot
          </p>
          <form onSubmit={handleSavePhone} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
                className="input pl-11"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
          </form>
          {status?.isPhoneVerified && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Phone verified via Telegram
            </p>
          )}
        </div>

        {/* How to Link */}
        {!status?.isTelegramLinked && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to Link Your Telegram
            </h4>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Save your phone number above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Open the NexusCRM bot in Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Click "Share Phone Number" to link your account</span>
              </li>
            </ol>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Open Bot
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={copyBotLink}
                className="btn btn-secondary btn-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Bot Features */}
        <div>
          <h4 className="font-semibold mb-3">What You Can Do via Telegram</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: '📊', text: 'View dashboard stats' },
              { icon: '👥', text: 'Manage leads & customers' },
              { icon: '✅', text: 'Track & complete tasks' },
              { icon: '🎫', text: 'Handle support issues' },
              { icon: '🔔', text: 'Receive notifications' },
              { icon: '🔄', text: 'Quick status updates' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-dark-50 dark:bg-dark-800"
              >
                <span className="text-xl">{feature.icon}</span>
                <span className="text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Test Notification */}
        {status?.isTelegramLinked && (
          <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Test Notification</p>
                <p className="text-sm text-dark-500">Send a test message to verify connection</p>
              </div>
              <button
                onClick={handleTestNotification}
                disabled={isTesting}
                className="btn btn-secondary"
              >
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Send Test
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Refresh Status */}
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>
    </motion.div>
  )
}

export default TelegramSettings

