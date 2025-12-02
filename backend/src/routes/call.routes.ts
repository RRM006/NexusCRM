import { Router } from 'express';
import {
  startCall,
  updateCallStatus,
  endCall,
  getCallHistory,
  getCallById,
  getCallStats,
  findOrCreateBySession
} from '../controllers/call.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and company access
router.use(authenticate);
router.use(tenantMiddleware);

// Call management
router.post('/start', startCall);
router.put('/:id/status', updateCallStatus);
router.put('/:id/end', endCall);
router.post('/session', findOrCreateBySession);

// Call history
router.get('/history', getCallHistory);
router.get('/stats', getCallStats);
router.get('/:id', getCallById);

export default router;

