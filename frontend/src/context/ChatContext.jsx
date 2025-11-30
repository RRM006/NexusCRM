import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ChatContext = createContext(null)

// Map routes to friendly page names
const PAGE_NAMES = {
  '/dashboard': 'Dashboard',
  '/pipeline': 'Sales Pipeline',
  '/leads': 'Leads',
  '/deals': 'Deals',
  '/contacts': 'Contacts',
  '/customers': 'Customers',
  '/tasks': 'Tasks',
  '/issues': 'Issues',
  '/notes': 'Notes',
  '/activities': 'Activities',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/email': 'Email'
}

// Get page name from path
const getPageName = (pathname) => {
  // Check exact matches first
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname]
  
  // Check for detail pages (e.g., /leads/123)
  for (const [route, name] of Object.entries(PAGE_NAMES)) {
    if (pathname.startsWith(route + '/')) {
      return `${name} Detail`
    }
  }
  
  return 'Dashboard'
}

export const ChatContextProvider = ({ children }) => {
  const location = useLocation()
  const [currentPage, setCurrentPage] = useState(getPageName(location.pathname))
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [recentActions, setRecentActions] = useState([])
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Update current page when location changes
  useEffect(() => {
    const pageName = getPageName(location.pathname)
    setCurrentPage(pageName)
    
    // Clear selected entity when navigating away
    if (!location.pathname.includes('/')) {
      setSelectedEntity(null)
    }
  }, [location.pathname])

  // Set the currently selected/viewed entity
  const setCurrentEntity = useCallback((type, entity) => {
    setSelectedEntity({
      type,
      id: entity.id,
      name: entity.name || entity.title || entity.firstName || `${entity.firstName} ${entity.lastName}`,
      data: entity
    })
  }, [])

  // Clear the current entity
  const clearCurrentEntity = useCallback(() => {
    setSelectedEntity(null)
  }, [])

  // Add a recent action
  const addRecentAction = useCallback((action) => {
    setRecentActions(prev => {
      const newActions = [action, ...prev].slice(0, 5) // Keep last 5 actions
      return newActions
    })
  }, [])

  // Get context object for AI
  const getContext = useCallback(() => {
    return {
      currentPage,
      selectedEntity: selectedEntity ? {
        type: selectedEntity.type,
        id: selectedEntity.id,
        name: selectedEntity.name
      } : null,
      recentActions: recentActions.slice(0, 3) // Send last 3 actions
    }
  }, [currentPage, selectedEntity, recentActions])

  // Open chat with optional preset message
  const openChat = useCallback((presetMessage = null) => {
    setIsChatOpen(true)
    return presetMessage
  }, [])

  // Close chat
  const closeChat = useCallback(() => {
    setIsChatOpen(false)
  }, [])

  const value = {
    currentPage,
    selectedEntity,
    recentActions,
    isChatOpen,
    setCurrentEntity,
    clearCurrentEntity,
    addRecentAction,
    getContext,
    openChat,
    closeChat,
    setIsChatOpen
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = useContext(ChatContext)
  // Return null-safe fallback if context not available (e.g., on login pages)
  if (!context) {
    return {
      currentPage: null,
      selectedEntity: null,
      recentActions: [],
      isChatOpen: false,
      setCurrentEntity: () => {},
      clearCurrentEntity: () => {},
      addRecentAction: () => {},
      getContext: () => null,
      openChat: () => null,
      closeChat: () => {},
      setIsChatOpen: () => {}
    }
  }
  return context
}

export default ChatContext

