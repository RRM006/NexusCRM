import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const getNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const customerId = req.query.customerId as string;
    const leadId = req.query.leadId as string;
    const isPinned = req.query.isPinned === 'true';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: any = {
      companyId: req.companyId
    };

    if (customerId) where.customerId = customerId;
    if (leadId) where.leadId = leadId;
    if (req.query.isPinned !== undefined) where.isPinned = isPinned;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { [sortBy]: sortOrder }
        ],
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
      prisma.note.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes'
    });
  }
};

export const getNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: {
        id,
        companyId: req.companyId
      },
      include: {
        customer: true,
        lead: true,
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { note }
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note'
    });
  }
};

export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { content, isPinned, customerId, leadId } = req.body;

    const note = await prisma.note.create({
      data: {
        content,
        isPinned: isPinned || false,
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

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'NOTE_ADDED',
        title: 'Note added',
        customerId,
        leadId,
        companyId: req.companyId,
        createdById: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note'
    });
  }
};

export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    const { content, isPinned, customerId, leadId } = req.body;

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(content && { content }),
        ...(isPinned !== undefined && { isPinned }),
        ...(customerId !== undefined && { customerId }),
        ...(leadId !== undefined && { leadId })
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

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: { note }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note'
    });
  }
};

export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (req.userRole === Role.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Customers cannot delete notes'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.note.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Note not found'
      });
      return;
    }

    await prisma.note.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note'
    });
  }
};

