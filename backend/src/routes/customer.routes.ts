import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  deleteCustomer
} from '../controllers/customer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, adminOnly } from '../middleware/tenant.middleware';
import { param, query } from 'express-validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Only admins can view and manage customers
router.get('/', adminOnly, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], validate, getCustomers);

router.get('/:id', adminOnly, [
  param('id').isUUID().withMessage('Invalid customer ID')
], validate, getCustomer);

router.delete('/:id', adminOnly, [
  param('id').isUUID().withMessage('Invalid customer ID')
], validate, deleteCustomer);

export default router;
