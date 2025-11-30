import { Router } from 'express';
import {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  getKanbanView,
  moveToStage,
  reorderInStage,
  getPipelineAnalytics,
  convertLeadToDeal
} from '../controllers/pipeline.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Pipeline stages
router.get('/stages', getStages);
router.post('/stages', createStage);
router.put('/stages/:id', updateStage);
router.delete('/stages/:id', deleteStage);
router.post('/stages/reorder', reorderStages);

// Kanban view
router.get('/kanban', getKanbanView);

// Drag & drop operations
router.post('/move', moveToStage);
router.post('/reorder', reorderInStage);

// Analytics
router.get('/analytics', getPipelineAnalytics);

// Convert lead to deal
router.post('/convert/:leadId', convertLeadToDeal);

export default router;

