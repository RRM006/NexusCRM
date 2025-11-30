import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getMyTasks
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, staffOrAdmin } from '../middleware/tenant.middleware';
import {
  createTaskValidator,
  updateTaskValidator,
  idParamValidator,
  paginationValidator
} from '../validators/crm.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

router.get('/', paginationValidator, validate, getTasks);
router.get('/my', getMyTasks);
router.get('/:id', idParamValidator, validate, getTask);
router.post('/', createTaskValidator, validate, createTask);
router.put('/:id', updateTaskValidator, validate, updateTask);
router.delete('/:id', staffOrAdmin, idParamValidator, validate, deleteTask);

export default router;

