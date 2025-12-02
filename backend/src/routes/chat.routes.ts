import { Router } from 'express';
import {
  startConversation,
  sendMessage,
  listConversations,
  getConversation,
  superAdminStartWithCompany,
  superAdminStartWithCustomer,
  superAdminSendMessage,
  superAdminListConversations,
  superAdminGetConversation
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  tenantMiddleware,
  anyRole
} from '../middleware/tenant.middleware';
import { authenticateSuperAdmin } from '../middleware/superAdmin.middleware';

const router = Router();

// ========== Super Admin chat ==========
// These endpoints deliberately bypass tenant middleware.
// Super Admin is authenticated separately and is not bound by companyId.
// IMPORTANT: Must be registered BEFORE the regular user routes!

const superAdminRouter = Router();
superAdminRouter.use(authenticateSuperAdmin);

superAdminRouter.post('/start-company', superAdminStartWithCompany);
superAdminRouter.post('/start-customer', superAdminStartWithCustomer);
superAdminRouter.post('/send', superAdminSendMessage);
superAdminRouter.get('/conversations', superAdminListConversations);
superAdminRouter.get('/:conversationId', superAdminGetConversation);

router.use('/super-admin', superAdminRouter);

// ========== Standard user chat ==========
// All routes require normal auth + tenant + role (ADMIN/STAFF/CUSTOMER)
router.post('/start', authenticate, tenantMiddleware, anyRole, startConversation);
router.post('/send', authenticate, tenantMiddleware, anyRole, sendMessage);
router.get('/conversations', authenticate, tenantMiddleware, anyRole, listConversations);
router.get('/:conversationId', authenticate, tenantMiddleware, anyRole, getConversation);

export default router;


