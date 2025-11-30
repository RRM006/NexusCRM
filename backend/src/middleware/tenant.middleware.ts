import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../index';
import { Role } from '@prisma/client';

// Middleware to extract and validate company context
export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const companyId = req.headers['x-company-id'] as string;

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: 'Company ID is required in X-Company-Id header'
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if user has access to this company
    const userCompanyRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId: companyId,
        isActive: true
      },
      include: {
        company: true
      }
    });

    if (!userCompanyRole) {
      res.status(403).json({
        success: false,
        message: 'You do not have access to this company'
      });
      return;
    }

    if (!userCompanyRole.company.isActive) {
      res.status(403).json({
        success: false,
        message: 'This company is inactive'
      });
      return;
    }

    req.companyId = companyId;
    req.userRole = userCompanyRole.role;

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating company access'
    });
  }
};

// Role-based access control middleware
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(403).json({
        success: false,
        message: 'Role not determined'
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const adminOnly = requireRole(Role.ADMIN);

// Staff and Admin middleware
export const staffOrAdmin = requireRole(Role.ADMIN, Role.STAFF);

// Any authenticated company member
export const anyRole = requireRole(Role.ADMIN, Role.STAFF, Role.CUSTOMER);

