/**
 * Form Validation Utilities
 */

// Validation rules configuration
export const VALIDATION_RULES = {
  // Text fields
  title: { min: 3, max: 100, required: true, label: 'Title' },
  name: { min: 2, max: 100, required: true, label: 'Name' },
  firstName: { min: 2, max: 50, required: true, label: 'First Name' },
  lastName: { min: 2, max: 50, required: true, label: 'Last Name' },
  description: { min: 0, max: 1000, required: false, label: 'Description' },
  content: { min: 1, max: 5000, required: true, label: 'Content' },
  
  // Email & Phone
  email: { min: 5, max: 255, required: true, pattern: 'email', label: 'Email' },
  phone: { min: 10, max: 20, required: false, pattern: 'phone', label: 'Phone' },
  
  // Business fields
  company: { min: 2, max: 100, required: false, label: 'Company' },
  jobTitle: { min: 2, max: 100, required: false, label: 'Job Title' },
  department: { min: 2, max: 100, required: false, label: 'Department' },
  address: { min: 5, max: 255, required: false, label: 'Address' },
  
  // Numbers
  value: { min: 0, max: 999999999, required: false, label: 'Value' },
  priority: { min: 1, max: 5, required: false, label: 'Priority' },
  
  // Password
  password: { min: 6, max: 100, required: true, label: 'Password' },
}

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Phone regex pattern (allows various formats)
const PHONE_REGEX = /^[\d\s\-\+\(\)]{10,20}$/

/**
 * Validate a single field
 */
export const validateField = (fieldName, value, customRules = {}) => {
  const rules = { ...VALIDATION_RULES[fieldName], ...customRules }
  const errors = []

  // Convert value to string for length checks
  const strValue = value?.toString()?.trim() || ''

  // Required check
  if (rules.required && !strValue) {
    return { valid: false, error: `${rules.label || fieldName} is required` }
  }

  // If not required and empty, skip other validations
  if (!rules.required && !strValue) {
    return { valid: true, error: null }
  }

  // Min length check
  if (rules.min !== undefined && strValue.length < rules.min) {
    return { 
      valid: false, 
      error: `${rules.label || fieldName} must be at least ${rules.min} characters` 
    }
  }

  // Max length check
  if (rules.max !== undefined && strValue.length > rules.max) {
    return { 
      valid: false, 
      error: `${rules.label || fieldName} must be less than ${rules.max} characters` 
    }
  }

  // Pattern checks
  if (rules.pattern === 'email' && !EMAIL_REGEX.test(strValue)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  if (rules.pattern === 'phone' && strValue && !PHONE_REGEX.test(strValue)) {
    return { valid: false, error: 'Please enter a valid phone number' }
  }

  // Number range checks
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      return { 
        valid: false, 
        error: `${rules.label || fieldName} must be at least ${rules.min}` 
      }
    }
    if (rules.max !== undefined && value > rules.max) {
      return { 
        valid: false, 
        error: `${rules.label || fieldName} must be less than ${rules.max}` 
      }
    }
  }

  return { valid: true, error: null }
}

/**
 * Validate date is not in the past
 */
export const validateFutureDate = (dateString, allowToday = true) => {
  if (!dateString) return { valid: true, error: null }
  
  const selectedDate = new Date(dateString)
  selectedDate.setHours(0, 0, 0, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (allowToday) {
    if (selectedDate < today) {
      return { valid: false, error: 'Date cannot be in the past' }
    }
  } else {
    if (selectedDate <= today) {
      return { valid: false, error: 'Date must be in the future' }
    }
  }
  
  return { valid: true, error: null }
}

/**
 * Get today's date in YYYY-MM-DD format for min attribute
 */
export const getTodayDateString = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * Validate an entire form
 */
export const validateForm = (formData, fieldConfigs) => {
  const errors = {}
  let isValid = true

  for (const [fieldName, config] of Object.entries(fieldConfigs)) {
    const value = formData[fieldName]
    const result = validateField(fieldName, value, config)
    
    if (!result.valid) {
      errors[fieldName] = result.error
      isValid = false
    }
    
    // Date validation for future dates
    if (config.futureDate && value) {
      const dateResult = validateFutureDate(value, config.allowToday !== false)
      if (!dateResult.valid) {
        errors[fieldName] = dateResult.error
        isValid = false
      }
    }
  }

  return { isValid, errors }
}

/**
 * Get character count display text
 */
export const getCharCountText = (value, maxLength) => {
  const currentLength = value?.length || 0
  return `${currentLength}/${maxLength}`
}

/**
 * Check if character count is near limit (for warning styling)
 */
export const isNearLimit = (value, maxLength, threshold = 0.9) => {
  const currentLength = value?.length || 0
  return currentLength >= maxLength * threshold
}

/**
 * Check if character count exceeds limit
 */
export const isOverLimit = (value, maxLength) => {
  const currentLength = value?.length || 0
  return currentLength > maxLength
}

