import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats
} from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, staffOrAdmin } from '../middleware/tenant.middleware';
import {
  createLeadValidator,
  updateLeadValidator,
  idParamValidator,
  paginationValidator
} from '../validators/crm.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

router.get('/', paginationValidator, validate, getLeads);
router.get('/stats', getLeadStats);
router.get('/:id', idParamValidator, validate, getLead);
router.post('/', staffOrAdmin, createLeadValidator, validate, createLead);
router.put('/:id', staffOrAdmin, updateLeadValidator, validate, updateLead);
router.delete('/:id', staffOrAdmin, idParamValidator, validate, deleteLead);

export default router;

