import { Router } from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/note.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, staffOrAdmin } from '../middleware/tenant.middleware';
import {
  createNoteValidator,
  updateNoteValidator,
  idParamValidator,
  paginationValidator
} from '../validators/crm.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

router.get('/', paginationValidator, validate, getNotes);
router.get('/:id', idParamValidator, validate, getNote);
router.post('/', createNoteValidator, validate, createNote);
router.put('/:id', updateNoteValidator, validate, updateNote);
router.delete('/:id', staffOrAdmin, idParamValidator, validate, deleteNote);

export default router;

