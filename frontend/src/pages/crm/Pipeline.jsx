import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  DollarSign, 
  User, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Target,
  RefreshCw,
  Filter,
  BarChart3,
  ChevronDown,
  GripVertical,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  Kanban,
  AlertCircle
} from 'lucide-react'
import { pipelineAPI, leadsAPI, dealsAPI } from '../../services/api'
import { useCompany } from '../../context/CompanyContext'
import toast from 'react-hot-toast'
import { getTodayDateString, validateFutureDate } from '../../utils/validation'

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

// Format date
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Card component for leads/deals
const PipelineCard = ({ item, type, onDragStart, onDragEnd, onConvert, onEdit }) => {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={(e) => {
        setIsDragging(true)
        onDragStart(e, item)
      }}
      onDragEnd={() => {
        setIsDragging(false)
        onDragEnd()
      }}
      className={`bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-dark-100 dark:border-dark-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group ${
        isDragging ? 'opacity-50 scale-95 shadow-lg' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.title}</h4>
          {item.customer && (
            <p className="text-xs text-dark-500 truncate flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3" />
              {item.customer.name}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(item)
          }}
          className="p-1 hover:bg-dark-100 dark:hover:bg-dark-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="w-3.5 h-3.5 text-dark-400" />
        </button>
      </div>

      {/* Value */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(item.value)}
        </span>
        {item.probability !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            {item.probability}%
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-100 dark:border-dark-700">
        {/* Assignee */}
        {(item.assignedTo || item.owner) && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs text-white font-medium">
              {(item.assignedTo?.name || item.owner?.name || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-dark-500 truncate max-w-[80px]">
              {item.assignedTo?.name || item.owner?.name}
            </span>
          </div>
        )}

        {/* Expected close date */}
        {item.expectedCloseDate && (
          <div className="flex items-center gap-1 text-xs text-dark-400">
            <Calendar className="w-3 h-3" />
            {formatDate(item.expectedCloseDate)}
          </div>
        )}
      </div>

      {/* Convert to Deal Button - Only for leads */}
      {type === 'leads' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConvert(item)
          }}
          className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Briefcase className="w-3.5 h-3.5" />
          Convert to Deal
        </button>
      )}
    </motion.div>
  )
}

// Stage column component
const StageColumn = ({ 
  stage, 
  items, 
  type, 
  onDragOver, 
  onDrop, 
  onConvert, 
  onEdit,
  draggedItem 
}) => {
  const [isOver, setIsOver] = useState(false)
  
  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0)

  return (
    <div
      className={`flex flex-col w-80 flex-shrink-0 rounded-xl transition-all ${
        isOver ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-dark-900' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
        onDragOver(e, stage)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        setIsOver(false)
        onDrop(e, stage)
      }}
    >
      {/* Stage Header */}
      <div 
        className="px-4 py-3 rounded-t-xl"
        style={{ backgroundColor: `${stage.color}15` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-sm">{stage.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-dark-800 text-dark-600 dark:text-dark-300">
              {items.length}
            </span>
          </div>
          {stage.probability > 0 && (
            <span className="text-xs text-dark-500">
              {stage.probability}% win
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4 text-dark-400" />
          <span className="font-medium">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-2 space-y-2 bg-dark-50 dark:bg-dark-800/50 rounded-b-xl min-h-[200px] max-h-[calc(100vh-320px)] overflow-auto">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <PipelineCard
              key={item.id}
              item={item}
              type={type}
              onDragStart={(e, item) => {
                e.dataTransfer.setData('item', JSON.stringify(item))
                e.dataTransfer.setData('sourceStageId', stage.id)
              }}
              onDragEnd={() => {}}
              onConvert={onConvert}
              onEdit={onEdit}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="h-32 flex items-center justify-center text-dark-400 text-sm border-2 border-dashed border-dark-200 dark:border-dark-700 rounded-lg">
            Drop items here
          </div>
        )}
      </div>
    </div>
  )
}

// Convert to Deal Modal
const ConvertToDealModal = ({ lead, onClose, onConvert }) => {
  const [value, setValue] = useState(lead?.value || 0)
  const [expectedCloseDate, setExpectedCloseDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate date if provided
    if (expectedCloseDate) {
      const dateValidation = validateFutureDate(expectedCloseDate, true)
      if (!dateValidation.valid) {
        setErrors({ expectedCloseDate: dateValidation.error })
        toast.error('Please fix the validation errors')
        return
      }
    }
    
    setIsLoading(true)
    try {
      await onConvert(lead.id, { value, expectedCloseDate: expectedCloseDate || null })
      onClose()
    } catch (error) {
      console.error('Convert error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!lead) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Convert to Deal</h2>
            <p className="text-sm text-dark-500">{lead.title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deal Value</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                min="0"
                max="999999999"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expected Close Date</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => {
                setExpectedCloseDate(e.target.value)
                setErrors(prev => ({ ...prev, expectedCloseDate: null }))
              }}
              min={getTodayDateString()}
              className={`w-full px-4 py-3 rounded-xl border ${errors.expectedCloseDate ? 'border-red-500' : 'border-dark-200 dark:border-dark-700'} bg-dark-50 dark:bg-dark-800 focus:ring-2 focus:ring-emerald-500`}
            />
            {errors.expectedCloseDate && (
              <p className="flex items-center gap-1 text-sm text-red-500 mt-1">
                <AlertCircle className="w-4 h-4" />
                {errors.expectedCloseDate}
              </p>
            )}
            <p className="text-xs text-dark-400 mt-1">Cannot select a past date</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Converting...' : 'Convert to Deal'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Main Pipeline Component
const Pipeline = () => {
  const { currentRole } = useCompany()
  const [viewType, setViewType] = useState('leads') // 'leads' or 'deals'
  const [stages, setStages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null)
  const [convertingLead, setConvertingLead] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Fetch pipeline data
  const fetchPipelineData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [kanbanRes, analyticsRes] = await Promise.all([
        pipelineAPI.getKanbanView(viewType),
        pipelineAPI.getAnalytics(30)
      ])

      if (kanbanRes.data.success) {
        setStages(kanbanRes.data.data.stages)
      }
      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data)
      }
    } catch (error) {
      console.error('Fetch pipeline error:', error)
      toast.error('Failed to load pipeline')
    } finally {
      setIsLoading(false)
    }
  }, [viewType])

  useEffect(() => {
    fetchPipelineData()
  }, [fetchPipelineData])

  // Handle drag over
  const handleDragOver = (e, stage) => {
    e.preventDefault()
  }

  // Handle drop
  const handleDrop = async (e, targetStage) => {
    e.preventDefault()
    
    try {
      const itemData = e.dataTransfer.getData('item')
      const sourceStageId = e.dataTransfer.getData('sourceStageId')
      
      if (!itemData) return
      
      const item = JSON.parse(itemData)
      
      if (sourceStageId === targetStage.id) return // Same stage, no move needed

      // Optimistically update UI
      setStages(prevStages => {
        return prevStages.map(stage => {
          if (stage.id === sourceStageId) {
            return {
              ...stage,
              [viewType]: (stage[viewType] || []).filter(i => i.id !== item.id)
            }
          }
          if (stage.id === targetStage.id) {
            return {
              ...stage,
              [viewType]: [...(stage[viewType] || []), { ...item, stageId: targetStage.id }]
            }
          }
          return stage
        })
      })

      // API call
      await pipelineAPI.moveToStage({
        entityId: item.id,
        entityType: viewType === 'leads' ? 'lead' : 'deal',
        stageId: targetStage.id
      })

      // Show success toast for closed stages
      if (targetStage.isWon) {
        toast.success('🎉 Deal Won!')
      } else if (targetStage.isClosed) {
        toast.success('Deal marked as lost')
      } else {
        toast.success(`Moved to ${targetStage.name}`)
      }

    } catch (error) {
      console.error('Move error:', error)
      toast.error('Failed to move item')
      fetchPipelineData() // Refresh to get correct state
    }
  }

  // Handle convert to deal
  const handleConvertToDeal = async (leadId, data) => {
    try {
      const response = await pipelineAPI.convertToDeal(leadId, data)
      if (response.data.success) {
        toast.success('Lead converted to deal!')
        setConvertingLead(null)
        fetchPipelineData()
      }
    } catch (error) {
      console.error('Convert error:', error)
      toast.error('Failed to convert lead')
      throw error
    }
  }

  // Handle edit
  const handleEdit = (item) => {
    // Navigate to detail page or open modal
    console.log('Edit:', item)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-500">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-dark-500">
            Drag and drop to move {viewType} between stages
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Type Toggle */}
          <div className="flex items-center bg-dark-100 dark:bg-dark-800 rounded-xl p-1">
            <button
              onClick={() => setViewType('leads')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'leads'
                  ? 'bg-white dark:bg-dark-700 shadow-sm'
                  : 'text-dark-500 hover:text-dark-700'
              }`}
            >
              <Target className="w-4 h-4 inline-block mr-2" />
              Leads
            </button>
            <button
              onClick={() => setViewType('deals')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'deals'
                  ? 'bg-white dark:bg-dark-700 shadow-sm'
                  : 'text-dark-500 hover:text-dark-700'
              }`}
            >
              <Briefcase className="w-4 h-4 inline-block mr-2" />
              Deals
            </button>
          </div>

          {/* Analytics Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-3 rounded-xl transition-colors ${
              showAnalytics 
                ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600' 
                : 'bg-dark-100 dark:bg-dark-800 hover:bg-dark-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchPipelineData}
            className="p-3 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && analytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.totalLeads}</p>
                    <p className="text-xs text-dark-500">Total Leads</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{analytics.summary.leadConversionRate}%</p>
                    <p className="text-xs text-dark-500">Win Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.summary.pipelineValue)}</p>
                    <p className="text-xs text-dark-500">Pipeline Value</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.summary.wonRevenue)}</p>
                    <p className="text-xs text-dark-500">Won Revenue (30d)</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        {stages.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-dark-500">
            <div className="text-center">
              <Kanban className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No pipeline stages found</p>
              <p className="text-sm">Stages will be created automatically</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              // Get items for this stage - handle both 'leads' and 'deals' keys
              const items = viewType === 'leads' 
                ? (stage.leads || []) 
                : (stage.deals || [])
              
              return (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  items={items}
                  type={viewType}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onConvert={(lead) => setConvertingLead(lead)}
                  onEdit={handleEdit}
                  draggedItem={draggedItem}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Convert to Deal Modal */}
      <AnimatePresence>
        {convertingLead && (
          <ConvertToDealModal
            lead={convertingLead}
            onClose={() => setConvertingLead(null)}
            onConvert={handleConvertToDeal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Pipeline

