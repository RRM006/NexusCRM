import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { linearService, LinearApiError, PRIORITY_LABEL_MAP } from '../services/linear.service';

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
    console.log('Fetching super admin dashboard stats...');
    
    // Get total companies
    const totalCompanies = await prisma.company.count();
    console.log('Total companies:', totalCompanies);
    
    // Get active companies
    const activeCompanies = await prisma.company.count({
      where: { isActive: true }
    });

    // Get total users
    const totalUsers = await prisma.user.count();
    console.log('Total users:', totalUsers);

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
    let totalLeads = 0;
    try {
      totalLeads = await prisma.lead.count();
      console.log('Total leads:', totalLeads);
    } catch (leadError) {
      console.error('Error counting leads:', leadError);
    }

    // Get total deals across all companies
    let totalDeals = 0;
    try {
      totalDeals = await prisma.deal.count();
      console.log('Total deals:', totalDeals);
    } catch (dealError) {
      console.error('Error counting deals:', dealError);
    }

    // Get total revenue (won deals) - also check leads with WON status
    let totalRevenue = 0;
    try {
      // Check deals with WON status
      const wonDealsRevenue = await prisma.deal.aggregate({
        where: { status: 'WON' },
        _sum: { value: true }
      });
      totalRevenue += wonDealsRevenue._sum.value || 0;
      
      // Also check leads with WON status
      const wonLeadsRevenue = await prisma.lead.aggregate({
        where: { status: 'WON' },
        _sum: { value: true }
      });
      totalRevenue += wonLeadsRevenue._sum.value || 0;
      console.log('Total revenue:', totalRevenue);
    } catch (revenueError) {
      console.error('Error calculating revenue:', revenueError);
    }

    // For backwards compatibility, keep the wonDeals variable
    const wonDeals = { _sum: { value: totalRevenue } };

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
    console.log('Companies fetched:', companiesWithStats.length);

    // Format companies data with detailed stats
    const companies = await Promise.all(companiesWithStats.map(async (company) => {
      // Get company-specific revenue from won leads and deals
      let companyRevenue = 0;
      try {
        const wonLeads = await prisma.lead.aggregate({
          where: { companyId: company.id, status: 'WON' },
          _sum: { value: true }
        });
        companyRevenue += wonLeads._sum.value || 0;

        const wonDeals = await prisma.deal.aggregate({
          where: { companyId: company.id, status: 'WON' },
          _sum: { value: true }
        });
        companyRevenue += wonDeals._sum.value || 0;
      } catch (e) {
        console.error('Error calculating company revenue:', e);
      }

      return {
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
          totalDeals: company._count.deals,
          totalRevenue: companyRevenue
        }
      };
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

// ==================== ISSUES MANAGEMENT ====================

/**
 * Helper to map Linear status to display status
 */
function mapLinearStatusToDisplay(stateType: string): string {
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
 * Get issues created by Company Admins (for Super Admin)
 * Customer issues are handled by Company Admins, not Super Admin
 */
export const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const companyId = req.query.companyId as string;

    // Get all users who are ADMIN role in any company
    const adminUsers = await prisma.userCompanyRole.findMany({
      where: { role: 'ADMIN' },
      select: { userId: true }
    });
    const adminUserIds = adminUsers.map(u => u.userId);

    // Build where clause - only issues created by company admins
    const where: any = {
      createdById: { in: adminUserIds }
    };
    if (companyId) {
      where.tenantId = companyId;
    }

    // Get external issues created by admins with company and creator info
    const [externalIssues, total] = await Promise.all([
      prisma.externalIssue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          tenantCompany: {
            select: { id: true, name: true, slug: true }
          }
        }
      }),
      prisma.externalIssue.count({ where })
    ]);

    // Get creator info for all issues
    const creatorIds = externalIssues.map(ei => ei.createdById).filter(Boolean) as string[];
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true, email: true }
    });
    const creatorMap = new Map(creators.map(c => [c.id, c]));

    // Fetch Linear issues to get current status
    let enrichedIssues: any[] = [];
    
    if (linearService.isConfigured()) {
      try {
        const { issues: linearIssues } = await linearService.getIssues({ first: 100 });
        const linearMap = new Map(linearIssues.map(li => [li.id, li]));

        enrichedIssues = externalIssues.map(ei => {
          const linearIssue = linearMap.get(ei.linearIssueId);
          const currentStatus = linearIssue ? mapLinearStatusToDisplay(linearIssue.state?.type || '') : 'OPEN';
          const creator = ei.createdById ? creatorMap.get(ei.createdById) : null;
          
          // Filter by status if provided
          if (status && currentStatus !== status) {
            return null;
          }

          return {
            id: ei.id,
            linearIssueId: ei.linearIssueId,
            identifier: linearIssue?.identifier || ei.linearIssueId.slice(0, 8),
            title: ei.title,
            description: ei.description,
            status: currentStatus,
            linearStatus: linearIssue?.state?.name || ei.status,
            priority: PRIORITY_LABEL_MAP[linearIssue?.priority || 0] || 'Medium',
            priorityLevel: linearIssue?.priority || 0,
            linearUrl: ei.linearUrl,
            createdAt: ei.createdAt,
            company: ei.tenantCompany,
            createdBy: creator ? { id: creator.id, name: creator.name, email: creator.email } : null
          };
        }).filter(Boolean);
      } catch (error) {
        console.error('Error fetching Linear issues:', error);
        // Fallback to local data
        enrichedIssues = externalIssues.map(ei => {
          const creator = ei.createdById ? creatorMap.get(ei.createdById) : null;
          return {
            id: ei.id,
            linearIssueId: ei.linearIssueId,
            identifier: ei.linearIssueId.slice(0, 8),
            title: ei.title,
            description: ei.description,
            status: ei.status === 'Done' ? 'RESOLVED' : ei.status === 'In Progress' ? 'IN_PROGRESS' : 'OPEN',
            linearStatus: ei.status,
            priority: PRIORITY_LABEL_MAP[ei.priority] || 'Medium',
            linearUrl: ei.linearUrl,
            createdAt: ei.createdAt,
            company: ei.tenantCompany,
            createdBy: creator ? { id: creator.id, name: creator.name, email: creator.email } : null
          };
        });
      }
    } else {
      // Linear not configured - use local data
      enrichedIssues = externalIssues.map(ei => {
        const creator = ei.createdById ? creatorMap.get(ei.createdById) : null;
        return {
          id: ei.id,
          linearIssueId: ei.linearIssueId,
          title: ei.title,
          description: ei.description,
          status: 'OPEN',
          linearStatus: ei.status,
          priority: 'Medium',
          linearUrl: ei.linearUrl,
          createdAt: ei.createdAt,
          company: ei.tenantCompany,
          createdBy: creator ? { id: creator.id, name: creator.name, email: creator.email } : null
        };
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedIssues = enrichedIssues.slice(startIndex, startIndex + limit);

    // Count by status
    const statusCounts = {
      OPEN: enrichedIssues.filter(i => i.status === 'OPEN').length,
      IN_PROGRESS: enrichedIssues.filter(i => i.status === 'IN_PROGRESS').length,
      RESOLVED: enrichedIssues.filter(i => i.status === 'RESOLVED').length,
      CLOSED: enrichedIssues.filter(i => i.status === 'CLOSED').length,
    };

    res.json({
      success: true,
      data: {
        issues: paginatedIssues,
        stats: statusCounts,
        pagination: {
          page,
          limit,
          total: enrichedIssues.length,
          totalPages: Math.ceil(enrichedIssues.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues'
    });
  }
};

/**
 * Update issue status (Super Admin can resolve any issue)
 */
export const updateIssueStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;

    // Find the external issue
    const externalIssue = await prisma.externalIssue.findFirst({
      where: {
        OR: [
          { id: issueId },
          { linearIssueId: issueId }
        ]
      },
      include: {
        tenantCompany: { select: { id: true, name: true } }
      }
    });

    if (!externalIssue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    if (!linearService.isConfigured()) {
      res.status(503).json({
        success: false,
        message: 'Linear integration is not configured'
      });
      return;
    }

    // Get workflow states to find the target state
    const workflowStates = await linearService.getWorkflowStates();
    
    const statusTypeMap: Record<string, string> = {
      OPEN: 'unstarted',
      IN_PROGRESS: 'started',
      RESOLVED: 'completed',
      CLOSED: 'canceled',
    };

    const targetStateType = statusTypeMap[status];
    const targetState = workflowStates.find(s => s.type === targetStateType);

    if (!targetState) {
      res.status(400).json({
        success: false,
        message: `Cannot map status "${status}" to a Linear workflow state`
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
      data: { status: updatedLinearIssue.state?.name || status }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'OTHER',
        title: `Issue "${externalIssue.title}" status updated to ${status}`,
        description: `Super Admin updated issue status`,
        companyId: externalIssue.tenantId,
        createdById: externalIssue.createdById || externalIssue.tenantId, // Fallback
        metadata: {
          issueId: externalIssue.id,
          linearIssueId: externalIssue.linearIssueId,
          oldStatus: externalIssue.status,
          newStatus: status
        }
      }
    });

    res.json({
      success: true,
      message: `Issue status updated to ${status}`,
      data: {
        issue: {
          id: externalIssue.id,
          title: externalIssue.title,
          status,
          linearStatus: updatedLinearIssue.state?.name
        }
      }
    });
  } catch (error) {
    console.error('Update issue status error:', error);
    
    if (error instanceof LinearApiError) {
      res.status(500).json({
        success: false,
        message: error.message,
        code: error.code
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update issue status'
    });
  }
};

/**
 * Get issue details (Super Admin)
 */
export const getIssueDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueId } = req.params;

    const externalIssue = await prisma.externalIssue.findFirst({
      where: {
        OR: [
          { id: issueId },
          { linearIssueId: issueId }
        ]
      },
      include: {
        tenantCompany: { select: { id: true, name: true, slug: true } }
      }
    });

    if (!externalIssue) {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
      return;
    }

    let linearData: any = null;
    if (linearService.isConfigured()) {
      try {
        linearData = await linearService.getIssue(externalIssue.linearIssueId);
      } catch (e) {
        console.error('Error fetching Linear issue:', e);
      }
    }

    res.json({
      success: true,
      data: {
        issue: {
          id: externalIssue.id,
          linearIssueId: externalIssue.linearIssueId,
          identifier: linearData?.identifier || externalIssue.linearIssueId.slice(0, 8),
          title: externalIssue.title,
          description: externalIssue.description,
          status: linearData ? mapLinearStatusToDisplay(linearData.state?.type || '') : 'OPEN',
          linearStatus: linearData?.state?.name || externalIssue.status,
          priority: PRIORITY_LABEL_MAP[linearData?.priority || externalIssue.priority] || 'Medium',
          linearUrl: externalIssue.linearUrl,
          createdAt: externalIssue.createdAt,
          updatedAt: externalIssue.updatedAt,
          company: externalIssue.tenantCompany,
          createdById: externalIssue.createdById,
          labels: linearData?.labels?.nodes || []
        }
      }
    });
  } catch (error) {
    console.error('Get issue details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issue details'
    });
  }
};

