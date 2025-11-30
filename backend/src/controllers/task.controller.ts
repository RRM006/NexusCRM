import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedToId = req.query.assignedToId as string;
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
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, name: true }
          },
          lead: {
            select: { id: true, title: true }
          },
          createdBy: {
            select: { id: true, name: true, avatar: true }
          },
          assignedTo: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

export const getTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId: req.companyId
      },
      include: {
        customer: true,
        lead: true,
        createdBy: {
          select: { id: true, name: true, avatar: true }
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { title, description, status, priority, dueDate, customerId, leadId, assignedToId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        customerId,
        leadId,
        assignedToId,
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
        },
        assignedTo: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    const { title, description, status, priority, dueDate, customerId, leadId, assignedToId } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (leadId !== undefined) updateData.leadId = leadId;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;

    // Handle completion
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
      
      // Create activity
      await prisma.activity.create({
        data: {
          type: 'TASK_COMPLETED',
          title: `Task "${existing.title}" completed`,
          customerId: existing.customerId,
          leadId: existing.leadId,
          companyId: req.companyId,
          createdById: req.user.id
        }
      });
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, title: true }
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
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (req.userRole === Role.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Customers cannot delete tasks'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.task.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Task not found'
      });
      return;
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

export const getMyTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: {
        companyId: req.companyId,
        assignedToId: req.user.id,
        status: { not: 'COMPLETED' }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      include: {
        customer: {
          select: { id: true, name: true }
        },
        lead: {
          select: { id: true, title: true }
        }
      },
      take: 20
    });

    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

