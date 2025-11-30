import { body, param, query, ValidationChain } from 'express-validator';

// Customer Validators
export const createCustomerValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('phone')
    .optional()
    .trim(),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'PENDING', 'CHURNED'])
    .withMessage('Invalid status')
];

export const updateCustomerValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid customer ID'),
  ...createCustomerValidator.map(validator => validator.optional())
];

// Lead Validators
export const createLeadValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Lead title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),

  body('value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),

  body('status')
    .optional()
    .isIn(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'])
    .withMessage('Invalid status'),

  body('source')
    .optional()
    .isIn(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'COLD_CALL', 'TRADE_SHOW', 'OTHER'])
    .withMessage('Invalid source'),

  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),

  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),

  body('assignedToId')
    .optional()
    .isUUID()
    .withMessage('Invalid assignee ID'),

  body('expectedCloseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

export const updateLeadValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid lead ID'),
  ...createLeadValidator.map(validator => validator.optional())
];

// Contact Validators
export const createContactValidator: ValidationChain[] = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('phone')
    .optional()
    .trim(),

  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),

  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),

  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean')
];

export const updateContactValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid contact ID'),
  ...createContactValidator.map(validator => validator.optional())
];

// Task Validators
export const createTaskValidator: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),

  body('description')
    .optional()
    .trim(),

  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid status'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),

  body('leadId')
    .optional()
    .isUUID()
    .withMessage('Invalid lead ID'),

  body('assignedToId')
    .optional()
    .isUUID()
    .withMessage('Invalid assignee ID')
];

export const updateTaskValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid task ID'),
  ...createTaskValidator.map(validator => validator.optional())
];

// Note Validators
export const createNoteValidator: ValidationChain[] = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Note content is required'),

  body('isPinned')
    .optional()
    .isBoolean()
    .withMessage('isPinned must be a boolean'),

  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Invalid customer ID'),

  body('leadId')
    .optional()
    .isUUID()
    .withMessage('Invalid lead ID')
];

export const updateNoteValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid note ID'),
  ...createNoteValidator.map(validator => validator.optional())
];

// Pagination Validator
export const paginationValidator: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .trim(),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// ID Parameter Validator
export const idParamValidator: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
];

