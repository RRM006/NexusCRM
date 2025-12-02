import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatBox from './ChatBox'

/**
 * Generic 💬 chat button to be rendered on any profile/card.
 * Clicking this button opens a ChatBox modal for 1:1 messaging.
 * All messages are automatically saved to the database.
 *
 * Props:
 * - targetUserId: string | null   -> user ID to chat with (for company/customer users)
 * - targetUserName: string | null -> display name for the chat header
 * - targetCompanyId: string | null -> company ID (for Super Admin -> Company)
 * - targetCompanyName: string | null -> company name for the chat header
 * - isSuperAdmin: boolean          -> whether to use super admin chat flows
 * - label: optional tooltip label
 * - className: optional additional CSS classes
 * - size: 'sm' | 'md' | 'lg' -> button size
 */
export const ChatButton = ({
  targetUserId,
  targetUserName = null,
  targetCompanyId = null,
  targetCompanyName = null,
  isSuperAdmin = false,
  label = 'Message',
  className = '',
  size = 'md'
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('ChatButton clicked:', { targetUserId, targetCompanyId, isSuperAdmin })
    setIsChatOpen(true)
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={!targetUserId && !targetCompanyId}
        className={`${sizeClasses[size]} hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        title={label}
      >
        <MessageCircle className={iconSizes[size]} />
      </button>

      <ChatBox
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetUserId={targetUserId}
        targetUserName={targetUserName}
        targetCompanyId={targetCompanyId}
        targetCompanyName={targetCompanyName}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  )
}

export default ChatButton


