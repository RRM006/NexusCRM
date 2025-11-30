import { Router } from 'express';
import {
  createCompany,
  getMyCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getCompanyMembers,
  joinCompanyAsCustomer,
  searchCompanies
} from '../controllers/company.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware, adminOnly } from '../middleware/tenant.middleware';
import {
  createCompanyValidator,
  updateCompanyValidator,
  companyIdValidator
} from '../validators/company.validator';
import { validate } from '../validators/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Company management
router.post('/', createCompanyValidator, validate, createCompany);
router.get('/my', getMyCompanies);
router.get('/search', searchCompanies);
router.post('/join', joinCompanyAsCustomer);
router.get('/:id', companyIdValidator, validate, getCompany);

// Routes that require tenant context
router.put('/:id', tenantMiddleware, adminOnly, updateCompanyValidator, validate, updateCompany);
router.delete('/:id', authenticate, companyIdValidator, validate, deleteCompany);
router.get('/:id/members', tenantMiddleware, getCompanyMembers);

export default router;

