import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import {
  linearService,
  LinearApiError,
  PRIORITY_LABEL_MAP,
  LINEAR_PRIORITY_MAP,
} from '../services/linear.service';

/**
 * Map Linear status type to legacy status for frontend compatibility
 */
function mapLinearStatusToLegacy(stateType: string): string {
  const statusMap: Record<string, string> = {
    triage: 'OPEN',
    backlog: 'OPEN',
    unstarted: 'OPEN',
    started: 'IN_PROGRESS',
    completed: 'RESOLVED',
    canceled: 'CLOSED',
  };
  return statusMap[stateType] || 'OPEN';
}

/**
 * Transform Linear issue to frontend-compatible format
 */
function transformLinearIssue(linearIssue: any, externalIssue?: any) {
  return {
    id: externalIssue?.id || linearIssue.id,
    linearIssueId: linearIssue.id,
    identifier: linearIssue.identifier,
    title: linearIssue.title,
    description: linearIssue.description || '',
    status: mapLinearStatusToLegacy(linearIssue.state?.type || 'unstarted'),
    linearStatus: linearIssue.state?.name || 'Unknown',
    priority: PRIORITY_LABEL_MAP[linearIssue.priority] || 'No Priority',
    priorityLevel: linearIssue.priority,
    linearUrl: linearIssue.url,
    labels: linearIssue.labels?.nodes || [],
    createdAt: linearIssue.createdAt,
    updatedAt: linearIssue.updatedAt,
    // Include local tracking data if available
    tenantId: externalIssue?.tenantId,
    createdById: externalIssue?.createdById,
  };
}

/**
 * GET /issues - Get all issues
 * Fetches from Linear API if configured, otherwise from local database
 */
export const getIssues = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const bypassCache = req.query.refresh === 'true';

    // Check if Linear is configured
    if (linearService.isConfigured()) {
      // === LINEAR MODE ===
      // Build filter based on status (only if status is a valid non-empty string)
      let filter: any = undefined;
      if (status && status.trim() !== '') {
        const statusTypeMap: Record<string, string[]> = {
          OPEN: ['triage', 'backlog', 'unstarted'],
          IN_PROGRESS: ['started'],
          RESOLVED: ['completed'],
          CLOSED: ['canceled'],
        };
        if (statusTypeMap[status]) {
          filter = { state: { type: { in: statusTypeMap[status] } } };
        }
      }

      console.log('[Issues] Fetching from Linear for company:', req.companyId);

      // Fetch issues from Linear
      const { issues: linearIssues } = await linearService.getIssues({
        first: 100, // Fetch more to allow filtering
        filter,
        bypassCache,
      });
      
      console.log('[Issues] Fetched', linearIssues.length, 'issues from Linear');

      // Get local ExternalIssue records for this tenant
      const externalIssues = await prisma.externalIssue.findMany({
        where: { tenantId: req.companyId },
      });

      const externalIssueMap = new Map(
        externalIssues.map((ei) => [ei.linearIssueId, ei])
      );

      // Transform and filter issues
      let transformedIssues = linearIssues.map((li) =>
        transformLinearIssue(li, externalIssueMap.get(li.id))
      );

      // For CUSTOMER role, only show issues they created (tracked in ExternalIssue)
      if (req.userRole === Role.CUSTOMER) {
        const userExternalIssueIds = externalIssues
          .filter((ei) => ei.createdById === req.user!.id)
          .map((ei) => ei.linearIssueId);
        
        transformedIssues = transformedIssues.filter((issue) =>
          userExternalIssueIds.includes(issue.linearIssueId)
        );
      }

      // Apply pagination
      const total = transformedIssues.length;
      const startIndex = (page - 1) * limit;
      const paginatedIssues = transformedIssues.slice(startIndex, startIndex + limit);

      res.json({
        success: true,
        data: {
          issues: paginatedIssues,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          source: 'linear'
        },
      });
      return;
    }

    // === LOCAL/LEGACY MODE (no Linear) ===
    console.log('[Issues] Linear not configured, using local database');
    
    const where: any = { companyId: req.companyId };
    
    // Filter by status if provided
    if (status && status.trim() !== '') {
      where.status = status;
    }
    
    // For CUSTOMER role, only show their own issues
    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, email: true }
          },
          resolvedBy: {
            select: { name: true }
          }
        }
      }),
      prisma.issue.count({ where })
    ]);

    // Transform to frontend-compatible format
    const transformedIssues = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      resolvedAt: issue.resolvedAt,
      resolution: issue.resolution,
      customer: issue.customer,
      resolvedBy: issue.resolvedBy,
      // For legacy issues, use empty string for Linear fields
      linearIssueId: null,
      linearUrl: null,
      identifier: `ISSUE-${issue.id.slice(0, 8).toUpperCase()}`,
    }));

    res.json({
      success: true,
      data: {
        issues: transformedIssues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        source: 'local'
      },
    });
  } catch (error) {
    console.error('Get issues error:', error);

    if (error instanceof LinearApiError) {
      const statusCode = error.code === 'RATE_LIMITED' ? 429 : 
                         error.code === 'UNAUTHORIZED' ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
    });
  }
};

