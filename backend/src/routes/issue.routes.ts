import { Router } from 'express';
import {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  addCall,
  getCallHistory,
  getIssueStats
} from '../controllers/issue.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, adminOnly, anyRole } from '../middleware/tenant.middleware';
import { body, param } from 'express-validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Issue validators
const createIssueValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority'),
  body('category')
    .optional()
    .isIn(['BILLING', 'TECHNICAL', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER'])
    .withMessage('Invalid category')
];

const updateIssueValidator = [
  param('id').isUUID().withMessage('Invalid issue ID'),
  body('status')
    .optional()
    .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority'),
  body('resolution')
    .optional()
    .trim()
];

const addCallValidator = [
  param('id').isUUID().withMessage('Invalid issue ID'),
  body('callType')
    .optional()
    .isIn(['INBOUND', 'OUTBOUND'])
    .withMessage('Invalid call type'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive number'),
  body('status')
    .optional()
    .isIn(['COMPLETED', 'MISSED', 'NO_ANSWER', 'BUSY'])
    .withMessage('Invalid call status'),
  body('notes')
    .optional()
    .trim()
];

// Routes
router.get('/', anyRole, getIssues);
router.get('/stats', adminOnly, getIssueStats);
router.get('/:id', anyRole, getIssue);
router.post('/', createIssueValidator, validate, createIssue); // Customer only (checked in controller)
router.put('/:id', adminOnly, updateIssueValidator, validate, updateIssue);
router.delete('/:id', adminOnly, deleteIssue);

// Call routes
router.post('/:id/calls', adminOnly, addCallValidator, validate, addCall);
router.get('/:id/calls', anyRole, getCallHistory);

export default router;

