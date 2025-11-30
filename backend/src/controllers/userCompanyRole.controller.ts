import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const getUserRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const roles = await prisma.userCompanyRole.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isActive: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: {
        roles: roles.map(r => ({
          id: r.id,
          companyId: r.companyId,
          company: r.company,
          role: r.role,
          joinedAt: r.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles'
    });
  }
};

export const inviteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId || req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can invite users'
      });
      return;
    }

    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
      return;
    }

    if (!Object.values(Role).includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found. They need to register first.'
      });
      return;
    }

    // Check if already has a role in this company
    const existingRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: user.id,
        companyId: req.companyId
      }
    });

    if (existingRole) {
      res.status(400).json({
        success: false,
        message: 'User already has a role in this company'
      });
      return;
    }

    // Create role
    const userCompanyRole = await prisma.userCompanyRole.create({
      data: {
        userId: user.id,
        companyId: req.companyId,
        role: role as Role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'User invited successfully',
      data: {
        member: {
          id: userCompanyRole.id,
          user: userCompanyRole.user,
          role: userCompanyRole.role,
          joinedAt: userCompanyRole.joinedAt
        }
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error inviting user'
    });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId || req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can update roles'
      });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(Role).includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
      return;
    }

    // Find the role
    const userCompanyRole = await prisma.userCompanyRole.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!userCompanyRole || userCompanyRole.companyId !== req.companyId) {
      res.status(404).json({
        success: false,
        message: 'Role not found'
      });
      return;
    }

    // Prevent demoting company owner from admin
    if (userCompanyRole.company.ownerId === userCompanyRole.userId && role !== Role.ADMIN) {
      res.status(400).json({
        success: false,
        message: 'Cannot change the role of the company owner'
      });
      return;
    }

    // Update role
    const updated = await prisma.userCompanyRole.update({
      where: { id },
      data: { role: role as Role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: {
        member: {
          id: updated.id,
          user: updated.user,
          role: updated.role,
          joinedAt: updated.joinedAt
        }
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role'
    });
  }
};

export const removeUserFromCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId || req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can remove users'
      });
      return;
    }

    const { id } = req.params;

    // Find the role
    const userCompanyRole = await prisma.userCompanyRole.findUnique({
      where: { id },
      include: {
        company: true
      }
    });

    if (!userCompanyRole || userCompanyRole.companyId !== req.companyId) {
      res.status(404).json({
        success: false,
        message: 'Role not found'
      });
      return;
    }

    // Prevent removing company owner
    if (userCompanyRole.company.ownerId === userCompanyRole.userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove the company owner'
      });
      return;
    }

    // Prevent removing yourself
    if (userCompanyRole.userId === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'You cannot remove yourself. Use leave company instead.'
      });
      return;
    }

    await prisma.userCompanyRole.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User removed from company'
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user'
    });
  }
};

export const leaveCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { companyId } = req.params;

    // Find the role
    const userCompanyRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId
      },
      include: {
        company: true
      }
    });

    if (!userCompanyRole) {
      res.status(404).json({
        success: false,
        message: 'You are not a member of this company'
      });
      return;
    }

    // Prevent owner from leaving
    if (userCompanyRole.company.ownerId === req.user.id) {
      res.status(400).json({
        success: false,
        message: 'Company owner cannot leave. Transfer ownership or delete the company.'
      });
      return;
    }

    await prisma.userCompanyRole.delete({
      where: { id: userCompanyRole.id }
    });

    res.json({
      success: true,
      message: 'Left company successfully'
    });
  } catch (error) {
    console.error('Leave company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving company'
    });
  }
};

