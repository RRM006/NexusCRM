import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const getLeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const source = req.query.source as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: any = {
      companyId: req.companyId
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (source) where.source = source;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, name: true, email: true }
          },
          createdBy: {
            select: { id: true, name: true, avatar: true }
          },
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          },
          _count: {
            select: { tasks: true, notes: true }
          }
        }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads'
    });
  }
};

export const getLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        companyId: req.companyId
      },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, avatar: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        },
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { lead }
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead'
    });
  }
};

export const createLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { title, description, value, status, source, priority, customerId, assignedToId, expectedCloseDate } = req.body;

    const lead = await prisma.lead.create({
      data: {
        title,
        description,
        value: value || 0,
        status: status || 'NEW',
        source: source || 'OTHER',
        priority: priority || 1,
        customerId,
        assignedToId,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        companyId: req.companyId,
        createdById: req.user.id
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'LEAD_CREATED',
        title: `Lead "${title}" created`,
        leadId: lead.id,
        customerId,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lead'
    });
  }
};

export const updateLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    // Check if lead exists and belongs to company
    const existing = await prisma.lead.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    const { title, description, value, status, source, priority, customerId, assignedToId, expectedCloseDate } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = value;
    if (status) updateData.status = status;
    if (source) updateData.source = source;
    if (priority !== undefined) updateData.priority = priority;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = expectedCloseDate ? new Date(expectedCloseDate) : null;
    }

    // Handle status changes
    if (status && status !== existing.status) {
      if (status === 'WON' || status === 'LOST') {
        updateData.closedAt = new Date();
        
        // Create activity
        await prisma.activity.create({
          data: {
            type: status === 'WON' ? 'DEAL_WON' : 'DEAL_LOST',
            title: `Lead "${existing.title}" marked as ${status}`,
            leadId: id,
            customerId: existing.customerId,
            companyId: req.companyId,
            createdById: req.user.id
          }
        });
      } else {
        // Create status change activity
        await prisma.activity.create({
          data: {
            type: 'LEAD_STATUS_CHANGED',
            title: `Lead status changed from ${existing.status} to ${status}`,
            leadId: id,
            customerId: existing.customerId,
            companyId: req.companyId,
            createdById: req.user.id,
            metadata: { oldStatus: existing.status, newStatus: status }
          }
        });
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead'
    });
  }
};

export const deleteLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (req.userRole === Role.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Customers cannot delete leads'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.lead.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    await prisma.lead.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead'
    });
  }
};

export const getLeadStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const stats = await prisma.lead.groupBy({
      by: ['status'],
      where: { companyId: req.companyId },
      _count: { id: true },
      _sum: { value: true }
    });

    const totalValue = await prisma.lead.aggregate({
      where: { companyId: req.companyId },
      _sum: { value: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        byStatus: stats.map(s => ({
          status: s.status,
          count: s._count.id,
          value: s._sum.value || 0
        })),
        total: {
          count: totalValue._count.id,
          value: totalValue._sum.value || 0
        }
      }
    });
  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead stats'
    });
  }
};

