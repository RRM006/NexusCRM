import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import { linearService, LinearApiError, PRIORITY_LABEL_MAP } from '../services/linear.service';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({ success: false, message: 'Company ID required' });
      return;
    }

    const [
      customersCount,
      leadsCount,
      contactsCount,
      tasksCount,
      openTasksCount,
      leadsValue,
      wonDealsCount,
      wonDealsValue,
      recentCustomers,
      recentLeads,
      recentActivities,
      leadsByStatus,
      tasksByStatus,
      externalIssues
    ] = await Promise.all([
      // Count customers (users with CUSTOMER role)
      prisma.userCompanyRole.count({ 
        where: { companyId: req.companyId, role: 'CUSTOMER', isActive: true } 
      }),
      prisma.lead.count({ where: { companyId: req.companyId } }),
      prisma.contact.count({ where: { companyId: req.companyId } }),
      prisma.task.count({ where: { companyId: req.companyId } }),
      prisma.task.count({ 
        where: { 
          companyId: req.companyId, 
          status: { in: ['TODO', 'IN_PROGRESS'] } 
        } 
      }),
      prisma.lead.aggregate({
        where: { companyId: req.companyId },
        _sum: { value: true }
      }),
      prisma.lead.count({
        where: { companyId: req.companyId, status: 'WON' }
      }),
      prisma.lead.aggregate({
        where: { companyId: req.companyId, status: 'WON' },
        _sum: { value: true }
      }),
      // Get customers from UserCompanyRole
      prisma.userCompanyRole.findMany({
        where: { companyId: req.companyId, role: 'CUSTOMER', isActive: true },
        take: 5,
        orderBy: { joinedAt: 'desc' },
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
      }),
      prisma.lead.findMany({
        where: { companyId: req.companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.activity.findMany({
        where: { companyId: req.companyId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, avatar: true }
          }
        }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { companyId: req.companyId },
        _count: { id: true }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { companyId: req.companyId },
        _count: { id: true }
      }),
      // Get external issues from Linear for this tenant
      prisma.externalIssue.findMany({
        where: { tenantId: req.companyId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Fetch Linear issues to get current status and transform for dashboard
    let recentIssues: any[] = [];
    let openIssuesCount = 0;

    if (linearService.isConfigured() && externalIssues.length > 0) {
      try {
        const { issues: linearIssues } = await linearService.getIssues({ first: 50 });
        const linearIssueMap = new Map(linearIssues.map(li => [li.id, li]));

        // Transform external issues with Linear data
        recentIssues = externalIssues.slice(0, 5).map(ei => {
          const linearIssue = linearIssueMap.get(ei.linearIssueId);
          const status = linearIssue?.state?.type === 'started' ? 'IN_PROGRESS' :
                        linearIssue?.state?.type === 'completed' ? 'RESOLVED' :
                        linearIssue?.state?.type === 'canceled' ? 'CLOSED' : 'OPEN';
          return {
            id: ei.id,
            title: ei.title,
            status,
            linearStatus: linearIssue?.state?.name || ei.status,
            priority: PRIORITY_LABEL_MAP[linearIssue?.priority || 0] || 'Medium',
            linearUrl: ei.linearUrl,
            createdAt: ei.createdAt,
            customer: { id: ei.createdById, name: 'Customer' } // We'll get actual name if needed
          };
        });

        // Count open issues (not completed or canceled)
        openIssuesCount = externalIssues.filter(ei => {
          const li = linearIssueMap.get(ei.linearIssueId);
          return li && !['completed', 'canceled'].includes(li.state?.type || '');
        }).length;
      } catch (error) {
        console.error('Error fetching Linear issues for dashboard:', error);
        // Fallback to local data
        recentIssues = externalIssues.slice(0, 5).map(ei => ({
          id: ei.id,
          title: ei.title,
          status: ei.status === 'Done' ? 'RESOLVED' : ei.status === 'In Progress' ? 'IN_PROGRESS' : 'OPEN',
          linearUrl: ei.linearUrl,
          createdAt: ei.createdAt,
          customer: { id: ei.createdById, name: 'Customer' }
        }));
        openIssuesCount = externalIssues.filter(ei => 
          !['Done', 'Canceled', 'Completed'].includes(ei.status)
        ).length;
      }
    }

    // Transform customers from UserCompanyRole to simpler format
    const formattedCustomers = recentCustomers.map(cr => ({
      id: cr.id,
      name: cr.user.name,
      email: cr.user.email,
      avatar: cr.user.avatar,
      joinedAt: cr.joinedAt
    }));

    res.json({
      success: true,
      data: {
        stats: {
          customers: customersCount,
          leads: leadsCount,
          contacts: contactsCount,
          tasks: tasksCount,
          openTasks: openTasksCount,
          openIssues: openIssuesCount,
          totalLeadsValue: leadsValue._sum.value || 0,
          wonDeals: wonDealsCount,
          wonDealsValue: wonDealsValue._sum.value || 0
        },
        charts: {
          leadsByStatus: leadsByStatus.map(l => ({
            status: l.status,
            count: l._count.id
          })),
          tasksByStatus: tasksByStatus.map(t => ({
            status: t.status,
            count: t._count.id
          }))
        },
        recent: {
          customers: formattedCustomers,
          leads: recentLeads,
          issues: recentIssues,
          activities: recentActivities
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
};

export const getCustomerDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // For customer role, show limited data
    const company = await prisma.company.findUnique({
      where: { id: req.companyId },
      select: {
        id: true,
        name: true,
        logo: true,
        website: true,
        email: true,
        phone: true
      }
    });

    // Get tasks assigned to this user
    const myTasks = await prisma.task.findMany({
      where: {
        companyId: req.companyId,
        assignedToId: req.user.id,
        status: { not: 'COMPLETED' }
      },
      take: 5,
      orderBy: { dueDate: 'asc' }
    });

    // Get recent activities
    const recentActivities = await prisma.activity.findMany({
      where: { companyId: req.companyId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.json({
      success: true,
      data: {
        company,
        myTasks,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get customer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard'
    });
  }
};

export const getStaffDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const [
      myTasksCount,
      myOpenTasks,
      myLeads,
      recentActivities
    ] = await Promise.all([
      prisma.task.count({
        where: {
          companyId: req.companyId,
          assignedToId: req.user.id
        }
      }),
      prisma.task.findMany({
        where: {
          companyId: req.companyId,
          assignedToId: req.user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] }
        },
        take: 10,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ],
        include: {
          customer: { select: { id: true, name: true } },
          lead: { select: { id: true, title: true } }
        }
      }),
      prisma.lead.findMany({
        where: {
          companyId: req.companyId,
          assignedToId: req.user.id,
          status: { notIn: ['WON', 'LOST'] }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } }
        }
      }),
      prisma.activity.findMany({
        where: { companyId: req.companyId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, avatar: true }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          myTasks: myTasksCount,
          openTasks: myOpenTasks.length,
          myLeads: myLeads.length
        },
        myOpenTasks,
        myLeads,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard'
    });
  }
};

