import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

// Get all issues (Admin/Staff see all, Customer sees only their own)
export const getIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: any = {
      companyId: req.companyId
    };

    // Customers can only see their own issues
    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, name: true, email: true, avatar: true, phone: true }
          },
          resolvedBy: {
            select: { id: true, name: true, avatar: true }
          },
          _count: {
            select: { calls: true }
          }
        }
      }),
      prisma.issue.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        issues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues'
    });
  }
};

// Get single issue with call history
export const getIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const where: any = {
      id,
      companyId: req.companyId
    };

    // Customers can only see their own issues
    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    const issue = await prisma.issue.findFirst({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, avatar: true, phone: true }
        },
        resolvedBy: {
          select: { id: true, name: true, avatar: true }
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          include: {
            caller: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      }
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { issue }
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue'
    });
  }
};

// Create issue (CUSTOMER ONLY)
export const createIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Only customers can create issues
    if (req.userRole !== Role.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Only customers can create issues'
      });
      return;
    }

    const { title, description, priority, category } = req.body;

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        category: category || 'GENERAL',
        customerId: req.user.id,
        companyId: req.companyId
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, avatar: true, phone: true }
        }
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        title: `New issue created: "${title}"`,
        description: `Customer ${req.user.name} created a new issue`,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating issue'
    });
  }
};

// Update issue status (ADMIN ONLY - for resolving)
export const updateIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Only admin can update/resolve issues
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can update issues'
      });
      return;
    }

    const { id } = req.params;
    const { status, resolution, priority } = req.body;

    const existing = await prisma.issue.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (resolution !== undefined) updateData.resolution = resolution;

    // If resolving the issue
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedById = req.user.id;
      updateData.resolvedAt = new Date();
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true, avatar: true, phone: true }
        },
        resolvedBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue'
    });
  }
};

// Delete issue (ADMIN ONLY)
export const deleteIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Only admin can delete issues
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can delete issues'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.issue.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    await prisma.issue.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue'
    });
  }
};

// Add call to issue (ADMIN ONLY - dummy call system)
export const addCall = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Only admin can make calls
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can log calls'
      });
      return;
    }

    const { id } = req.params;
    const { callType, duration, status, notes } = req.body;

    // Verify issue exists
    const issue = await prisma.issue.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    const call = await prisma.issueCall.create({
      data: {
        issueId: id,
        callType: callType || 'OUTBOUND',
        duration: duration || 0,
        status: status || 'COMPLETED',
        notes,
        callerId: req.user.id,
        // Generate a dummy recording URL
        recordingUrl: `https://recordings.nexuscrm.com/call-${Date.now()}.mp3`
      },
      include: {
        caller: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: { call }
    });
  } catch (error) {
    console.error('Add call error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging call'
    });
  }
};

// Get call history for an issue
export const getCallHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify issue exists and user has access
    const where: any = {
      id,
      companyId: req.companyId
    };

    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    const issue = await prisma.issue.findFirst({
      where,
      select: { id: true }
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    const calls = await prisma.issueCall.findMany({
      where: { issueId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        caller: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      data: { calls }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching call history'
    });
  }
};

// Get issue stats for dashboard
export const getIssueStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const stats = await prisma.issue.groupBy({
      by: ['status'],
      where: { companyId: req.companyId },
      _count: { id: true }
    });

    const priorityStats = await prisma.issue.groupBy({
      by: ['priority'],
      where: { companyId: req.companyId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        byStatus: stats.map(s => ({
          status: s.status,
          count: s._count.id
        })),
        byPriority: priorityStats.map(p => ({
          priority: p.priority,
          count: p._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue stats'
    });
  }
};

