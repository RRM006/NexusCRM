import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  ChevronRight,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Wrench,
  Database,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileText,
  Users,
  Target,
  ClipboardList,
  UserPlus,
  ListTodo,
  StickyNote,
  MapPin
} from 'lucide-react'
import { aiAPI } from '../../services/api'
import { useCompany } from '../../context/CompanyContext'
import { useChatContext } from '../../context/ChatContext'
import toast from 'react-hot-toast'

// Web Speech API setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechSynthesis = window.speechSynthesis

// Quick action definitions based on role
const QUICK_ACTIONS = {
  ADMIN: [
    { id: 'create_lead', label: 'New Lead', icon: Target, prompt: 'I want to create a new lead', color: 'emerald' },
    { id: 'create_contact', label: 'New Contact', icon: UserPlus, prompt: 'I want to add a new contact', color: 'blue' },
    { id: 'create_task', label: 'New Task', icon: ListTodo, prompt: 'Create a task for me', color: 'amber' },
    { id: 'create_note', label: 'Add Note', icon: StickyNote, prompt: 'I want to add a note', color: 'violet' },
    { id: 'show_leads', label: 'View Leads', icon: Target, prompt: 'Show me all leads', color: 'slate' },
    { id: 'show_tasks', label: 'My Tasks', icon: ClipboardList, prompt: 'Show my pending tasks', color: 'slate' },
  ],
  STAFF: [
    { id: 'create_lead', label: 'New Lead', icon: Target, prompt: 'I want to create a new lead', color: 'emerald' },
    { id: 'create_contact', label: 'New Contact', icon: UserPlus, prompt: 'I want to add a new contact', color: 'blue' },
    { id: 'create_task', label: 'New Task', icon: ListTodo, prompt: 'Create a task for me', color: 'amber' },
    { id: 'create_note', label: 'Add Note', icon: StickyNote, prompt: 'I want to add a note', color: 'violet' },
    { id: 'show_leads', label: 'View Leads', icon: Target, prompt: 'Show me all leads', color: 'slate' },
  ],
  CUSTOMER: [
    { id: 'create_issue', label: 'New Issue', icon: FileText, prompt: 'I want to report an issue', color: 'red' },
    { id: 'show_issues', label: 'My Issues', icon: ClipboardList, prompt: 'Show my support issues', color: 'slate' },
    { id: 'show_tasks', label: 'My Tasks', icon: ListTodo, prompt: 'Show my tasks', color: 'amber' },
  ]
}

