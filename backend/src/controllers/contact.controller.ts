import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export const getContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const customerId = req.query.customerId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const where: any = {
      companyId: req.companyId
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
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
          }
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
};

export const getContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        companyId: req.companyId
      },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { contact }
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact'
    });
  }
};

export const createContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { firstName, lastName, email, phone, jobTitle, department, avatar, isPrimary, customerId } = req.body;

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        department,
        avatar,
        isPrimary: isPrimary || false,
        customerId,
        companyId: req.companyId,
        createdById: req.user.id
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating contact'
    });
  }
};

export const updateContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.contact.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    const { firstName, lastName, email, phone, jobTitle, department, avatar, isPrimary, customerId } = req.body;

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
        ...(avatar !== undefined && { avatar }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(customerId !== undefined && { customerId })
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        },
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: { contact }
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact'
    });
  }
};

export const deleteContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (req.userRole === Role.CUSTOMER) {
      res.status(403).json({
        success: false,
        message: 'Customers cannot delete contacts'
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.contact.findFirst({
      where: { id, companyId: req.companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
      return;
    }

    await prisma.contact.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting contact'
    });
  }
};

