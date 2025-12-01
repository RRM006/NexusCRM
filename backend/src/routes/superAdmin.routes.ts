import { Router } from 'express';
import {
  superAdminLogin,
  verifySuperAdmin,
  getDashboardStats,
  getAllCompanies,
  getAllUsers,
  toggleCompanyStatus,
  getCompanyDetails,
  getAllIssues,
  updateIssueStatus,
  getIssueDetails
} from '../controllers/superAdmin.controller';
import { authenticateSuperAdmin } from '../middleware/superAdmin.middleware';

const router = Router();

// Public routes
router.post('/login', superAdminLogin);
router.get('/verify', verifySuperAdmin);

// Protected routes (require super admin authentication)
router.get('/dashboard', authenticateSuperAdmin, getDashboardStats);
router.get('/companies', authenticateSuperAdmin, getAllCompanies);
router.get('/companies/:companyId', authenticateSuperAdmin, getCompanyDetails);
router.patch('/companies/:companyId/toggle-status', authenticateSuperAdmin, toggleCompanyStatus);
router.get('/users', authenticateSuperAdmin, getAllUsers);

// Issues management routes
router.get('/issues', authenticateSuperAdmin, getAllIssues);
router.get('/issues/:issueId', authenticateSuperAdmin, getIssueDetails);
router.patch('/issues/:issueId/status', authenticateSuperAdmin, updateIssueStatus);

export default router;

