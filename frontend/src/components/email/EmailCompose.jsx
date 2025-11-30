import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Paperclip, Image, Link, Bold, Italic, List, Loader2, FileText, ChevronDown } from 'lucide-react'
import { emailAPI } from '../../services/api'
import toast from 'react-hot-toast'

const EmailCompose = ({ 
  isOpen, 
  onClose, 
  defaultTo = '', 
  defaultSubject = '',
  contactId = null,
  leadId = null,
  customerId = null,
  onSent = () => {}
}) => {
  const [to, setTo] = useState(defaultTo)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState('')
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setTo(defaultTo)
      setSubject(defaultSubject)
      fetchTemplates()
    }
  }, [isOpen, defaultTo, defaultSubject])

  const fetchTemplates = async () => {
    try {
      const response = await emailAPI.getTemplates()
      if (response.data.success) {
        setTemplates(response.data.data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setSubject(template.subject)
    setBody(template.bodyHtml || template.bodyText || '')
    setShowTemplates(false)
  }

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('Please enter a recipient email')
      return
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!body.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSending(true)
    try {
      const ccEmails = cc.split(',').map(e => e.trim()).filter(Boolean)
      const bccEmails = bcc.split(',').map(e => e.trim()).filter(Boolean)

      const response = await emailAPI.sendEmail({
        to: to.trim(),
        subject,
        bodyHtml: body.replace(/\n/g, '<br>'),
        bodyText: body.replace(/<[^>]*>/g, ''),
        cc: ccEmails.length > 0 ? ccEmails : undefined,
        bcc: bccEmails.length > 0 ? bccEmails : undefined,
        contactId,
        leadId,
        customerId,
        templateId: selectedTemplate?.id
      })

      if (response.data.success) {
        toast.success('Email sent successfully!')
        onSent(response.data.data.email)
        handleClose()
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send email'
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setTo('')
    setCc('')
    setBcc('')
    setSubject('')
    setBody('')
    setShowCcBcc(false)
    setSelectedTemplate(null)
    onClose()
  }

  const formatText = (command) => {
    document.execCommand(command, false, null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-dark-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-200 dark:border-dark-700">
            <h2 className="text-lg font-semibold">New Message</h2>
            <div className="flex items-center gap-2">
              {/* Template Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Templates
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showTemplates && templates.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-dark-200 dark:border-dark-700 z-50 py-2 max-h-64 overflow-auto"
                  >
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className="w-full px-4 py-2 text-left hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors"
                      >
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-dark-500 truncate">{template.subject}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Email Form */}
          <div className="flex-1 overflow-auto">
            {/* To */}
            <div className="flex items-center border-b border-dark-200 dark:border-dark-700 px-6">
              <label className="text-sm text-dark-500 w-12">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 py-3 bg-transparent border-none outline-none text-sm"
              />
              <button
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Cc/Bcc
              </button>
            </div>

            {/* Cc/Bcc */}
            <AnimatePresence>
              {showCcBcc && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="flex items-center border-b border-dark-200 dark:border-dark-700 px-6">
                    <label className="text-sm text-dark-500 w-12">Cc</label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com, cc2@example.com"
                      className="flex-1 py-3 bg-transparent border-none outline-none text-sm"
                    />
                  </div>
                  <div className="flex items-center border-b border-dark-200 dark:border-dark-700 px-6">
                    <label className="text-sm text-dark-500 w-12">Bcc</label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="flex-1 py-3 bg-transparent border-none outline-none text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subject */}
            <div className="flex items-center border-b border-dark-200 dark:border-dark-700 px-6">
              <label className="text-sm text-dark-500 w-12">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1 py-3 bg-transparent border-none outline-none text-sm"
              />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 px-6 py-2 border-b border-dark-200 dark:border-dark-700">
              <button
                onClick={() => formatText('bold')}
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('italic')}
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('insertUnorderedList')}
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="List"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-dark-200 dark:bg-dark-700 mx-2" />
              <button
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Insert image"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                className="p-2 rounded hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                title="Insert link"
              >
                <Link className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={12}
                className="w-full bg-transparent border-none outline-none text-sm resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50">
            <div className="text-xs text-dark-500">
              {selectedTemplate && (
                <span>Using template: <span className="font-medium">{selectedTemplate.name}</span></span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EmailCompose

