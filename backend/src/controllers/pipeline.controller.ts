import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';

// Default pipeline stages
const DEFAULT_STAGES = [
  { name: 'New', color: '#6366f1', order: 0, isDefault: true, probability: 10 },
  { name: 'Contacted', color: '#8b5cf6', order: 1, probability: 20 },
  { name: 'Qualified', color: '#a855f7', order: 2, probability: 40 },
  { name: 'Proposal', color: '#d946ef', order: 3, probability: 60 },
  { name: 'Negotiation', color: '#ec4899', order: 4, probability: 80 },
  { name: 'Won', color: '#10b981', order: 5, isClosed: true, isWon: true, probability: 100 },
  { name: 'Lost', color: '#ef4444', order: 6, isClosed: true, isWon: false, probability: 0 },
];

/**
 * Get all pipeline stages for the company
 */
export const getStages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    let stages = await prisma.pipelineStage.findMany({
      where: { companyId: req.companyId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { leads: true, deals: true }
        }
      }
    });

    // If no stages exist, create default ones
    if (stages.length === 0) {
      await prisma.pipelineStage.createMany({
        data: DEFAULT_STAGES.map(stage => ({
          ...stage,
          companyId: req.companyId!
        }))
      });

      stages = await prisma.pipelineStage.findMany({
        where: { companyId: req.companyId },
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { leads: true, deals: true }
          }
        }
      });
    }

    res.json({ success: true, data: { stages } });
  } catch (error) {
    console.error('Get stages error:', error);
    res.status(500).json({ success: false, message: 'Error fetching pipeline stages' });
  }
};

/**
 * Create a new pipeline stage
 */
export const createStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { name, color, order, probability, isClosed, isWon } = req.body;

    // Get max order if not provided
    let stageOrder = order;
    if (stageOrder === undefined) {
      const maxOrder = await prisma.pipelineStage.aggregate({
        where: { companyId: req.companyId },
        _max: { order: true }
      });
      stageOrder = (maxOrder._max.order || 0) + 1;
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        name,
        color: color || '#6366f1',
        order: stageOrder,
        probability: probability || 0,
        isClosed: isClosed || false,
        isWon: isWon || false,
        companyId: req.companyId
      }
    });

    res.status(201).json({ success: true, data: { stage } });
  } catch (error: any) {
    console.error('Create stage error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Stage with this name already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Error creating stage' });
  }
};

/**
 * Update a pipeline stage
 */
export const updateStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;
    const { name, color, order, probability, isClosed, isWon } = req.body;

    const stage = await prisma.pipelineStage.updateMany({
      where: { id, companyId: req.companyId },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(order !== undefined && { order }),
        ...(probability !== undefined && { probability }),
        ...(isClosed !== undefined && { isClosed }),
        ...(isWon !== undefined && { isWon })
      }
    });

    if (stage.count === 0) {
      res.status(404).json({ success: false, message: 'Stage not found' });
      return;
    }

    const updated = await prisma.pipelineStage.findUnique({ where: { id } });
    res.json({ success: true, data: { stage: updated } });
  } catch (error) {
    console.error('Update stage error:', error);
    res.status(500).json({ success: false, message: 'Error updating stage' });
  }
};

/**
 * Delete a pipeline stage
 */
export const deleteStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    // Check if stage has leads or deals
    const stage = await prisma.pipelineStage.findFirst({
      where: { id, companyId: req.companyId },
      include: {
        _count: { select: { leads: true, deals: true } }
      }
    });

    if (!stage) {
      res.status(404).json({ success: false, message: 'Stage not found' });
      return;
    }

    if (stage._count.leads > 0 || stage._count.deals > 0) {
      res.status(400).json({ 
        success: false, 
        message: 'Cannot delete stage with existing leads or deals. Move them first.' 
      });
      return;
    }

    await prisma.pipelineStage.delete({ where: { id } });
    res.json({ success: true, message: 'Stage deleted' });
  } catch (error) {
    console.error('Delete stage error:', error);
    res.status(500).json({ success: false, message: 'Error deleting stage' });
  }
};

/**
 * Reorder pipeline stages
 */
export const reorderStages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { stageIds } = req.body; // Array of stage IDs in new order

    if (!Array.isArray(stageIds)) {
      res.status(400).json({ success: false, message: 'stageIds array required' });
      return;
    }

    // Update order for each stage
    await Promise.all(
      stageIds.map((id, index) =>
        prisma.pipelineStage.updateMany({
          where: { id, companyId: req.companyId },
          data: { order: index }
        })
      )
    );

    const stages = await prisma.pipelineStage.findMany({
      where: { companyId: req.companyId },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, data: { stages } });
  } catch (error) {
    console.error('Reorder stages error:', error);
    res.status(500).json({ success: false, message: 'Error reordering stages' });
  }
};

