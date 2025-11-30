import { Router } from 'express';
import {
  getDashboardStats,
  getCustomerDashboard,
  getStaffDashboard
} from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, adminOnly, staffOrAdmin, anyRole } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Admin dashboard with full stats
router.get('/admin', adminOnly, getDashboardStats);

// Staff dashboard
router.get('/staff', staffOrAdmin, getStaffDashboard);

// Customer dashboard
router.get('/customer', anyRole, getCustomerDashboard);

// General stats (accessible by all roles)
router.get('/stats', anyRole, getDashboardStats);

export default router;

