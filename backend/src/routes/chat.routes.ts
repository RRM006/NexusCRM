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

// ========== Standard user chat ==========
// All routes require normal auth + tenant + role (ADMIN/STAFF/CUSTOMER)
router.use(authenticate);
router.use(tenantMiddleware);
router.use(anyRole);

router.post('/start', startConversation);
router.post('/send', sendMessage);
router.get('/conversations', listConversations);
router.get('/:conversationId', getConversation);

// ========== Super Admin chat ==========
// These endpoints deliberately bypass tenant middleware.
// Super Admin is authenticated separately and is not bound by companyId.

const superAdminRouter = Router();
superAdminRouter.use(authenticateSuperAdmin);

superAdminRouter.post('/start-company', superAdminStartWithCompany);
superAdminRouter.post('/start-customer', superAdminStartWithCustomer);
superAdminRouter.post('/send', superAdminSendMessage);
superAdminRouter.get('/conversations', superAdminListConversations);
superAdminRouter.get('/:conversationId', superAdminGetConversation);

router.use('/super-admin', superAdminRouter);

export default router;


