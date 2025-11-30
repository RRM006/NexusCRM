import { Router } from 'express';
import {
  getGmailAuthUrl,
  gmailCallback,
  disconnectGmail,
  getGmailStatus,
  sendEmail,
  getInbox,
  getSent,
  getEmailById,
  deleteEmail,
  getCrmEmails,
  getEmailStats,
  trackOpen,
  trackClick,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getEmailHistory
} from '../controllers/email.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// ==================== Public Routes (Tracking) ====================
// These must be public for tracking to work from email clients
router.get('/track/open/:trackingId', trackOpen);
router.get('/track/click/:trackingCode', trackClick);

// ==================== Gmail OAuth Routes ====================
router.get('/gmail/auth-url', authenticate, getGmailAuthUrl);
router.get('/gmail/callback', gmailCallback); // Public - callback from Google
router.delete('/gmail/disconnect', authenticate, disconnectGmail);
router.get('/gmail/status', authenticate, getGmailStatus);

// ==================== Email Operations ====================
router.post('/send', authenticate, tenantMiddleware, sendEmail);
router.get('/inbox', authenticate, getInbox);
router.get('/sent', authenticate, getSent);
router.get('/message/:id', authenticate, getEmailById);
router.delete('/message/:id', authenticate, deleteEmail);

// ==================== CRM Email Records ====================
router.get('/crm', authenticate, tenantMiddleware, getCrmEmails);
router.get('/stats', authenticate, tenantMiddleware, getEmailStats);
router.get('/history/:entityType/:entityId', authenticate, tenantMiddleware, getEmailHistory);

// ==================== Email Templates ====================
router.get('/templates', authenticate, tenantMiddleware, getTemplates);
router.post('/templates', authenticate, tenantMiddleware, createTemplate);
router.put('/templates/:id', authenticate, tenantMiddleware, updateTemplate);
router.delete('/templates/:id', authenticate, tenantMiddleware, deleteTemplate);

export default router;