/**
 * Get pipeline Kanban view with leads/deals
 */
export const getKanbanView = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { type = 'leads' } = req.query; // 'leads' or 'deals'

    // First, ensure stages exist
    let stages = await prisma.pipelineStage.findMany({
      where: { companyId: req.companyId },
      orderBy: { order: 'asc' }
    });

    // Create default stages if none exist
    if (stages.length === 0) {
      const DEFAULT_STAGES = [
        { name: 'New', color: '#6366f1', order: 0, isDefault: true, probability: 10 },
        { name: 'Contacted', color: '#8b5cf6', order: 1, probability: 20 },
        { name: 'Qualified', color: '#a855f7', order: 2, probability: 40 },
        { name: 'Proposal', color: '#d946ef', order: 3, probability: 60 },
        { name: 'Negotiation', color: '#ec4899', order: 4, probability: 80 },
        { name: 'Won', color: '#10b981', order: 5, isClosed: true, isWon: true, probability: 100 },
        { name: 'Lost', color: '#ef4444', order: 6, isClosed: true, isWon: false, probability: 0 },
      ];

      await prisma.pipelineStage.createMany({
        data: DEFAULT_STAGES.map(stage => ({
          ...stage,
          companyId: req.companyId!
        }))
      });

      stages = await prisma.pipelineStage.findMany({
        where: { companyId: req.companyId },
        orderBy: { order: 'asc' }
      });
    }

    // Get the default stage for assigning unstaged items
    const defaultStage = stages.find(s => s.isDefault) || stages[0];

    // Auto-assign unstaged leads to default stage
    if (type === 'leads' && defaultStage) {
      await prisma.lead.updateMany({
        where: { 
          companyId: req.companyId, 
          stageId: null,
          status: { notIn: ['WON', 'LOST'] } // Don't auto-assign closed leads
        },
        data: { 
          stageId: defaultStage.id,
          stageEnteredAt: new Date()
        }
      });
    }

    // Now fetch stages with their items
    const stagesWithItems = await prisma.pipelineStage.findMany({
      where: { companyId: req.companyId },
      orderBy: { order: 'asc' },
      include: {
        leads: type === 'leads' ? {
          where: { status: { notIn: ['WON', 'LOST'] } }, // Exclude closed leads unless in Won/Lost stage
          orderBy: { stageOrder: 'asc' },
          include: {
            assignedTo: { select: { id: true, name: true, avatar: true } },
            customer: { select: { id: true, name: true } }
          }
        } : false,
        deals: type === 'deals' ? {
          orderBy: { stageOrder: 'asc' },
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
            customer: { select: { id: true, name: true } }
          }
        } : false
      }
    });

    // For Won/Lost stages, include the closed leads
    if (type === 'leads') {
      for (const stage of stagesWithItems) {
        if (stage.isClosed) {
          const closedLeads = await prisma.lead.findMany({
            where: { 
              companyId: req.companyId,
              status: stage.isWon ? 'WON' : 'LOST'
            },
            orderBy: { closedAt: 'desc' },
            take: 20, // Limit closed leads shown
            include: {
              assignedTo: { select: { id: true, name: true, avatar: true } },
              customer: { select: { id: true, name: true } }
            }
          });
          (stage as any).leads = closedLeads;
        }
      }
    }

    res.json({ success: true, data: { stages: stagesWithItems } });
  } catch (error) {
    console.error('Get Kanban view error:', error);
    res.status(500).json({ success: false, message: 'Error fetching Kanban view' });
  }
};

/**
 * Move lead/deal to a different stage (drag & drop)
 */
