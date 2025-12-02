import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import useChat from '../../hooks/useChat'

/**
 * Simple modal for a single conversation.
 * Expects a conversation to already be started via useChat / ChatButton.
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - isSuperAdmin: boolean (optional)
 * - initialConversationId?: string (optional) -> if provided, loads that conversation
 */
export const ChatModal = ({
  isOpen,
  onClose,
  isSuperAdmin = false,
  initialConversationId = null
}) => {
  const { conversation, messages, sendMessage, reload } = useChat({ isSuperAdmin })
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    if (initialConversationId) {
      reload(initialConversationId)
    }
  }, [isOpen, initialConversationId, reload])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-dark-900 rounded-xl shadow-xl max-w-lg w-full mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100 dark:border-dark-800">
          <div>
            <h2 className="text-sm font-semibold">
              {isSuperAdmin ? 'Super Admin Chat' : 'Direct Message'}
            </h2>
            <p className="text-xs text-dark-500">
              1:1 private conversation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.isSuperAdminSender ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                  m.isSuperAdminSender
                    ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/30 dark:text-primary-100'
                    : 'bg-dark-900 text-white dark:bg-dark-100 dark:text-dark-900'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-dark-100 dark:border-dark-800 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input"
          />
          <button
            type="submit"
            className="btn btn-primary"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatModal


