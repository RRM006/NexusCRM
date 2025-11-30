import { Router } from 'express';
import {
  getUserRoles,
  inviteUser,
  updateUserRole,
  removeUserFromCompany,
  leaveCompany
} from '../controllers/userCompanyRole.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, adminOnly } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's roles across all companies
router.get('/my-roles', getUserRoles);

// Leave a company
router.delete('/leave/:companyId', leaveCompany);

// Tenant-specific routes (require company context)
router.post('/invite', tenantMiddleware, adminOnly, inviteUser);
router.put('/:id', tenantMiddleware, adminOnly, updateUserRole);
router.delete('/:id', tenantMiddleware, adminOnly, removeUserFromCompany);

export default router;

