import { Router } from 'express';
import {
  getActivities,
  createActivity,
  getRecentActivities
} from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { paginationValidator } from '../validators/crm.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

router.get('/', paginationValidator, validate, getActivities);
router.get('/recent', getRecentActivities);
router.post('/', createActivity);

export default router;

