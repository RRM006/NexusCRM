/**
 * MCP (Model Context Protocol) Tools for CRM
 * 
 * This defines the tools/functions that the AI can use to interact with CRM data.
 * Each tool has a name, description, parameters, and an executor function.
 */

import { prisma } from '../index';
import { Role } from '@prisma/client';
import { linearService, LINEAR_PRIORITY_MAP } from './linear.service';

// Tool parameter schemas (following MCP/OpenAI function calling format)
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  allowedRoles: Role[];
}

// Define all available CRM tools
export const CRM_TOOLS: ToolDefinition[] = [
  // ==================== READ OPERATIONS ====================
  {
    name: 'get_leads',
    description: 'Get a list of leads with optional filtering by status. Returns lead details including title, value, status, priority, and assigned person.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
          description: 'Filter leads by status'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of leads to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'get_lead_details',
    description: 'Get detailed information about a specific lead including all related tasks, notes, and activities.',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'The ID of the lead'
        }
      },
      required: ['leadId']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'get_contacts',
    description: 'Get a list of contacts with optional search. Returns contact details including name, email, phone, and company.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search contacts by name or email'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of contacts to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'get_tasks',
    description: 'Get tasks with optional filtering by status or assignee. Returns task details including title, status, priority, and due date.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          description: 'Filter tasks by status'
        },
        assignedToMe: {
          type: 'boolean',
          description: 'Only show tasks assigned to the current user'
        },
        overdue: {
          type: 'boolean',
          description: 'Only show overdue tasks'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER']
  },
  {
    name: 'get_issues',
    description: 'Get support issues with optional filtering. Returns issue details including title, status, priority, and category.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
          description: 'Filter issues by status'
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          description: 'Filter issues by priority'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER']
  },
  {
    name: 'get_customers',
    description: 'Get a list of customers with their details including name, email, status, and total spent.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'CHURNED'],
          description: 'Filter customers by status'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of customers to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN']
  },
  {
    name: 'get_activities',
    description: 'Get recent activities/timeline events from the CRM.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['CALL', 'EMAIL', 'MEETING', 'TASK_COMPLETED', 'NOTE_ADDED', 'LEAD_CREATED', 'LEAD_STATUS_CHANGED', 'CUSTOMER_CREATED', 'DEAL_WON', 'DEAL_LOST', 'OTHER'],
          description: 'Filter activities by type'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of activities to return (default: 10)'
        }
      }
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'get_dashboard_stats',
    description: 'Get summary statistics for the CRM dashboard including total leads, tasks, customers, and revenue.',
    parameters: {
      type: 'object',
      properties: {}
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },

  // ==================== WRITE OPERATIONS ====================
  {
    name: 'create_task',
    description: 'Create a new task in the CRM. Use this when the user wants to create a task or reminder.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the task'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the task'
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description: 'Priority level (default: MEDIUM)'
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (e.g., 2024-12-31)'
        },
        leadId: {
          type: 'string',
          description: 'Optional: Link task to a lead'
        }
      },
      required: ['title']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'update_lead_status',
    description: 'Update the status of a lead in the sales pipeline.',
    parameters: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'The ID of the lead to update'
        },
        status: {
          type: 'string',
          enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
          description: 'New status for the lead'
        }
      },
      required: ['leadId', 'status']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'update_task_status',
    description: 'Update the status of a task. Use this when user wants to mark a task as completed, in progress, etc.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The ID of the task to update'
        },
        status: {
          type: 'string',
          enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
          description: 'New status for the task'
        }
      },
      required: ['taskId', 'status']
    },
    allowedRoles: ['ADMIN', 'STAFF', 'CUSTOMER']
  },
  {
    name: 'create_note',
    description: 'Create a note for a lead or customer. Use this to record important information.',
    parameters: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Content of the note'
        },
        leadId: {
          type: 'string',
          description: 'Optional: Link note to a lead'
        },
        customerId: {
          type: 'string',
          description: 'Optional: Link note to a customer'
        },
        isPinned: {
          type: 'boolean',
          description: 'Pin this note for visibility'
        }
      },
      required: ['content']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'create_issue',
    description: 'Create a new support issue/ticket.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the issue'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue'
        },
        category: {
          type: 'string',
          enum: ['BILLING', 'TECHNICAL', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT', 'OTHER'],
          description: 'Category of the issue'
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
          description: 'Priority level'
        }
      },
      required: ['title', 'description']
    },
    allowedRoles: ['CUSTOMER']
  },
  {
    name: 'create_lead',
    description: 'Create a new lead/prospect in the sales pipeline. ALWAYS use this tool when user wants to add a new lead, prospect, or potential customer. Call this immediately with the provided information.',
    parameters: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'First name of the lead/prospect (required)'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the lead/prospect (required)'
        },
        company: {
          type: 'string',
          description: 'Company/organization name'
        },
        email: {
          type: 'string',
          description: 'Email address of the lead'
        },
        phone: {
          type: 'string',
          description: 'Phone number of the lead'
        },
        source: {
          type: 'string',
          enum: ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SOCIAL_MEDIA', 'EMAIL', 'EVENT', 'OTHER'],
          description: 'How the lead was acquired (website, referral, cold_call, advertisement, social_media, email, event, other)'
        },
        description: {
          type: 'string',
          description: 'Additional notes or description about the lead'
        },
        value: {
          type: 'number',
          description: 'Estimated deal value in dollars'
        }
      },
      required: ['firstName', 'lastName']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'create_contact',
    description: 'Create a new contact in the CRM. Use this when user wants to add a new person/contact.',
    parameters: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'First name of the contact'
        },
        lastName: {
          type: 'string',
          description: 'Last name of the contact'
        },
        email: {
          type: 'string',
          description: 'Email address'
        },
        phone: {
          type: 'string',
          description: 'Phone number'
        },
        jobTitle: {
          type: 'string',
          description: 'Job title/position'
        },
        company: {
          type: 'string',
          description: 'Company name'
        }
      },
      required: ['firstName', 'lastName']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'create_customer',
    description: 'Create a new customer record. Use this when converting a lead or adding a paying customer.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Customer name (person or company)'
        },
        email: {
          type: 'string',
          description: 'Customer email'
        },
        phone: {
          type: 'string',
          description: 'Customer phone'
        },
        company: {
          type: 'string',
          description: 'Company name if B2B'
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
          description: 'Customer status'
        }
      },
      required: ['name', 'email']
    },
    allowedRoles: ['ADMIN']
  },
  {
    name: 'draft_email',
    description: 'Draft an email message. Returns the drafted content that the user can review and send.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email or contact name'
        },
        subject: {
          type: 'string',
          description: 'Email subject'
        },
        purpose: {
          type: 'string',
          description: 'Purpose of the email (e.g., follow-up, introduction, proposal)'
        },
        tone: {
          type: 'string',
          enum: ['formal', 'friendly', 'professional', 'casual'],
          description: 'Tone of the email'
        },
        keyPoints: {
          type: 'string',
          description: 'Key points to include in the email'
        }
      },
      required: ['purpose']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  },
  {
    name: 'search_crm',
    description: 'Search across all CRM entities (leads, contacts, customers, tasks) for a given query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        entityTypes: {
          type: 'array',
          items: { type: 'string', enum: ['leads', 'contacts', 'customers', 'tasks'] },
          description: 'Types of entities to search (default: all)'
        }
      },
      required: ['query']
    },
    allowedRoles: ['ADMIN', 'STAFF']
  }
];

