import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Pre-built super admin credentials (should be in env for production)
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@nexuscrm.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'NexusAdmin@2024';
const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'nexus-super-admin-secret-key-2024';

// Super Admin Login
export const superAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate credentials against pre-built admin
    if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
      res.status(401).json({
        success: false,
        message: 'Invalid super admin credentials'
      });
      return;
    }

    // Generate super admin token
    const token = jwt.sign(
      { 
        isSuperAdmin: true,
        email: SUPER_ADMIN_EMAIL
      },
      SUPER_ADMIN_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          email: SUPER_ADMIN_EMAIL,
          name: 'Super Admin'
        }
      }
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Verify Super Admin Token
export const verifySuperAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, SUPER_ADMIN_SECRET) as { isSuperAdmin: boolean; email: string };
      
      if (!decoded.isSuperAdmin) {
        res.status(401).json({
          success: false,
          message: 'Invalid super admin token'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          admin: {
            email: decoded.email,
            name: 'Super Admin'
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Verify super admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

// Get Dashboard Statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total companies
    const totalCompanies = await prisma.company.count();
    
    // Get active companies
    const activeCompanies = await prisma.company.count({
      where: { isActive: true }
    });

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total customers (users with CUSTOMER role)
    const totalCustomers = await prisma.userCompanyRole.count({
      where: { role: 'CUSTOMER' }
    });

    // Get total staff (users with ADMIN or STAFF role)
    const totalStaff = await prisma.userCompanyRole.count({
      where: { 
        role: { in: ['ADMIN', 'STAFF'] }
      }
    });

    // Get total leads across all companies
    const totalLeads = await prisma.lead.count();

    // Get total deals across all companies
    const totalDeals = await prisma.deal.count();

    // Get total revenue (won deals)
    const wonDeals = await prisma.deal.aggregate({
      where: { status: 'WON' },
      _sum: { value: true }
    });

    // Get companies created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newCompaniesThisMonth = await prisma.company.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Get users registered in last 30 days
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Get companies with their stats
    const companiesWithStats = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        industry: true,
        isActive: true,
        createdAt: true,
        owner: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            userCompanyRoles: true,
            customers: true,
            leads: true,
            deals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format companies data
    const companies = companiesWithStats.map(company => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      industry: company.industry || 'Not specified',
      isActive: company.isActive,
      createdAt: company.createdAt,
      owner: company.owner,
      stats: {
        totalMembers: company._count.userCompanyRoles,
        totalCustomers: company._count.customers,
        totalLeads: company._count.leads,
        totalDeals: company._count.deals
      }
    }));

    // Get recent activity (last 10 companies created)
    const recentCompanies = companies.slice(0, 10);

    // Get growth data for charts (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCompanyGrowth = await getMonthlyGrowth('company', sixMonthsAgo);
    const monthlyUserGrowth = await getMonthlyGrowth('user', sixMonthsAgo);

    res.json({
      success: true,
      data: {
        overview: {
          totalCompanies,
          activeCompanies,
          totalUsers,
          totalCustomers,
          totalStaff,
          totalLeads,
          totalDeals,
          totalRevenue: wonDeals._sum.value || 0,
          newCompaniesThisMonth,
          newUsersThisMonth
        },
        companies,
        recentCompanies,
        growth: {
          companies: monthlyCompanyGrowth,
          users: monthlyUserGrowth
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

// Helper function to get monthly growth data
async function getMonthlyGrowth(type: 'company' | 'user', startDate: Date) {
  const months: { month: string; count: number }[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    let count = 0;
    if (type === 'company') {
      count = await prisma.company.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });
    } else {
      count = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });
    }

    months.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count
    });
  }

  return months;
}

// Get All Companies (with pagination)
export const getAllCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          industry: true,
          website: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              userCompanyRoles: true,
              customers: true,
              leads: true,
              deals: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        companies: companies.map(c => ({
          ...c,
          stats: c._count
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies'
    });
  }
};

// Get All Users (with pagination)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          isEmailVerified: true,
          createdAt: true,
          userCompanyRoles: {
            select: {
              role: true,
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// Toggle Company Status
export const toggleCompanyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found'
      });
      return;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { isActive: !company.isActive }
    });

    res.json({
      success: true,
      data: { company: updatedCompany },
      message: `Company ${updatedCompany.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Toggle company status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle company status'
    });
  }
};

// Get Company Details
export const getCompanyDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        userCompanyRoles: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            customers: true,
            leads: true,
            deals: true,
            contacts: true,
            tasks: true,
            issues: true
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

    // Get revenue stats
    const revenueStats = await prisma.deal.aggregate({
      where: { 
        companyId,
        status: 'WON'
      },
      _sum: { value: true },
      _count: true
    });

    res.json({
      success: true,
      data: {
        company: {
          ...company,
          revenue: revenueStats._sum.value || 0,
          wonDeals: revenueStats._count
        }
      }
    });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company details'
    });
  }
};

