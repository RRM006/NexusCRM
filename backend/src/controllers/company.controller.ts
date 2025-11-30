import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

// Generate slug from company name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Ensure unique slug
const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.company.findFirst({
      where: {
        slug,
        ...(excludeId && { NOT: { id: excludeId } })
      }
    });

    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

export const createCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, website, industry, size, address, city, country, phone, email, description } = req.body;

    // Generate unique slug
    const baseSlug = req.body.slug || generateSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create company and assign user as ADMIN
    const company = await prisma.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name,
          slug,
          website,
          industry,
          size,
          address,
          city,
          country,
          phone,
          email,
          description,
          ownerId: req.user!.id
        }
      });

      // Assign creator as ADMIN
      await tx.userCompanyRole.create({
        data: {
          userId: req.user!.id,
          companyId: newCompany.id,
          role: Role.ADMIN
        }
      });

      return newCompany;
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company,
        role: Role.ADMIN
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company'
    });
  }
};

export const getMyCompanies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const userCompanyRoles = await prisma.userCompanyRole.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      include: {
        company: true
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    const companies = userCompanyRoles.map(ucr => ({
      ...ucr.company,
      role: ucr.role,
      joinedAt: ucr.joinedAt
    }));

    res.json({
      success: true,
      data: { companies }
    });
  } catch (error) {
    console.error('Get my companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies'
    });
  }
};

export const getCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            customers: true,
            leads: true,
            contacts: true,
            tasks: true,
            userCompanyRoles: true
          }
        }
      }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    res.json({
      success: true,
      data: { company }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company'
    });
  }
};

export const updateCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify admin access
    if (req.userRole !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Only admins can update company'
      });
      return;
    }

    const { name, website, industry, size, address, city, country, phone, email, description, logo } = req.body;

    // Handle slug update
    let slug;
    if (req.body.slug) {
      slug = await ensureUniqueSlug(req.body.slug, id);
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(website !== undefined && { website }),
        ...(industry !== undefined && { industry }),
        ...(size !== undefined && { size }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(description !== undefined && { description }),
        ...(logo !== undefined && { logo })
      }
    });

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
};

export const deleteCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const company = await prisma.company.findUnique({
      where: { id }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    if (company.ownerId !== req.user.id) {
      res.status(403).json({
        success: false,
        message: 'Only the owner can delete the company'
      });
      return;
    }

    await prisma.company.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company'
    });
  }
};

export const getCompanyMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const members = await prisma.userCompanyRole.findMany({
      where: {
        companyId: req.companyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        members: members.map(m => ({
          id: m.id,
          user: m.user,
          role: m.role,
          joinedAt: m.joinedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get company members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members'
    });
  }
};

export const joinCompanyAsCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { companyId } = req.body;

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company || !company.isActive) {
      res.status(404).json({
        success: false,
        message: 'Company not found or inactive'
      });
      return;
    }

    // Check if already a member with any role
    const existingRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId
      }
    });

    if (existingRole) {
      res.status(400).json({
        success: false,
        message: 'You are already associated with this company'
      });
      return;
    }

    // Add as customer
    const userCompanyRole = await prisma.userCompanyRole.create({
      data: {
        userId: req.user.id,
        companyId,
        role: Role.CUSTOMER
      },
      include: {
        company: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Joined company as customer',
      data: {
        company: userCompanyRole.company,
        role: userCompanyRole.role
      }
    });
  } catch (error) {
    console.error('Join company error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining company'
    });
  }
};

export const searchCompanies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
      return;
    }

    const companies = await prisma.company.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        industry: true
      },
      take: 10
    });

    res.json({
      success: true,
      data: { companies }
    });
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching companies'
    });
  }
};

