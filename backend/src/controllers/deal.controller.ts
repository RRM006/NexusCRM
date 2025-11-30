import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';

/**
 * Get all deals
 */
export const getDeals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { status, stageId, ownerId, page = '1', limit = '20', search } = req.query;

    const where: any = { companyId: req.companyId };

    if (status) where.status = status;
    if (stageId) where.stageId = stageId;
    if (ownerId) where.ownerId = ownerId;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, avatar: true, email: true } },
          customer: { select: { id: true, name: true, email: true } },
          stage: true,
          _count: { select: { tasks: true, notes: true, activities: true } }
        }
      }),
      prisma.deal.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        deals,
        pagination: {
          page: parseInt(page as string),
          limit: take,
          total,
          pages: Math.ceil(total / take)
        }
      }
    });
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ success: false, message: 'Error fetching deals' });
  }
};

/**
 * Get a single deal
 */
export const getDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, companyId: req.companyId },
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } },
        stage: true,
        sourceLead: { select: { id: true, title: true, status: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { assignedTo: { select: { id: true, name: true } } }
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { createdBy: { select: { id: true, name: true } } }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, name: true } } }
        }
      }
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    res.json({ success: true, data: { deal } });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({ success: false, message: 'Error fetching deal' });
  }
};

/**
 * Create a new deal
 */
export const createDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { title, description, value, currency, customerId, stageId, expectedCloseDate } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    // Get default stage if not provided
    let dealStageId = stageId;
    let probability = 50;
    
    if (!dealStageId) {
      const defaultStage = await prisma.pipelineStage.findFirst({
        where: { companyId: req.companyId, isClosed: false },
        orderBy: { order: 'asc' }
      });
      dealStageId = defaultStage?.id;
      probability = defaultStage?.probability || 50;
    } else {
      const stage = await prisma.pipelineStage.findUnique({ where: { id: dealStageId } });
      probability = stage?.probability || 50;
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        description,
        value: value || 0,
        currency: currency || 'USD',
        stageId: dealStageId,
        probability,
        expectedRevenue: (value || 0) * (probability / 100),
        customerId,
        companyId: req.companyId,
        ownerId: req.user.id,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        customer: { select: { id: true, name: true } },
        stage: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DEAL_CREATED',
        title: 'New deal created',
        description: `${title} - $${value || 0}`,
        dealId: deal.id,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.status(201).json({ success: true, data: { deal } });
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ success: false, message: 'Error creating deal' });
  }
};

/**
 * Update a deal
 */
export const updateDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const updateData = req.body;

    const existingDeal = await prisma.deal.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existingDeal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    // If stage is changing, update probability
    if (updateData.stageId && updateData.stageId !== existingDeal.stageId) {
      const newStage = await prisma.pipelineStage.findUnique({
        where: { id: updateData.stageId }
      });
      
      if (newStage) {
        updateData.probability = newStage.probability;
        updateData.expectedRevenue = (updateData.value || existingDeal.value) * (newStage.probability / 100);
        
        if (newStage.isWon) {
          updateData.status = 'WON';
          updateData.wonAt = new Date();
          updateData.actualCloseDate = new Date();
        } else if (newStage.isClosed) {
          updateData.status = 'LOST';
          updateData.lostAt = new Date();
          updateData.actualCloseDate = new Date();
        } else {
          updateData.status = 'ACTIVE';
          updateData.wonAt = null;
          updateData.lostAt = null;
        }
      }
    }

    // If value is changing, update expected revenue
    if (updateData.value !== undefined && updateData.value !== existingDeal.value) {
      const probability = updateData.probability || existingDeal.probability;
      updateData.expectedRevenue = updateData.value * (probability / 100);
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        customer: { select: { id: true, name: true } },
        stage: true
      }
    });

    res.json({ success: true, data: { deal } });
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(500).json({ success: false, message: 'Error updating deal' });
  }
};

/**
 * Delete a deal
 */