const AIChatbot = ({ isOpen, onClose }) => {
  const { currentRole } = useCompany()
  const chatContext = useChatContext()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Voice chat states
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Get quick actions for current role
  const quickActions = QUICK_ACTIONS[currentRole] || QUICK_ACTIONS.STAFF

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      setIsVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript('')
      }

      recognition.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Update displayed transcript
        setTranscript(interimTranscript || finalTranscript)
        
        // Reset silence timer on speech
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }

        // If we have final transcript, update input
        if (finalTranscript) {
          setInput(prev => (prev + ' ' + finalTranscript).trim())
          setTranscript('')
        }

        // Auto-stop after 2 seconds of silence
        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            stopListening(true)
          }
        }, 2000)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          toast.error(`Voice error: ${event.error}`)
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setVoiceLevel(0)
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
      fetchSuggestions()
      inputRef.current?.focus()
    } else {
      // Stop listening when panel closes
      if (isListening) {
        stopListening(false)
      }
      speechSynthesis?.cancel()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Voice level visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (!isListening) {
          setVoiceLevel(0)
          return
        }
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setVoiceLevel(Math.min(100, average * 1.5))
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch (error) {
      console.error('Audio visualization error:', error)
    }
  }

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isLoading) return

    try {
      // Cancel any ongoing speech
      speechSynthesis?.cancel()
      setIsSpeaking(false)
      
      recognitionRef.current.start()
      await startAudioVisualization()
      toast.success('🎤 Listening... Speak now', { duration: 1500 })
    } catch (error) {
      console.error('Failed to start listening:', error)
      toast.error('Failed to start voice input')
    }
  }, [isLoading])

  // Stop listening
  const stopListening = useCallback((autoSend = false) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    setIsListening(false)
    setVoiceLevel(0)
    setTranscript('')

    // Auto-send message after voice input stops
    if (autoSend && input.trim()) {
      setTimeout(() => {
        handleSend()
      }, 300)
    }
  }, [input])

  // Text-to-speech for AI response
  const speakText = useCallback((text) => {
    if (!ttsEnabled || !speechSynthesis) return

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    // Try to get a natural sounding voice
    const voices = speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Natural') || 
      v.name.includes('Samantha') ||
      v.lang.startsWith('en')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    speechSynthesis.speak(utterance)
  }, [ttsEnabled])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await aiAPI.getConversations()
      if (response.data.success) {
        setConversations(response.data.data.conversations)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await aiAPI.getSuggestions()
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const loadConversation = async (id) => {
    try {
      const response = await aiAPI.getConversation(id)
      if (response.data.success) {
        const conv = response.data.data.conversation
        setCurrentConversation(conv)
        setMessages(conv.messages || [])
        setShowHistory(false)
      }
    } catch (error) {
      toast.error('Failed to load conversation')
    }
  }

  const startNewConversation = () => {
    setCurrentConversation(null)
    setMessages([])
    setShowHistory(false)
  }

  const handleSend = async (customMessage = null) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || isLoading) return

    // Stop listening if active
    if (isListening) {
      stopListening(false)
    }

    const userMessage = messageToSend
    if (!customMessage) setInput('')
    setShowQuickActions(false)
    
    // Add user message immediately
    const tempUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMessage])
    
    // Get context from ChatContext
    const context = chatContext?.getContext?.() || null
    
    setIsLoading(true)
    try {
      const response = await aiAPI.chat(userMessage, currentConversation?.id, context)
      
      if (response.data.success) {
        const { conversationId, message, title } = response.data.data
        
        // Update current conversation
        if (!currentConversation) {
          setCurrentConversation({ id: conversationId, title })
        }
        
        // Add AI response
        setMessages(prev => [...prev, message])
        
        // Speak the AI response if TTS is enabled
        if (ttsEnabled && message.content) {
          speakText(message.content)
        }
        
        // Refresh conversations list
        fetchConversations()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to get AI response'
      toast.error(errorMessage)
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation()
    try {
      await aiAPI.deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (currentConversation?.id === id) {
        startNewConversation()
      }
      toast.success('Conversation deleted')
    } catch (error) {
      toast.error('Failed to delete conversation')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all conversations?')) return
    try {
      await aiAPI.clearConversations()
      setConversations([])
      startNewConversation()
      toast.success('All conversations cleared')
    } catch (error) {
      toast.error('Failed to clear conversations')
    }
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-0 h-full w-full max-w-lg bg-white dark:bg-dark-900 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200 dark:border-dark-700 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500 to-orange-500 animate-pulse' 
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}>
                {isListening ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h2 className="font-semibold">
                  {isListening ? 'Voice Mode' : 'AI Assistant'}
                </h2>
                <p className="text-xs text-dark-500">
                  {isListening ? 'Listening... speak now' : `${currentRole} Access • Gemini Powered`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory 
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' 
                    : 'hover:bg-dark-100 dark:hover:bg-dark-800'
                }`}
                title="Chat History"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={startNewConversation}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="New Chat"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '260px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="border-r border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 overflow-hidden"
                >
                  <div className="p-3 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium">History</h3>
                      {conversations.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-auto space-y-1">
                      {conversations.length === 0 ? (
                        <p className="text-sm text-dark-500 text-center py-4">
                          No conversations yet
                        </p>
                      ) : (
                        conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => loadConversation(conv.id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors group ${
                              currentConversation?.id === conv.id
                                ? 'bg-violet-100 dark:bg-violet-900/30'
                                : 'hover:bg-dark-100 dark:hover:bg-dark-700'
                            }`}
                          >
                            <MessageSquare className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{conv.title || 'New Chat'}</p>
                              <p className="text-xs text-dark-500">
                                {conv.messageCount} messages
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-200 dark:hover:bg-dark-600 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                            </button>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Hi! I'm your CRM Assistant
                    </h3>
                    <p className="text-dark-500 text-sm mb-4">
                      I can help you with {currentRole === 'ADMIN' ? 'all CRM data' : currentRole === 'STAFF' ? 'leads, contacts, and tasks' : 'your issues and tasks'}. 
                      Ask me anything!
                    </p>

                    {/* Context indicator */}
                    {chatContext?.currentPage && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs mb-4">
                        <MapPin className="w-3 h-3" />
                        Currently on: {chatContext.currentPage}
                        {chatContext.selectedEntity && (
                          <span className="text-dark-400">
                            • Viewing {chatContext.selectedEntity.type}: {chatContext.selectedEntity.name}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="w-full max-w-md mb-6">
                      <p className="text-xs text-dark-400 mb-3">Quick Actions:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {quickActions.slice(0, 6).map((action) => {
                          const Icon = action.icon
                          const colorClasses = {
                            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
                            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
                            amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
                            violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 border-violet-200 dark:border-violet-800',
                            red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
                            slate: 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700',
                          }
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleSend(action.prompt)}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${colorClasses[action.color]}`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-medium">{action.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Quick Suggestions */}
                    <div className="w-full max-w-sm space-y-2">
                      <p className="text-xs text-dark-400 mb-2">Or try asking:</p>
                      {suggestions.slice(0, 3).map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(suggestion)
                            inputRef.current?.focus()
                          }}
                          className="w-full flex items-center gap-2 p-3 text-left text-sm rounded-xl border border-dark-200 dark:border-dark-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-violet-500" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                          {/* Show tools used badge */}
                          {msg.role === 'assistant' && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <Database className="w-3 h-3" />
                                Used CRM data
                              </span>
                              {msg.toolsUsed.slice(0, 3).map((tool, i) => (
                                <span 
                                  key={i}
                                  className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                                >
                                  {tool.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {msg.toolsUsed.length > 3 && (
                                <span className="text-xs text-dark-400">
                                  +{msg.toolsUsed.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              msg.role === 'user'
                                ? 'bg-violet-500 text-white rounded-br-md'
                                : 'bg-dark-100 dark:bg-dark-800 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            <span className="text-xs text-dark-400">
                              {formatTime(msg.timestamp)}
                            </span>
                            {msg.role === 'assistant' && (
                              <button
                                onClick={() => copyToClipboard(msg.content, index)}
                                className="p-1 hover:bg-dark-200 dark:hover:bg-dark-700 rounded"
                                title="Copy"
                              >
                                {copiedIndex === index ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-dark-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-dark-100 dark:bg-dark-800 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              <span className="text-sm text-dark-500">Processing...</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-dark-400">
                              <Database className="w-3 h-3 animate-pulse text-emerald-500" />
                              <span>Querying CRM data with MCP tools</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Voice Chat Indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-t border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                            <Mic className="w-5 h-5 text-white" />
                          </div>
                          {/* Voice level indicator rings */}
                          <div 
                            className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
                            style={{ opacity: voiceLevel / 200 }}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            Listening...
                          </p>
                          <p className="text-xs text-dark-500">
                            {transcript || 'Speak now • Auto-stops on silence'}
                          </p>
                        </div>
                      </div>
                      {/* Voice level bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            animate={{ width: `${voiceLevel}%` }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <button
                          onClick={() => stopListening(true)}
                          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                          title="Stop & Send"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speaking Indicator */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-t border-violet-200 dark:border-violet-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-violet-500 rounded-full"
                              animate={{
                                height: [8, 16, 8],
                              }}
                              transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-violet-600 dark:text-violet-400">
                          AI is speaking...
                        </span>
                      </div>
                      <button
                        onClick={stopSpeaking}
                        className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                        title="Stop speaking"
                      >
                        <VolumeX className="w-4 h-4 text-violet-500" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Actions Panel */}
              <AnimatePresence>
                {showQuickActions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50"
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-dark-500">Quick Actions</span>
                        <button 
                          onClick={() => setShowQuickActions(false)}
                          className="p-1 hover:bg-dark-200 dark:hover:bg-dark-700 rounded"
                        >
                          <X className="w-3 h-3 text-dark-400" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {quickActions.map((action) => {
                          const Icon = action.icon
                          const colorClasses = {
                            emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200',
                            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200',
                            amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200',
                            violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200',
                            red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200',
                            slate: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200',
                          }
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleSend(action.prompt)}
                              disabled={isLoading}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorClasses[action.color]} disabled:opacity-50`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {action.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Context Bar */}
              {chatContext?.currentPage && messages.length > 0 && (
                <div className="px-4 py-2 border-t border-dark-200 dark:border-dark-700 bg-violet-50/50 dark:bg-violet-900/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                    <MapPin className="w-3 h-3" />
                    <span>{chatContext.currentPage}</span>
                    {chatContext.selectedEntity && (
                      <>
                        <span className="text-dark-300">•</span>
                        <span>{chatContext.selectedEntity.type}: {chatContext.selectedEntity.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-900">
                <div className="flex items-end gap-2">
                  {/* Quick Actions Toggle */}
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    disabled={isLoading}
                    className={`p-3 rounded-xl transition-all ${
                      showQuickActions
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                        : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Quick Actions"
                  >
                    <Zap className="w-5 h-5" />
                  </button>

                  {/* Voice Input Button */}
                  {isVoiceSupported && (
                    <button
                      onClick={isListening ? () => stopListening(true) : startListening}
                      disabled={isLoading}
                      className={`p-3 rounded-xl transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isListening ? 'Listening... speak now' : 'Ask me anything about your CRM...'}
                      rows={1}
                      disabled={isListening}
                      className="w-full resize-none rounded-xl border border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
                      style={{ maxHeight: '120px' }}
                    />
                  </div>
                  
                  {/* TTS Toggle */}
                  <button
                    onClick={() => {
                      setTtsEnabled(!ttsEnabled)
                      if (isSpeaking) stopSpeaking()
                      toast.success(ttsEnabled ? 'Voice response off' : 'Voice response on', { duration: 1500 })
                    }}
                    className={`p-3 rounded-xl transition-all ${
                      ttsEnabled
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                        : 'bg-dark-100 dark:bg-dark-800 text-dark-400'
                    }`}
                    title={ttsEnabled ? 'Disable voice response' : 'Enable voice response'}
                  >
                    {ttsEnabled ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="p-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-dark-400 mt-2 text-center flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  {isVoiceSupported ? 'Voice enabled • ' : ''}MCP-enabled • Real CRM data access • {currentRole} permissions
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AIChatbot

