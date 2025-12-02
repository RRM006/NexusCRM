import { useEffect, useState, useCallback } from 'react'
import { chatAPI, superAdminChatAPI } from '../services/api'
import { useCompany } from '../context/CompanyContext'

// Simple polling-based chat hook (can be upgraded to sockets later)

export const useChat = ({ isSuperAdmin = false } = {}) => {
  const { currentRole } = useCompany()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadConversation = useCallback(async (conversationId) => {
    try {
      setIsLoading(true)
      setError(null)

      const api = isSuperAdmin ? superAdminChatAPI : chatAPI
      const res = await api.getConversation(conversationId)
      if (res.data.success) {
        setConversation(res.data.data.conversation)
        setMessages(res.data.data.conversation.messages || [])
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError('Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }, [isSuperAdmin])

  const startConversation = useCallback(
    async ({ withUserId, companyId, isCompanyTarget = false }) => {
      try {
        setIsLoading(true)
        setError(null)

        if (isSuperAdmin) {
          // Super Admin flows
          let res
          if (isCompanyTarget) {
            res = await superAdminChatAPI.startWithCompany(companyId)
          } else {
            res = await superAdminChatAPI.startWithCustomer(withUserId, companyId)
          }

          if (res.data.success) {
            const conv = res.data.data.conversation
            setConversation(conv)
            await loadConversation(conv.id)
            return conv
          }
        } else {
          // Normal company user/customer chat
          const res = await chatAPI.start(withUserId)
          if (res.data.success) {
            const conv = res.data.data.conversation
            setConversation(conv)
            await loadConversation(conv.id)
            return conv
          }
        }
      } catch (err) {
        console.error('Failed to start conversation:', err)
        setError(err.response?.data?.message || 'Failed to start conversation')
      } finally {
        setIsLoading(false)
      }
    },
    [isSuperAdmin, loadConversation]
  )

  const sendMessage = useCallback(
    async (content) => {
      if (!conversation?.id || !content?.trim()) return
      try {
        const api = isSuperAdmin ? superAdminChatAPI : chatAPI
        const res = await api.send(conversation.id, content.trim())
        if (res.data.success) {
          const msg = res.data.data.message
          setMessages((prev) => [...prev, msg])
        }
      } catch (err) {
        console.error('Failed to send message:', err)
        setError(err.response?.data?.message || 'Failed to send message')
      }
    },
    [conversation, isSuperAdmin]
  )

  // Optional simple auto-refresh for active conversation
  useEffect(() => {
    if (!conversation?.id) return

    const interval = setInterval(() => {
      loadConversation(conversation.id)
    }, 5000)

    return () => clearInterval(interval)
  }, [conversation?.id, loadConversation])

  return {
    currentRole,
    conversation,
    messages,
    isLoading,
    error,
    startConversation,
    sendMessage,
    reload: () => conversation?.id && loadConversation(conversation.id)
  }
}

export default useChat


