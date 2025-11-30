import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { validateField, getCharCountText, isNearLimit, isOverLimit, getTodayDateString } from '../../utils/validation'

/**
 * Validated Input Component
 * Provides real-time validation feedback and character counting
 */
const ValidatedInput = ({
  type = 'text',
  name,
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  // Validation options
  minLength,
  maxLength,
  min,
  max,
  pattern,
  showCharCount = false,
  // Date validation
  futureOnly = false,
  allowToday = true,
  // Custom validation
  customValidation,
  // Error state (can be controlled externally)
  error: externalError,
  // Textarea specific
  rows = 1,
  as = 'input'
}) => {
  const [touched, setTouched] = useState(false)
  const [internalError, setInternalError] = useState(null)

  // Use external error if provided, otherwise use internal
  const error = externalError !== undefined ? externalError : (touched ? internalError : null)

  // Build validation rules
  const rules = {
    required,
    min: minLength || min,
    max: maxLength || max,
    pattern,
    label: label || name
  }

  // Validate on value change (after touch)
  useEffect(() => {
    if (touched) {
      const result = validateField(name, value, rules)
      
      // Custom validation
      if (result.valid && customValidation) {
        const customResult = customValidation(value)
        if (!customResult.valid) {
          setInternalError(customResult.error)
          return
        }
      }
      
      setInternalError(result.error)
    }
  }, [value, touched])

  const handleBlur = () => {
    setTouched(true)
    const result = validateField(name, value, rules)
    setInternalError(result.error)
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    
    // Enforce maxLength in real-time
    if (maxLength && newValue.length > maxLength) {
      return // Don't update if over limit
    }
    
    onChange(e)
  }

  // For date inputs, get min date
  const getMinDate = () => {
    if (futureOnly) {
      return getTodayDateString()
    }
    return undefined
  }

  const Component = as === 'textarea' ? 'textarea' : 'input'

  const inputProps = {
    type: type,
    name: name,
    value: value || '',
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder,
    disabled: disabled,
    required: required,
    minLength: minLength,
    maxLength: maxLength,
    min: type === 'date' ? getMinDate() : min,
    max: max,
    rows: as === 'textarea' ? rows : undefined,
    className: `input ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`
  }

  const showCharCounter = showCharCount && maxLength

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <label className="label">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {showCharCounter && (
            <span className={`text-xs ${
              isOverLimit(value, maxLength) 
                ? 'text-red-500 font-medium' 
                : isNearLimit(value, maxLength) 
                  ? 'text-amber-500' 
                  : 'text-dark-400'
            }`}>
              {getCharCountText(value, maxLength)}
            </span>
          )}
        </div>
      )}
      
      <Component {...inputProps} />
      
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {/* Helper text for length requirements */}
      {!error && minLength && !touched && (
        <p className="text-xs text-dark-400">
          Minimum {minLength} characters
        </p>
      )}
    </div>
  )
}

/**
 * Validated Textarea Component
 */
export const ValidatedTextarea = (props) => {
  return <ValidatedInput {...props} as="textarea" />
}

/**
 * Validated Date Input Component
 */
export const ValidatedDateInput = ({ 
  futureOnly = true, 
  allowToday = true,
  ...props 
}) => {
  return (
    <ValidatedInput 
      {...props} 
      type="date" 
      futureOnly={futureOnly}
      allowToday={allowToday}
    />
  )
}

/**
 * Validated Email Input Component
 */
export const ValidatedEmailInput = (props) => {
  return (
    <ValidatedInput 
      {...props} 
      type="email" 
      pattern="email"
      minLength={5}
      maxLength={255}
    />
  )
}

/**
 * Validated Phone Input Component
 */
export const ValidatedPhoneInput = (props) => {
  return (
    <ValidatedInput 
      {...props} 
      type="tel" 
      pattern="phone"
      minLength={10}
      maxLength={20}
      placeholder={props.placeholder || '+1 (555) 000-0000'}
    />
  )
}

export default ValidatedInput