export const moveToStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { entityId, entityType, stageId, newOrder } = req.body;

    if (!entityId || !entityType || !stageId) {
      res.status(400).json({ success: false, message: 'entityId, entityType, and stageId required' });
      return;
    }

    // Verify stage exists and belongs to company
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: stageId, companyId: req.companyId }
    });

    if (!stage) {
      res.status(404).json({ success: false, message: 'Stage not found' });
      return;
    }

    if (entityType === 'lead') {
      const lead = await prisma.lead.findFirst({
        where: { id: entityId, companyId: req.companyId }
      });

      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found' });
        return;
      }

      const oldStageId = lead.stageId;

      // Update lead stage
      const updatedLead = await prisma.lead.update({
        where: { id: entityId },
        data: {
          stageId,
          stageOrder: newOrder || 0,
          stageEnteredAt: new Date(),
          // Update status based on stage
          status: stage.isWon ? 'WON' : stage.isClosed ? 'LOST' : lead.status,
          closedAt: stage.isClosed ? new Date() : null
        },
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          stage: true
        }
      });

      // Record stage history
      if (oldStageId !== stageId) {
        // Close previous stage history
        if (oldStageId) {
          const lastHistory = await prisma.leadStageHistory.findFirst({
            where: { leadId: entityId, stageId: oldStageId, exitedAt: null },
            orderBy: { enteredAt: 'desc' }
          });
          
          if (lastHistory) {
            const duration = Math.round(
              (new Date().getTime() - lastHistory.enteredAt.getTime()) / 60000
            );
            await prisma.leadStageHistory.update({
              where: { id: lastHistory.id },
              data: { exitedAt: new Date(), duration }
            });
          }
        }

        // Create new stage history
        await prisma.leadStageHistory.create({
          data: {
            leadId: entityId,
            stageId,
            movedById: req.user.id
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'LEAD_STAGE_CHANGED',
            title: `Lead moved to ${stage.name}`,
            description: `${lead.title} was moved to ${stage.name} stage`,
            leadId: entityId,
            companyId: req.companyId,
            createdById: req.user.id
          }
        });
      }

      res.json({ success: true, data: { lead: updatedLead } });
    } else if (entityType === 'deal') {
      const deal = await prisma.deal.findFirst({
        where: { id: entityId, companyId: req.companyId }
      });

      if (!deal) {
        res.status(404).json({ success: false, message: 'Deal not found' });
        return;
      }

      const updatedDeal = await prisma.deal.update({
        where: { id: entityId },
        data: {
          stageId,
          stageOrder: newOrder || 0,
          probability: stage.probability,
          expectedRevenue: deal.value * (stage.probability / 100),
          status: stage.isWon ? 'WON' : stage.isClosed ? 'LOST' : 'ACTIVE',
          wonAt: stage.isWon ? new Date() : null,
          lostAt: stage.isClosed && !stage.isWon ? new Date() : null,
          actualCloseDate: stage.isClosed ? new Date() : null
        },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          stage: true
        }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: stage.isWon ? 'DEAL_WON' : stage.isClosed ? 'DEAL_LOST' : 'DEAL_STAGE_CHANGED',
          title: stage.isWon ? 'Deal Won!' : stage.isClosed ? 'Deal Lost' : `Deal moved to ${stage.name}`,
          description: `${deal.title} - $${deal.value}`,
          dealId: entityId,
          companyId: req.companyId,
          createdById: req.user.id
        }
      });

      res.json({ success: true, data: { deal: updatedDeal } });
    } else {
      res.status(400).json({ success: false, message: 'Invalid entity type' });
    }
  } catch (error) {
    console.error('Move to stage error:', error);
    res.status(500).json({ success: false, message: 'Error moving to stage' });
  }
};

/**
 * Reorder items within a stage
 */
export const reorderInStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { stageId, entityType, orderedIds } = req.body;

    if (!stageId || !entityType || !Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, message: 'stageId, entityType, and orderedIds required' });
      return;
    }

    if (entityType === 'lead') {
      await Promise.all(
        orderedIds.map((id, index) =>
          prisma.lead.updateMany({
            where: { id, companyId: req.companyId, stageId },
            data: { stageOrder: index }
          })
        )
      );
    } else if (entityType === 'deal') {
      await Promise.all(
        orderedIds.map((id, index) =>
          prisma.deal.updateMany({
            where: { id, companyId: req.companyId, stageId },
            data: { stageOrder: index }
          })
        )
      );
    }

    res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    console.error('Reorder in stage error:', error);
    res.status(500).json({ success: false, message: 'Error reordering items' });
  }
};

/**
 * Get pipeline analytics
 */
