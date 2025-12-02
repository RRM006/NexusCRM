import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  User, 
  Building, 
  Clock, 
  Search,
  Loader2,
  ChevronRight
} from 'lucide-react'
import { chatAPI, superAdminChatAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ChatBox from './ChatBox'

// Simple time ago formatter
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Chat List Panel - Shows all conversations for the current user
 * Can be opened from a floating button or navigation
 */
export const ChatListPanel = ({ 
  isOpen, 
  onClose,
  isSuperAdmin = false 
}) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [chatBoxOpen, setChatBoxOpen] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // For super admin, verify token exists first
      if (isSuperAdmin) {
        const token = localStorage.getItem('superAdminToken')
        if (!token) {
          console.error('No super admin token found')
          return
        }
      }
      
      const api = isSuperAdmin ? superAdminChatAPI : chatAPI
      const res = await api.listConversations()
      if (res.data.success) {
        setConversations(res.data.data.conversations || [])
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
      // If token is invalid, don't crash - just show empty
      if (err.response?.status === 401) {
        console.error('Token expired or invalid')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen, loadConversations])

  // Get display name for a conversation
  const getConversationName = (conv) => {
    if (isSuperAdmin) {
      if (conv.type === 'SUPERADMIN_TO_COMPANY' && conv.company) {
        return conv.company.name
      }
      if (conv.type === 'SUPERADMIN_TO_CUSTOMER' && conv.targetUser) {
        return conv.targetUser.name || conv.targetUser.email
      }
    } else {
      // Handle SuperAdmin conversations from user perspective
      if (conv.type === 'SUPERADMIN_TO_CUSTOMER' || conv.type === 'SUPERADMIN_TO_COMPANY') {
        return '🛡️ Super Admin'
      }
      // For regular USER_TO_USER conversations, show the other participant
      if (conv.userOneId === user?.id) {
        return conv.userTwo?.name || conv.userTwo?.email || 'User'
      } else {
        return conv.userOne?.name || conv.userOne?.email || 'User'
      }
    }
    return 'Chat'
  }

  // Get avatar initial for a conversation
  const getConversationInitial = (conv) => {
    if (!isSuperAdmin && (conv.type === 'SUPERADMIN_TO_CUSTOMER' || conv.type === 'SUPERADMIN_TO_COMPANY')) {
      return '🛡️'
    }
    const name = getConversationName(conv)
    return name.charAt(0).toUpperCase()
  }

  // Get last message preview
  const getLastMessage = (conv) => {
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      return lastMsg.content.length > 50 
        ? lastMsg.content.slice(0, 50) + '...' 
        : lastMsg.content
    }
    return 'No messages yet'
  }

  // Get last message time
  const getLastMessageTime = (conv) => {
    if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1]
      return formatTimeAgo(lastMsg.createdAt)
    }
    return formatTimeAgo(conv.createdAt)
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const name = getConversationName(conv).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  const handleConversationClick = (conv) => {
    setSelectedConversation(conv)
    setChatBoxOpen(true)
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-dark-900 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-dark-100 dark:border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="font-semibold">Messages</h2>
              <p className="text-xs text-dark-500">{conversations.length} conversations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-dark-100 dark:border-dark-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-dark-100 dark:bg-dark-800 border-0 text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-dark-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs mt-1">Start a chat from a user profile</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-100 dark:divide-dark-800">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className="w-full px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors text-left flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white flex-shrink-0 font-semibold">
                    {conv.type === 'SUPERADMIN_TO_COMPANY' ? (
                      <Building className="w-5 h-5" />
                    ) : (
                      getConversationInitial(conv)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">
                        {getConversationName(conv)}
                      </p>
                      <span className="text-xs text-dark-400 flex-shrink-0 ml-2">
                        {getLastMessageTime(conv)}
                      </span>
                    </div>
                    <p className="text-xs text-dark-500 truncate mt-0.5">
                      {getLastMessage(conv)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-dark-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Chat Box for selected conversation */}
      {selectedConversation && (
        <ChatBox
          isOpen={chatBoxOpen}
          onClose={() => {
            setChatBoxOpen(false)
            setSelectedConversation(null)
            loadConversations() // Refresh list after closing
          }}
          targetUserId={
            isSuperAdmin 
              ? selectedConversation.targetUserId 
              : selectedConversation.userOneId === user?.id 
                ? selectedConversation.userTwoId 
                : selectedConversation.userOneId
          }
          targetCompanyId={selectedConversation.companyId}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </>
  )
}

/**
 * Floating Chat Button - Shows in bottom right corner
 * Opens the ChatListPanel when clicked
 */
export const FloatingChatButton = ({ isSuperAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 flex items-center justify-center z-30 hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <ChatListPanel
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default ChatListPanel
