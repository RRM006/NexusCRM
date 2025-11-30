import { Router } from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, staffOrAdmin } from '../middleware/tenant.middleware';
import {
  createContactValidator,
  updateContactValidator,
  idParamValidator,
  paginationValidator
} from '../validators/crm.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

router.get('/', paginationValidator, validate, getContacts);
router.get('/:id', idParamValidator, validate, getContact);
router.post('/', staffOrAdmin, createContactValidator, validate, createContact);
router.put('/:id', staffOrAdmin, updateContactValidator, validate, updateContact);
router.delete('/:id', staffOrAdmin, idParamValidator, validate, deleteContact);

export default router;