export const deleteDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    await prisma.deal.delete({ where: { id } });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) {
    console.error('Delete deal error:', error);
    res.status(500).json({ success: false, message: 'Error deleting deal' });
  }
};

/**
 * Mark deal as won
 */
export const markAsWon = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { actualValue } = req.body;

    const deal = await prisma.deal.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    // Get won stage
    const wonStage = await prisma.pipelineStage.findFirst({
      where: { companyId: req.companyId, isWon: true }
    });

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: 'WON',
        stageId: wonStage?.id,
        wonAt: new Date(),
        actualCloseDate: new Date(),
        probability: 100,
        value: actualValue || deal.value,
        expectedRevenue: actualValue || deal.value
      },
      include: {
        owner: { select: { id: true, name: true } },
        stage: true
      }
    });

    // Update customer total spent if customer exists
    if (deal.customerId) {
      await prisma.customer.update({
        where: { id: deal.customerId },
        data: {
          totalSpent: { increment: actualValue || deal.value }
        }
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DEAL_WON',
        title: 'Deal Won! 🎉',
        description: `${deal.title} - $${actualValue || deal.value}`,
        dealId: id,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.json({ success: true, data: { deal: updatedDeal } });
  } catch (error) {
    console.error('Mark deal won error:', error);
    res.status(500).json({ success: false, message: 'Error marking deal as won' });
  }
};

/**
 * Mark deal as lost
 */
export const markAsLost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { lostReason } = req.body;

    const deal = await prisma.deal.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!deal) {
      res.status(404).json({ success: false, message: 'Deal not found' });
      return;
    }

    // Get lost stage
    const lostStage = await prisma.pipelineStage.findFirst({
      where: { companyId: req.companyId, isClosed: true, isWon: false }
    });

    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: 'LOST',
        stageId: lostStage?.id,
        lostAt: new Date(),
        actualCloseDate: new Date(),
        lostReason,
        probability: 0,
        expectedRevenue: 0
      },
      include: {
        owner: { select: { id: true, name: true } },
        stage: true
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'DEAL_LOST',
        title: 'Deal Lost',
        description: `${deal.title} - ${lostReason || 'No reason provided'}`,
        dealId: id,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.json({ success: true, data: { deal: updatedDeal } });
  } catch (error) {
    console.error('Mark deal lost error:', error);
    res.status(500).json({ success: false, message: 'Error marking deal as lost' });
  }
};

/**
 * Get deal statistics
 */
export const getDealStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    const [
      totalDeals,
      activeDeals,
      wonDeals,
      lostDeals,
      pipelineValue,
      wonValue,
      avgDealSize
    ] = await Promise.all([
      prisma.deal.count({ where: { companyId: req.companyId } }),
      prisma.deal.count({ where: { companyId: req.companyId, status: 'ACTIVE' } }),
      prisma.deal.count({ where: { companyId: req.companyId, status: 'WON', wonAt: { gte: startDate } } }),
      prisma.deal.count({ where: { companyId: req.companyId, status: 'LOST', lostAt: { gte: startDate } } }),
      prisma.deal.aggregate({
        where: { companyId: req.companyId, status: 'ACTIVE' },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { companyId: req.companyId, status: 'WON', wonAt: { gte: startDate } },
        _sum: { value: true }
      }),
      prisma.deal.aggregate({
        where: { companyId: req.companyId, status: 'WON' },
        _avg: { value: true }
      })
    ]);

    const winRate = (wonDeals + lostDeals) > 0 
      ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100) 
      : 0;

    res.json({
      success: true,
      data: {
        totalDeals,
        activeDeals,
        wonDeals,
        lostDeals,
        winRate,
        pipelineValue: pipelineValue._sum.value || 0,
        wonValue: wonValue._sum.value || 0,
        avgDealSize: Math.round(avgDealSize._avg.value || 0)
      }
    });
  } catch (error) {
    console.error('Get deal stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching deal statistics' });
  }
};

