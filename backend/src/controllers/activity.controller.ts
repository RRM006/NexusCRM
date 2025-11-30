import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';

export const getActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const customerId = req.query.customerId as string;
    const leadId = req.query.leadId as string;

    const where: any = {
      companyId: req.companyId
    };

    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true }
          },
          lead: {
            select: { id: true, title: true }
          },
          createdBy: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities'
    });
  }
};

export const createActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { type, title, description, metadata, customerId, leadId } = req.body;

    const activity = await prisma.activity.create({
      data: {
        type,
        title,
        description,
        metadata,
        customerId,
        leadId,
        companyId: req.companyId,
        createdById: req.user.id
      },
      include: {
        customer: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity }
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating activity'
    });
  }
};

export const getRecentActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await prisma.activity.findMany({
      where: {
        companyId: req.companyId
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities'
    });
  }
};

