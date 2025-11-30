import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { notesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Pin,
  AlertCircle
} from 'lucide-react'
import { validateForm } from '../../utils/validation'

const Notes = () => {
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [formData, setFormData] = useState({ content: '', isPinned: false })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Validation config
  const validationConfig = {
    content: { required: true, min: 1, max: 5000, label: 'Content' }
  }

  useEffect(() => {
    fetchNotes()
  }, [pagination.page])

  const fetchNotes = async () => {
    try {
      const response = await notesAPI.getAll({ page: pagination.page, limit: pagination.limit })
      if (response.data.success) {
        setNotes(response.data.data.notes)
        setPagination(prev => ({ ...prev, ...response.data.data.pagination }))
      }
    } catch (error) {
      toast.error('Failed to fetch notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const { isValid, errors: validationErrors } = validateForm(formData, validationConfig)
    setErrors(validationErrors)
    
    if (!isValid) {
      toast.error('Please fix the validation errors')
      return
    }
    
    setIsSubmitting(true)
    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, formData)
        toast.success('Note updated successfully')
      } else {
        await notesAPI.create(formData)
        toast.success('Note created successfully')
      }
      setShowModal(false)
      setEditingNote(null)
      setFormData({ content: '', isPinned: false })
      setErrors({})
      fetchNotes()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (note) => {
    setEditingNote(note)
    setFormData({ content: note.content, isPinned: note.isPinned })
    setErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return
    try {
      await notesAPI.delete(id)
      toast.success('Note deleted successfully')
      fetchNotes()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete note')
    }
  }

  const togglePin = async (note) => {
    try {
      await notesAPI.update(note.id, { isPinned: !note.isPinned })
      fetchNotes()
    } catch (error) {
      toast.error('Failed to update note')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Notes</h1>
          <p className="text-dark-500">Keep track of important information</p>
        </div>
        <button
          onClick={() => {
            setEditingNote(null)
            setFormData({ content: '', isPinned: false })
            setErrors({})
            setShowModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {/* Notes Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notes.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`card p-5 hover:shadow-lg transition-shadow ${
                  note.isPinned ? 'border-2 border-amber-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {note.isPinned && (
                      <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    <span className="text-xs text-dark-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePin(note)}
                      className={`p-1.5 rounded-lg ${
                        note.isPinned
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'hover:bg-dark-100 dark:hover:bg-dark-800'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${note.isPinned ? 'text-amber-500' : 'text-dark-400'}`} />
                    </button>
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                    >
                      <Pencil className="w-4 h-4 text-dark-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <p className="text-dark-700 dark:text-dark-300 whitespace-pre-wrap line-clamp-6">
                  {note.content}
                </p>

                {(note.customer || note.lead) && (
                  <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-800 text-xs text-dark-500">
                    {note.customer && <p>Customer: {note.customer.name}</p>}
                    {note.lead && <p>Lead: {note.lead.title}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-dark-300" />
            <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
            <p className="text-dark-500 mb-6">Start taking notes to keep track of important information</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Add Note
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-dark-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-800">
                <h2 className="text-xl font-semibold">
                  {editingNote ? 'Edit Note' : 'Add Note'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-dark-100 dark:hover:bg-dark-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">Content <span className="text-red-500">*</span></label>
                    <span className={`text-xs ${formData.content.length > 4500 ? 'text-amber-500' : 'text-dark-400'}`}>
                      {formData.content.length}/5000
                    </span>
                  </div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => {
                      if (e.target.value.length <= 5000) {
                        setFormData(prev => ({ ...prev, content: e.target.value }))
                        setErrors(prev => ({ ...prev, content: null }))
                      }
                    }}
                    required
                    maxLength={5000}
                    className={`input min-h-[200px] ${errors.content ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Write your note here..."
                  />
                  {errors.content && (
                    <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.content}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Pin this note</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); setErrors({}) }} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingNote ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Notes