export const getPipelineAnalytics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get stages with counts and values
    const stages = await prisma.pipelineStage.findMany({
      where: { companyId: req.companyId },
      orderBy: { order: 'asc' },
      include: {
        leads: {
          select: { id: true, value: true, createdAt: true }
        },
        deals: {
          select: { id: true, value: true, status: true, wonAt: true, lostAt: true }
        }
      }
    });

    // Calculate stage metrics
    const stageMetrics = stages.map(stage => {
      const totalLeads = stage.leads.length;
      const totalDeals = stage.deals.length;
      const totalValue = stage.leads.reduce((sum, l) => sum + l.value, 0) +
                         stage.deals.reduce((sum, d) => sum + d.value, 0);
      
      return {
        id: stage.id,
        name: stage.name,
        color: stage.color,
        order: stage.order,
        leadCount: totalLeads,
        dealCount: totalDeals,
        totalValue,
        probability: stage.probability
      };
    });

    // Calculate conversion rates
    const totalLeads = await prisma.lead.count({
      where: { companyId: req.companyId, createdAt: { gte: startDate } }
    });

    const wonLeads = await prisma.lead.count({
      where: { companyId: req.companyId, status: 'WON', closedAt: { gte: startDate } }
    });

    const lostLeads = await prisma.lead.count({
      where: { companyId: req.companyId, status: 'LOST', closedAt: { gte: startDate } }
    });

    const totalDeals = await prisma.deal.count({
      where: { companyId: req.companyId, createdAt: { gte: startDate } }
    });

    const wonDeals = await prisma.deal.count({
      where: { companyId: req.companyId, status: 'WON', wonAt: { gte: startDate } }
    });

    // Pipeline value
    const pipelineValue = await prisma.lead.aggregate({
      where: { companyId: req.companyId, status: { notIn: ['WON', 'LOST'] } },
      _sum: { value: true }
    });

    const dealPipelineValue = await prisma.deal.aggregate({
      where: { companyId: req.companyId, status: 'ACTIVE' },
      _sum: { value: true }
    });

    // Average time in stage (from stage history)
    const stageHistory = await prisma.leadStageHistory.groupBy({
      by: ['stageId'],
      where: { lead: { companyId: req.companyId }, duration: { not: null } },
      _avg: { duration: true }
    });

    const avgTimeInStage = stageHistory.reduce((acc, h) => {
      acc[h.stageId] = Math.round(h._avg.duration || 0);
      return acc;
    }, {} as Record<string, number>);

    // Won revenue
    const wonRevenue = await prisma.deal.aggregate({
      where: { companyId: req.companyId, status: 'WON', wonAt: { gte: startDate } },
      _sum: { value: true }
    });

    res.json({
      success: true,
      data: {
        stageMetrics,
        summary: {
          totalLeads,
          wonLeads,
          lostLeads,
          leadConversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
          totalDeals,
          wonDeals,
          dealWinRate: totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0,
          pipelineValue: (pipelineValue._sum.value || 0) + (dealPipelineValue._sum.value || 0),
          wonRevenue: wonRevenue._sum.value || 0
        },
        avgTimeInStage
      }
    });
  } catch (error) {
    console.error('Get pipeline analytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

/**
 * Convert lead to deal
 */
export const convertLeadToDeal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId || !req.user) {
      res.status(400).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { leadId } = req.params;
    const { value, expectedCloseDate } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId: req.companyId },
      include: { customer: true, stage: true }
    });

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    if (lead.convertedToDealId) {
      res.status(400).json({ success: false, message: 'Lead already converted to deal' });
      return;
    }

    // Get the first active stage for deals (not closed)
    const dealStage = await prisma.pipelineStage.findFirst({
      where: { companyId: req.companyId, isClosed: false },
      orderBy: { order: 'asc' }
    });

    // Create the deal
    const deal = await prisma.deal.create({
      data: {
        title: lead.title,
        description: lead.description,
        value: value || lead.value,
        currency: 'USD',
        stageId: dealStage?.id,
        probability: dealStage?.probability || 50,
        expectedRevenue: (value || lead.value) * ((dealStage?.probability || 50) / 100),
        customerId: lead.customerId,
        companyId: req.companyId,
        ownerId: req.user.id,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : lead.expectedCloseDate
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        customer: { select: { id: true, name: true } },
        stage: true
      }
    });

    // Update lead with deal reference and mark as won
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        convertedToDealId: deal.id,
        status: 'WON',
        closedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'LEAD_CONVERTED',
        title: 'Lead converted to Deal',
        description: `${lead.title} was converted to a deal worth $${deal.value}`,
        leadId,
        dealId: deal.id,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.status(201).json({ success: true, data: { deal } });
  } catch (error) {
    console.error('Convert lead to deal error:', error);
    res.status(500).json({ success: false, message: 'Error converting lead to deal' });
  }
};