/**
 * Get tools available for a specific role
 */
export function getToolsForRole(role: Role): ToolDefinition[] {
  return CRM_TOOLS.filter(tool => tool.allowedRoles.includes(role));
}

/**
 * Convert tools to Gemini function declaration format
 */
export function getGeminiFunctionDeclarations(role: Role) {
  const tools = getToolsForRole(role);
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

/**
 * Execute a tool with the given parameters
 */
export async function executeTool(
  toolName: string,
  params: Record<string, any>,
  userId: string,
  companyId: string,
  role: Role
): Promise<{ success: boolean; result?: any; error?: string }> {
  // Verify tool is allowed for this role
  const tool = CRM_TOOLS.find(t => t.name === toolName);
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }
  if (!tool.allowedRoles.includes(role)) {
    return { success: false, error: `You don't have permission to use ${toolName}` };
  }

  try {
    switch (toolName) {
      // ==================== READ OPERATIONS ====================
      case 'get_leads': {
        const where: any = { companyId };
        if (params.status) where.status = params.status;
        
        const leads = await prisma.lead.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            value: true,
            priority: true,
            source: true,
            expectedCloseDate: true,
            assignedTo: { select: { name: true } },
            customer: { select: { name: true } }
          }
        });
        return { success: true, result: leads };
      }

      case 'get_lead_details': {
        const lead = await prisma.lead.findFirst({
          where: { id: params.leadId, companyId },
          include: {
            assignedTo: { select: { name: true, email: true } },
            customer: { select: { name: true, email: true } },
            tasks: { take: 5, orderBy: { createdAt: 'desc' } },
            notes: { take: 5, orderBy: { createdAt: 'desc' } },
            activities: { take: 5, orderBy: { createdAt: 'desc' } }
          }
        });
        if (!lead) return { success: false, error: 'Lead not found' };
        return { success: true, result: lead };
      }

      case 'get_contacts': {
        const where: any = { companyId };
        if (params.search) {
          where.OR = [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } }
          ];
        }
        
        const contacts = await prisma.contact.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            customer: { select: { name: true } }
          }
        });
        return { success: true, result: contacts };
      }

      case 'get_tasks': {
        const where: any = { companyId };
        if (params.status) where.status = params.status;
        if (params.assignedToMe) where.assignedToId = userId;
        if (role === 'CUSTOMER') where.assignedToId = userId; // Customers only see their tasks
        if (params.overdue) {
          where.dueDate = { lt: new Date() };
          where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
        }
        
        const tasks = await prisma.task.findMany({
          where,
          take: params.limit || 10,
          orderBy: { dueDate: 'asc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            description: true,
            assignedTo: { select: { name: true } },
            lead: { select: { title: true } }
          }
        });
        return { success: true, result: tasks };
      }

      case 'get_issues': {
        // Use ExternalIssue model (Linear integration)
        const where: any = { tenantId: companyId };
        if (params.status) {
          // Map legacy status to Linear status names
          const statusMap: Record<string, string[]> = {
            'OPEN': ['Todo', 'Backlog', 'Triage'],
            'IN_PROGRESS': ['In Progress'],
            'RESOLVED': ['Done', 'Completed'],
            'CLOSED': ['Canceled', 'Cancelled']
          };
          const mappedStatuses = statusMap[params.status] || [params.status];
          where.status = { in: mappedStatuses };
        }
        if (role === 'CUSTOMER') where.createdById = userId; // Customers only see their issues
        
        const issues = await prisma.externalIssue.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            linearIssueId: true,
            title: true,
            status: true,
            priority: true,
            description: true,
            linearUrl: true,
            createdAt: true,
            createdById: true
          }
        });
        
        // Map priority numbers to labels
        const priorityLabels: Record<number, string> = {
          0: 'No Priority',
          1: 'Urgent',
          2: 'High',
          3: 'Medium',
          4: 'Low'
        };
        
        const mappedIssues = issues.map(i => ({
          ...i,
          priorityLabel: priorityLabels[i.priority] || 'Medium',
          // Map Linear status to legacy status for display
          legacyStatus: i.status === 'Done' || i.status === 'Completed' ? 'RESOLVED' :
                       i.status === 'In Progress' ? 'IN_PROGRESS' :
                       i.status === 'Canceled' || i.status === 'Cancelled' ? 'CLOSED' : 'OPEN'
        }));
        
        return { success: true, result: mappedIssues };
      }

      case 'get_customers': {
        if (role !== 'ADMIN') {
          return { success: false, error: 'Only admins can view customer data' };
        }
        
        const where: any = { companyId };
        if (params.status) where.status = params.status;
        
        const customers = await prisma.customer.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            totalSpent: true,
            company: true
          }
        });
        return { success: true, result: customers };
      }

      case 'get_activities': {
        const where: any = { companyId };
        if (params.type) where.type = params.type;
        
        const activities = await prisma.activity.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true,
            createdBy: { select: { name: true } }
          }
        });
        return { success: true, result: activities };
      }

      case 'get_dashboard_stats': {
        // Use tenantId for ExternalIssue (Linear integration)
        const [
          totalLeads,
          newLeads,
          wonLeads,
          totalTasks,
          pendingTasks,
          totalCustomers,
          totalIssues,
          openIssues
        ] = await Promise.all([
          prisma.lead.count({ where: { companyId } }),
          prisma.lead.count({ where: { companyId, status: 'NEW' } }),
          prisma.lead.count({ where: { companyId, status: 'WON' } }),
          prisma.task.count({ where: { companyId } }),
          prisma.task.count({ where: { companyId, status: { in: ['TODO', 'IN_PROGRESS'] } } }),
          prisma.customer.count({ where: { companyId } }),
          prisma.externalIssue.count({ where: { tenantId: companyId } }),
          prisma.externalIssue.count({ 
            where: { 
              tenantId: companyId, 
              status: { notIn: ['Done', 'Completed', 'Canceled', 'Cancelled'] } 
            } 
          })
        ]);

        const pipelineValue = await prisma.lead.aggregate({
          where: { companyId, status: { notIn: ['WON', 'LOST'] } },
          _sum: { value: true }
        });

        return {
          success: true,
          result: {
            leads: { total: totalLeads, new: newLeads, won: wonLeads },
            tasks: { total: totalTasks, pending: pendingTasks },
            customers: { total: totalCustomers },
            issues: { total: totalIssues, open: openIssues },
            pipelineValue: pipelineValue._sum.value || 0
          }
        };
      }

      // ==================== WRITE OPERATIONS ====================
      case 'create_task': {
        const task = await prisma.task.create({
          data: {
            title: params.title,
            description: params.description,
            priority: params.priority || 'MEDIUM',
            dueDate: params.dueDate ? new Date(params.dueDate) : null,
            leadId: params.leadId,
            companyId,
            createdById: userId,
            assignedToId: userId // Assign to creator by default
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        });
        return { success: true, result: { message: 'Task created successfully', task } };
      }

      case 'update_lead_status': {
        const lead = await prisma.lead.findFirst({
          where: { id: params.leadId, companyId }
        });
        if (!lead) return { success: false, error: 'Lead not found' };

        const updated = await prisma.lead.update({
          where: { id: params.leadId },
          data: {
            status: params.status,
            ...(params.status === 'WON' || params.status === 'LOST' ? { closedAt: new Date() } : {})
          },
          select: { id: true, title: true, status: true }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'LEAD_STATUS_CHANGED',
            title: `Lead status changed to ${params.status}`,
            description: `${lead.title} moved to ${params.status}`,
            leadId: params.leadId,
            companyId,
            createdById: userId
          }
        });

        return { success: true, result: { message: `Lead status updated to ${params.status}`, lead: updated } };
      }

      case 'update_task_status': {
        // Find the task first
        const task = await prisma.task.findFirst({
          where: { id: params.taskId, companyId }
        });
        
        if (!task) {
          return { success: false, error: 'Task not found' };
        }
        
        // For customers, only allow updating their assigned tasks
        if (role === 'CUSTOMER' && task.assignedToId !== userId) {
          return { success: false, error: 'You can only update tasks assigned to you' };
        }
        
        const updateData: any = { status: params.status };
        
        // Set completedAt if marking as completed
        if (params.status === 'COMPLETED' && task.status !== 'COMPLETED') {
          updateData.completedAt = new Date();
        }
        
        const updatedTask = await prisma.task.update({
          where: { id: params.taskId },
          data: updateData,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            completedAt: true
          }
        });
        
        // Log activity if completed
        if (params.status === 'COMPLETED' && task.status !== 'COMPLETED') {
          await prisma.activity.create({
            data: {
              type: 'TASK_COMPLETED',
              title: `Task "${task.title}" completed`,
              description: `Task marked as completed via AI assistant`,
              companyId,
              createdById: userId
            }
          });
        }
        
        return { success: true, result: { message: `Task status updated to ${params.status}`, task: updatedTask } };
      }

      case 'create_note': {
        const note = await prisma.note.create({
          data: {
            content: params.content,
            leadId: params.leadId,
            customerId: params.customerId,
            isPinned: params.isPinned || false,
            companyId,
            createdById: userId
          },
          select: {
            id: true,
            content: true,
            isPinned: true,
            createdAt: true
          }
        });
        return { success: true, result: { message: 'Note created successfully', note } };
      }

      case 'create_issue': {
        // Check if Linear is configured
        if (!linearService.isConfigured()) {
          return { success: false, error: 'Linear integration is not configured. Please contact admin.' };
        }
        
        // Get user info for description
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true }
        });
        
        // Build description with metadata
        const fullDescription = [
          params.description,
          '',
          '---',
          `**Category:** ${params.category || 'GENERAL'}`,
          `**Created by:** ${user?.name || 'Unknown'} (${user?.email || 'Unknown'}) [Customer via AI]`,
          `**Tenant:** ${companyId}`,
        ].join('\n');
        
        // Create issue in Linear
        const linearIssue = await linearService.createIssue({
          title: params.title,
          description: fullDescription,
          priority: params.priority as keyof typeof LINEAR_PRIORITY_MAP,
        });
        
        // Save reference in our database
        const externalIssue = await prisma.externalIssue.create({
          data: {
            linearIssueId: linearIssue.id,
            linearUrl: linearIssue.url,
            title: linearIssue.title,
            description: params.description || null,
            status: linearIssue.state?.name || 'Todo',
            priority: linearIssue.priority,
            createdById: userId,
            tenantId: companyId,
          },
        });
        
        // Log activity
        await prisma.activity.create({
          data: {
            type: 'OTHER',
            title: `New issue created via AI: "${params.title}"`,
            description: `Issue created in Linear (${linearIssue.identifier})`,
            companyId,
            createdById: userId,
            metadata: {
              linearIssueId: linearIssue.id,
              linearUrl: linearIssue.url,
              linearIdentifier: linearIssue.identifier,
            },
          },
        });
        
        return { 
          success: true, 
          result: { 
            message: 'Issue created successfully in Linear', 
            issue: {
              id: externalIssue.id,
              linearId: linearIssue.identifier,
              title: linearIssue.title,
              status: linearIssue.state?.name || 'Todo',
              priority: params.priority || 'MEDIUM',
              url: linearIssue.url
            }
          } 
        };
      }

      case 'create_lead': {
        // Build title from first + last name
        const leadTitle = `${params.firstName} ${params.lastName}`.trim();
        
        // Map source to enum value
        const sourceMap: Record<string, string> = {
          'website': 'WEBSITE',
          'referral': 'REFERRAL',
          'cold_call': 'COLD_CALL',
          'advertisement': 'ADVERTISEMENT',
          'social_media': 'SOCIAL_MEDIA',
          'email': 'EMAIL',
          'event': 'EVENT',
          'other': 'OTHER'
        };
        const source = sourceMap[(params.source || '').toLowerCase()] || 'OTHER';

        // Build description including company if provided
        let fullDescription = params.description || '';
        if (params.company) {
          fullDescription = `Company: ${params.company}${fullDescription ? '\n' + fullDescription : ''}`;
        }

        const lead = await prisma.lead.create({
          data: {
            title: leadTitle,
            description: fullDescription || null,
            value: params.value || 0,
            source: source as any,
            priority: 1, // Default priority
            status: 'NEW',
            contactName: leadTitle,
            contactEmail: params.email || null,
            contactPhone: params.phone || null,
            companyId,
            createdById: userId,
            assignedToId: userId
          },
          select: {
            id: true,
            title: true,
            status: true,
            value: true,
            priority: true,
            source: true,
            contactEmail: true,
            contactPhone: true
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'LEAD_CREATED',
            title: 'New lead created',
            description: `Lead "${leadTitle}" was created via AI assistant`,
            leadId: lead.id,
            companyId,
            createdById: userId
          }
        });

        console.log(`[MCP] Lead created: ${lead.id} - ${leadTitle}`);
        return { success: true, result: { message: `Lead "${leadTitle}" created successfully!`, lead } };
      }

      case 'create_contact': {
        const contact = await prisma.contact.create({
          data: {
            firstName: params.firstName,
            lastName: params.lastName,
            email: params.email || `${params.firstName.toLowerCase()}.${params.lastName.toLowerCase()}@example.com`,
            phone: params.phone,
            jobTitle: params.jobTitle,
            companyId,
            createdById: userId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true
          }
        });

        return { success: true, result: { message: 'Contact created successfully', contact } };
      }

      case 'create_customer': {
        if (role !== 'ADMIN') {
          return { success: false, error: 'Only admins can create customers' };
        }

        const customer = await prisma.customer.create({
          data: {
            name: params.name,
            email: params.email,
            phone: params.phone,
            company: params.company,
            status: params.status || 'ACTIVE',
            companyId,
            createdById: userId
          },
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'CUSTOMER_CREATED',
            title: 'New customer created',
            description: `Customer "${params.name}" was created via AI assistant`,
            customerId: customer.id,
            companyId,
            createdById: userId
          }
        });

        return { success: true, result: { message: 'Customer created successfully', customer } };
      }

      case 'draft_email': {
        // This doesn't create anything in DB, just returns a draft
        const draft = {
          to: params.to || '[recipient]',
          subject: params.subject || `[Subject based on: ${params.purpose}]`,
          purpose: params.purpose,
          tone: params.tone || 'professional',
          keyPoints: params.keyPoints,
          // The actual email content will be generated by the AI
          note: 'Please generate an appropriate email based on these parameters'
        };
        return { success: true, result: { draft, instructions: 'Generate email content based on these parameters' } };
      }

      case 'search_crm': {
        const entityTypes = params.entityTypes || ['leads', 'contacts', 'customers', 'tasks'];
        const results: Record<string, any[]> = {};
        const query = params.query.toLowerCase();

        if (entityTypes.includes('leads') && ['ADMIN', 'STAFF'].includes(role)) {
          results.leads = await prisma.lead.findMany({
            where: {
              companyId,
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: 5,
            select: { id: true, title: true, status: true, value: true }
          });
        }

        if (entityTypes.includes('contacts') && ['ADMIN', 'STAFF'].includes(role)) {
          results.contacts = await prisma.contact.findMany({
            where: {
              companyId,
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: 5,
            select: { id: true, firstName: true, lastName: true, email: true }
          });
        }

        if (entityTypes.includes('customers') && role === 'ADMIN') {
          results.customers = await prisma.customer.findMany({
            where: {
              companyId,
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            },
            take: 5,
            select: { id: true, name: true, email: true, status: true }
          });
        }

        if (entityTypes.includes('tasks')) {
          const taskWhere: any = {
            companyId,
            title: { contains: query, mode: 'insensitive' }
          };
          if (role === 'CUSTOMER') taskWhere.assignedToId = userId;
          
          results.tasks = await prisma.task.findMany({
            where: taskWhere,
            take: 5,
            select: { id: true, title: true, status: true, priority: true }
          });
        }

        return { success: true, result: results };
      }

      default:
        return { success: false, error: `Tool ${toolName} not implemented` };
    }
  } catch (error: any) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, error: error.message || 'Tool execution failed' };
  }
}

