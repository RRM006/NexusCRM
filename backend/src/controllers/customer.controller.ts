import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

// Get all customers (users who joined as CUSTOMER role)
export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'joinedAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: any = {
      companyId: req.companyId,
      role: Role.CUSTOMER,
      isActive: true
    };

    // Search in user's name or email
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [customerRoles, total] = await Promise.all([
      prisma.userCompanyRole.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              bio: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.userCompanyRole.count({ where })
    ]);

    // Transform data to customer format
    const customers = customerRoles.map(cr => ({
      id: cr.id, // UserCompanyRole ID
      oderId: cr.userId, // User ID
      name: cr.user.name,
      email: cr.user.email,
      phone: cr.user.phone,
      avatar: cr.user.avatar,
      bio: cr.user.bio,
      joinedAt: cr.joinedAt,
      userCreatedAt: cr.user.createdAt,
      role: cr.role
    }));

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
};

// Get single customer details
export const getCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const customerRole = await prisma.userCompanyRole.findFirst({
      where: {
        id,
        companyId: req.companyId,
        role: Role.CUSTOMER
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            bio: true,
            createdAt: true,
            createdIssues: {
              where: { companyId: req.companyId },
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                _count: { select: { calls: true } }
              }
            }
          }
        }
      }
    });

    if (!customerRole) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    const customer = {
      id: customerRole.id,
      userId: customerRole.userId,
      name: customerRole.user.name,
      email: customerRole.user.email,
      phone: customerRole.user.phone,
      avatar: customerRole.user.avatar,
      bio: customerRole.user.bio,
      joinedAt: customerRole.joinedAt,
      userCreatedAt: customerRole.user.createdAt,
      issues: customerRole.user.createdIssues
    };

    res.json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
};

// Remove customer from company (remove their CUSTOMER role)
export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    // Only admin can remove customers
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can remove customers'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.userCompanyRole.findFirst({
      where: {
        id,
        companyId: req.companyId,
        role: Role.CUSTOMER
      }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
      return;
    }

    await prisma.userCompanyRole.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Customer removed from company successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing customer'
    });
  }
};

// These are no longer needed but kept for backwards compatibility
export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(400).json({
    success: false,
    message: 'Manual customer creation is not allowed. Customers must join the company themselves.'
  });
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(400).json({
    success: false,
    message: 'Customer profiles are managed by users themselves.'
  });
};