/**
 * GET /issues/:id - Get single issue
 * Fetches from Linear if configured, otherwise from local database
 */
export const getIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Check if Linear is configured
    if (linearService.isConfigured()) {
      // === LINEAR MODE ===
      // First, try to find in our ExternalIssue table
      let externalIssue = await prisma.externalIssue.findFirst({
        where: {
          OR: [
            { id },
            { linearIssueId: id },
          ],
          tenantId: req.companyId,
        },
      });

      // Get the Linear issue ID
      const linearIssueId = externalIssue?.linearIssueId || id;

      // Fetch from Linear
      const linearIssue = await linearService.getIssue(linearIssueId);

      // Check access for customers
      if (req.userRole === Role.CUSTOMER && externalIssue?.createdById !== req.user.id) {
        res.status(404).json({
          success: false,
          message: 'Issue not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          issue: transformLinearIssue(linearIssue, externalIssue),
          source: 'linear'
        },
      });
      return;
    }

    // === LOCAL/LEGACY MODE ===
    const where: any = { id, companyId: req.companyId };
    
    // For CUSTOMER role, only show their own issues
    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    const issue = await prisma.issue.findFirst({
      where,
      include: {
        customer: {
          select: { name: true, email: true }
        },
        resolvedBy: {
          select: { name: true }
        }
      }
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        issue: {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          category: issue.category,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          resolvedAt: issue.resolvedAt,
          resolution: issue.resolution,
          customer: issue.customer,
          resolvedBy: issue.resolvedBy,
          identifier: `ISSUE-${issue.id.slice(0, 8).toUpperCase()}`,
        },
        source: 'local'
      },
    });
  } catch (error) {
    console.error('Get issue error:', error);

    if (error instanceof LinearApiError) {
      res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching issue',
    });
  }
};

/**
 * POST /issues - Create issue
 * Creates in Linear if configured, otherwise in local database
 */
export const createIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { title, description, priority, category } = req.body;
    const roleLabel = req.userRole === Role.CUSTOMER ? 'Customer' : 'Admin';

    // Check if Linear is configured
    if (linearService.isConfigured()) {
      // === LINEAR MODE ===
      // Build description with metadata for Linear
      const fullDescription = [
        description,
        '',
        '---',
        `**Category:** ${category || 'GENERAL'}`,
        `**Created by:** ${req.user.name} (${req.user.email}) [${roleLabel}]`,
        `**Tenant:** ${req.companyId}`,
      ].join('\n');

      // Create issue in Linear
      const linearIssue = await linearService.createIssue({
        title,
        description: fullDescription,
        priority: priority as keyof typeof LINEAR_PRIORITY_MAP,
      });

      // Save reference in our database
      const externalIssue = await prisma.externalIssue.create({
        data: {
          linearIssueId: linearIssue.id,
          linearUrl: linearIssue.url,
          title: linearIssue.title,
          description: description || null,
          status: linearIssue.state?.name || 'Todo',
          priority: linearIssue.priority,
          createdById: req.user.id,
          tenantId: req.companyId,
        },
      });

      // Create activity record
      await prisma.activity.create({
        data: {
          type: 'OTHER',
          title: `New issue created: "${title}"`,
          description: `${roleLabel} ${req.user.name} created a new issue (Linear: ${linearIssue.identifier})`,
          companyId: req.companyId,
          createdById: req.user.id,
          metadata: {
            linearIssueId: linearIssue.id,
            linearUrl: linearIssue.url,
            linearIdentifier: linearIssue.identifier,
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Issue created successfully',
        data: {
          issue: transformLinearIssue(linearIssue, externalIssue),
          source: 'linear'
        },
      });
      return;
    }

    // === LOCAL/LEGACY MODE (no Linear) ===
    console.log('[Issues] Creating issue in local database (Linear not configured)');
    
    const issue = await prisma.issue.create({
      data: {
        title,
        description: description || '',
        category: (category as any) || 'GENERAL',
        priority: (priority as any) || 'MEDIUM',
        status: 'OPEN',
        customerId: req.user.id,
        companyId: req.companyId,
      },
      include: {
        customer: {
          select: { name: true, email: true }
        }
      }
    });

    // Create activity record
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        title: `New issue created: "${title}"`,
        description: `${roleLabel} ${req.user.name} created a new issue`,
        companyId: req.companyId,
        createdById: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: {
        issue: {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          category: issue.category,
          createdAt: issue.createdAt,
          customer: issue.customer,
          identifier: `ISSUE-${issue.id.slice(0, 8).toUpperCase()}`,
        },
        source: 'local'
      },
    });
  } catch (error) {
    console.error('Create issue error:', error);

    if (error instanceof LinearApiError) {
      const statusCode = error.code === 'RATE_LIMITED' ? 429 :
                         error.code === 'UNAUTHORIZED' ? 401 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error creating issue',
    });
  }
};

/**
 * PUT /issues/:id - Update issue status in Linear
 */
export const updateIssue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!linearService.isConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Linear integration is not configured',
      });
      return;
    }

    // Only admin can update/resolve issues
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can update issues',
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    // Find the external issue
    const externalIssue = await prisma.externalIssue.findFirst({
      where: {
        OR: [
          { id },
          { linearIssueId: id },
        ],
        tenantId: req.companyId,
      },
    });

    if (!externalIssue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
      return;
    }

    // Get workflow states to find the right state ID
    const workflowStates = await linearService.getWorkflowStates();
    
    // Map our status to Linear state type
    const statusTypeMap: Record<string, string> = {
      OPEN: 'unstarted',
      IN_PROGRESS: 'started',
      RESOLVED: 'completed',
      CLOSED: 'canceled',
    };

    const targetStateType = statusTypeMap[status];
    const targetState = workflowStates.find((s) => s.type === targetStateType);

    if (!targetState) {
      res.status(400).json({
        success: false,
        message: `Cannot map status "${status}" to a Linear workflow state`,
      });
      return;
    }

    // Update in Linear
    const updatedLinearIssue = await linearService.updateIssueState(
      externalIssue.linearIssueId,
      targetState.id
    );

    // Update local record
    await prisma.externalIssue.update({
      where: { id: externalIssue.id },
      data: {
        status: updatedLinearIssue.state?.name || status,
      },
    });

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: {
        issue: transformLinearIssue(updatedLinearIssue, externalIssue),
      },
    });
  } catch (error) {
    console.error('Update issue error:', error);

    if (error instanceof LinearApiError) {
      res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error updating issue',
    });
  }
};

/**
 * DELETE /issues/:id - Delete local reference (Linear issue remains)
 * Note: We don't delete the Linear issue, just our local reference
 */
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
        message: 'Only admins can delete issues',
      });
      return;
    }

    const { id } = req.params;

    const externalIssue = await prisma.externalIssue.findFirst({
      where: {
        OR: [
          { id },
          { linearIssueId: id },
        ],
        tenantId: req.companyId,
      },
    });

    if (!externalIssue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
      return;
    }

    // Delete local reference only
    await prisma.externalIssue.delete({
      where: { id: externalIssue.id },
    });

    res.json({
      success: true,
      message: 'Issue reference deleted successfully (Linear issue preserved)',
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue',
    });
  }
};

/**
 * GET /issues/stats - Get issue statistics
 * Combines Linear data with local tracking
 */
export const getIssueStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (!linearService.isConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Linear integration is not configured',
      });
      return;
    }

    // Fetch issues from Linear
    const { issues: linearIssues } = await linearService.getIssues({ first: 100 });

    // Get local external issues for this tenant
    const externalIssues = await prisma.externalIssue.findMany({
      where: { tenantId: req.companyId },
    });

    const tenantLinearIds = new Set(externalIssues.map((ei) => ei.linearIssueId));
    
    // Filter to only issues belonging to this tenant
    const tenantIssues = linearIssues.filter((li) => tenantLinearIds.has(li.id));

    // Count by status
    const statusCounts: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };

    const priorityCounts: Record<string, number> = {
      Urgent: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      'No Priority': 0,
    };

    for (const issue of tenantIssues) {
      const status = mapLinearStatusToLegacy(issue.state?.type || 'unstarted');
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const priority = PRIORITY_LABEL_MAP[issue.priority] || 'No Priority';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        byStatus: Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
        })),
        byPriority: Object.entries(priorityCounts)
          .filter(([_, count]) => count > 0)
          .map(([priority, count]) => ({
            priority,
            count,
          })),
        total: tenantIssues.length,
      },
    });
  } catch (error) {
    console.error('Get issue stats error:', error);

    if (error instanceof LinearApiError) {
      res.status(500).json({
        success: false,
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching issue stats',
    });
  }
};

/**
 * GET /issues/workflow-states - Get available Linear workflow states
 */
export const getWorkflowStates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!linearService.isConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Linear integration is not configured',
      });
      return;
    }

    const states = await linearService.getWorkflowStates();

    res.json({
      success: true,
      data: { states },
    });
  } catch (error) {
    console.error('Get workflow states error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow states',
    });
  }
};

// ============== LEGACY CALL ENDPOINTS (kept for backwards compatibility) ==============
// These still use the old Issue model - you may want to migrate or remove these

/**
 * POST /issues/:id/calls - Add call to legacy issue
 */
export const addCall = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can log calls',
      });
      return;
    }

    const { id } = req.params;
    const { callType, duration, status, notes } = req.body;

    // Check legacy Issue table
    const issue = await prisma.issue.findFirst({
      where: { id, companyId: req.companyId },
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Legacy issue not found. Call logging is only available for old issues.',
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
        recordingUrl: `https://recordings.nexuscrm.com/call-${Date.now()}.mp3`,
      },
      include: {
        caller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: { call },
    });
  } catch (error) {
    console.error('Add call error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging call',
    });
  }
};

/**
 * GET /issues/:id/calls - Get call history for legacy issue
 */
export const getCallHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const where: any = {
      id,
      companyId: req.companyId,
    };

    if (req.userRole === Role.CUSTOMER) {
      where.customerId = req.user.id;
    }

    const issue = await prisma.issue.findFirst({
      where,
      select: { id: true },
    });

    if (!issue) {
      res.status(404).json({
        success: false,
        message: 'Legacy issue not found',
      });
      return;
    }

    const calls = await prisma.issueCall.findMany({
      where: { issueId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        caller: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.json({
      success: true,
      data: { calls },
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching call history',
    });
  }
};
