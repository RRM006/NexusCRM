import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Start a new call - creates a CallLog entry
 */
export const startCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { calleeId, callType = 'AUDIO', sessionId } = req.body;

    // Create call log entry
    const callLog = await prisma.callLog.create({
      data: {
        companyId,
        callerId: userId,
        calleeId: calleeId || null,
        callType,
        sessionId,
        status: 'INITIATED',
        startTime: new Date()
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        callee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Call initiated',
      data: callLog
    });
  } catch (error) {
    console.error('Error starting call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start call'
    });
  }
};

/**
 * Update call status (ringing, connected, etc.)
 */
export const updateCallStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;
    const { id } = req.params;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { status, calleeId, answerTime } = req.body;

    // Find the call log
    const existingCall = await prisma.callLog.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingCall) {
      res.status(404).json({
        success: false,
        message: 'Call not found'
      });
      return;
    }

    // Build update data
    const updateData: any = { status };
    
    if (calleeId) {
      updateData.calleeId = calleeId;
    }
    
    if (answerTime) {
      updateData.answerTime = new Date(answerTime);
    }

    const callLog = await prisma.callLog.update({
      where: { id },
      data: updateData,
      include: {
        caller: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        callee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Call status updated',
      data: callLog
    });
  } catch (error) {
    console.error('Error updating call status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call status'
    });
  }
};

/**
 * End a call - updates duration and status
 */
export const endCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;
    const { id } = req.params;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { status = 'COMPLETED', notes, durationSec } = req.body;

    // Find the call log
    const existingCall = await prisma.callLog.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!existingCall) {
      res.status(404).json({
        success: false,
        message: 'Call not found'
      });
      return;
    }

    // Calculate duration if not provided
    let finalDuration = durationSec;
    if (finalDuration === undefined && existingCall.answerTime) {
      finalDuration = Math.floor((Date.now() - existingCall.answerTime.getTime()) / 1000);
    }

    const callLog = await prisma.callLog.update({
      where: { id },
      data: {
        status,
        endTime: new Date(),
        durationSec: finalDuration || 0,
        notes
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        callee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Call ended',
      data: callLog
    });
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call'
    });
  }
};

/**
 * Get call history for the current company
 */
export const getCallHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { page = 1, limit = 20, status, userId: filterUserId } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = { companyId };
    
    if (status) {
      where.status = status;
    }
    
    if (filterUserId) {
      where.OR = [
        { callerId: filterUserId },
        { calleeId: filterUserId }
      ];
    }

    const [callLogs, total] = await Promise.all([
      prisma.callLog.findMany({
        where,
        include: {
          caller: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          callee: {
            select: { id: true, name: true, email: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.callLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        callLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history'
    });
  }
};

/**
 * Get a single call log by ID
 */
export const getCallById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;
    const { id } = req.params;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const callLog = await prisma.callLog.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        callee: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      }
    });

    if (!callLog) {
      res.status(404).json({
        success: false,
        message: 'Call not found'
      });
      return;
    }

    res.json({
      success: true,
      data: callLog
    });
  } catch (error) {
    console.error('Error getting call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call'
    });
  }
};

/**
 * Get call statistics for dashboard
 */
export const getCallStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { startDate, endDate } = req.query;

    const where: any = { companyId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalCalls,
      completedCalls,
      missedCalls,
      failedCalls,
      avgDuration
    ] = await Promise.all([
      prisma.callLog.count({ where }),
      prisma.callLog.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.callLog.count({ where: { ...where, status: 'MISSED' } }),
      prisma.callLog.count({ where: { ...where, status: 'FAILED' } }),
      prisma.callLog.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { durationSec: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalCalls,
        completedCalls,
        missedCalls,
        failedCalls,
        cancelledCalls: totalCalls - completedCalls - missedCalls - failedCalls,
        avgDurationSec: Math.round(avgDuration._avg.durationSec || 0),
        successRate: totalCalls > 0 
          ? Math.round((completedCalls / totalCalls) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error getting call stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call statistics'
    });
  }
};

/**
 * Find or create call log by session ID (used by socket server)
 */
export const findOrCreateBySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).companyId;

    if (!userId || !companyId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated or no company selected'
      });
      return;
    }

    const { sessionId, callerId, calleeId, callType = 'AUDIO' } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
      return;
    }

    // Try to find existing call log
    let callLog = await prisma.callLog.findFirst({
      where: { sessionId }
    });

    if (!callLog) {
      // Create new call log
      callLog = await prisma.callLog.create({
        data: {
          companyId,
          callerId: callerId || userId,
          calleeId,
          sessionId,
          callType,
          status: 'INITIATED',
          startTime: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: callLog
    });
  } catch (error) {
    console.error('Error finding/creating call log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process call log'
    });
  }
};

