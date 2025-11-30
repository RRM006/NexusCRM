import { Router } from 'express';
import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  markAsWon,
  markAsLost,
  getDealStats
} from '../controllers/deal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Deal CRUD
router.get('/', getDeals);
router.get('/stats', getDealStats);
router.get('/:id', getDeal);
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

// Deal actions
router.post('/:id/won', markAsWon);
router.post('/:id/lost', markAsLost);

export default router;

