import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Send, MessageCircle, Loader2, User, Building } from 'lucide-react'
import { chatAPI, superAdminChatAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

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
 * Complete ChatBox component that handles:
 * - Starting conversations
 * - Loading message history  
 * - Sending/receiving messages
 * - Auto-scrolling
 * - Polling for new messages
 * 
 * All messages are saved to the database automatically.
 */
export const ChatBox = ({
  isOpen,
  onClose,
  targetUserId = null,
  targetUserName = null,
  targetCompanyId = null,
  targetCompanyName = null,
  isSuperAdmin = false
}) => {
  const { user } = useAuth()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Load or create conversation when opening
  const initializeConversation = useCallback(async () => {
    if (!isOpen) return
    
    // Validate we have a target to chat with
    if (!isSuperAdmin && !targetUserId) {
      console.warn('ChatBox: No targetUserId provided')
      setError('No chat target specified')
      return
    }
    
    // For super admin, verify token exists first
    if (isSuperAdmin) {
      const token = localStorage.getItem('superAdminToken')
      if (!token) {
        setError('Super Admin session expired. Please log in again.')
        return
      }
    }
    
    try {
      setIsLoading(true)
      setError(null)

      let res
      if (isSuperAdmin) {
        // Super Admin flows
        if (targetCompanyId && !targetUserId) {
          res = await superAdminChatAPI.startWithCompany(targetCompanyId)
        } else if (targetUserId) {
          res = await superAdminChatAPI.startWithCustomer(targetUserId, targetCompanyId)
        } else {
          setError('Super Admin: No target specified')
          return
        }
      } else if (targetUserId) {
        // Normal user chat
        res = await chatAPI.start(targetUserId)
      }

      if (res?.data?.success) {
        const conv = res.data.data.conversation
        setConversation(conv)
        // Load full conversation with messages
        await loadMessages(conv.id)
      }
    } catch (err) {
      console.error('Failed to start conversation:', err)
      // Better error message for token issues
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.')
      } else {
        setError(err.response?.data?.message || 'Failed to start conversation')
      }
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, targetUserId, targetCompanyId, isSuperAdmin])

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return

    try {
      const api = isSuperAdmin ? superAdminChatAPI : chatAPI
      const res = await api.getConversation(conversationId)
      if (res.data.success) {
        setConversation(res.data.data.conversation)
        setMessages(res.data.data.conversation.messages || [])
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }, [isSuperAdmin])

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      initializeConversation()
    } else {
      // Reset state when closing
      setConversation(null)
      setMessages([])
      setInput('')
      setError(null)
    }
  }, [isOpen, initializeConversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when conversation loads
  useEffect(() => {
    if (conversation && inputRef.current) {
      inputRef.current.focus()
    }
  }, [conversation])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversation?.id || !isOpen) return

    const interval = setInterval(() => {
      loadMessages(conversation.id)
    }, 3000)

    return () => clearInterval(interval)
  }, [conversation?.id, isOpen, loadMessages])

  // Send message handler
  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || !conversation?.id || isSending) return

    const messageContent = input.trim()
    setInput('')
    setIsSending(true)

    try {
      const api = isSuperAdmin ? superAdminChatAPI : chatAPI
      const res = await api.send(conversation.id, messageContent)
      
      if (res.data.success) {
        const newMessage = res.data.data.message
        setMessages(prev => [...prev, newMessage])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
      // Restore input on error
      setInput(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  // Determine if message is from current user
  const isOwnMessage = (message) => {
    if (isSuperAdmin) {
      return message.isSuperAdminSender
    }
    return message.senderUserId === user?.id
  }

  // Get display name for chat header
  const getChatTitle = () => {
    if (targetUserName) return targetUserName
    if (targetCompanyName) return targetCompanyName
    if (isSuperAdmin && conversation?.targetUser) {
      return conversation.targetUser.name || conversation.targetUser.email
    }
    if (isSuperAdmin && conversation?.company) {
      return conversation.company.name
    }
    return 'Chat'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col h-[600px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100 dark:border-dark-800 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {targetCompanyId && !targetUserId ? (
                <Building className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                {getChatTitle()}
              </h2>
              <p className="text-xs text-white/70">
                {isSuperAdmin ? 'Super Admin Chat' : '1:1 Private Message'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-50 dark:bg-dark-950">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-2" />
                <p className="text-sm text-dark-500">Loading conversation...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-500">
                <p className="text-sm">{error}</p>
                <button 
                  onClick={initializeConversation}
                  className="mt-2 text-primary-500 hover:underline text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-dark-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No messages yet</p>
                <p className="text-xs mt-1">Send a message to start the conversation</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isOwn = isOwnMessage(message)
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-primary-500 text-white rounded-br-md'
                          : 'bg-white dark:bg-dark-800 text-dark-900 dark:text-dark-100 rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-dark-400'}`}>
                        {formatTimeAgo(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSend} 
          className="border-t border-dark-100 dark:border-dark-800 p-3 bg-white dark:bg-dark-900"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading || !conversation}
              className="flex-1 px-4 py-2.5 rounded-full bg-dark-100 dark:bg-dark-800 border-0 focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending || !conversation}
              className="p-2.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatBox
