/**
 * MCP (Model Context Protocol) Tools for CRM
 * 
 * This defines the tools/functions that the AI can use to interact with CRM data.
 * Each tool has a name, description, parameters, and an executor function.
 */

import { prisma } from '../index';
import { Role } from '@prisma/client';

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
    description: 'Create a new lead in the sales pipeline. Use this when user wants to add a new potential customer or opportunity.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title/name of the lead opportunity'
        },
        description: {
          type: 'string',
          description: 'Description of the lead'
        },
        value: {
          type: 'number',
          description: 'Estimated deal value in dollars'
        },
        source: {
          type: 'string',
          enum: ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'ADVERTISEMENT', 'SOCIAL_MEDIA', 'EMAIL', 'EVENT', 'OTHER'],
          description: 'How the lead was acquired'
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
          description: 'Priority level'
        },
        contactEmail: {
          type: 'string',
          description: 'Contact email for the lead'
        },
        contactPhone: {
          type: 'string',
          description: 'Contact phone for the lead'
        }
      },
      required: ['title']
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
        const where: any = { companyId };
        if (params.status) where.status = params.status;
        if (params.priority) where.priority = params.priority;
        if (role === 'CUSTOMER') where.customerId = userId; // Customers only see their issues
        
        const issues = await prisma.issue.findMany({
          where,
          take: params.limit || 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: true,
            description: true,
            resolution: true,
            createdAt: true,
            customer: { select: { name: true } }
          }
        });
        return { success: true, result: issues };
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
          prisma.issue.count({ where: { companyId } }),
          prisma.issue.count({ where: { companyId, status: { in: ['OPEN', 'IN_PROGRESS'] } } })
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
        const issue = await prisma.issue.create({
          data: {
            title: params.title,
            description: params.description,
            category: params.category || 'GENERAL',
            priority: params.priority || 'MEDIUM',
            customerId: userId,
            companyId
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            category: true
          }
        });
        return { success: true, result: { message: 'Issue created successfully', issue } };
      }

      case 'create_lead': {
        const lead = await prisma.lead.create({
          data: {
            title: params.title,
            description: params.description,
            value: params.value || 0,
            source: params.source || 'OTHER',
            priority: params.priority || 'MEDIUM',
            status: 'NEW',
            contactEmail: params.contactEmail,
            contactPhone: params.contactPhone,
            companyId,
            assignedToId: userId
          },
          select: {
            id: true,
            title: true,
            status: true,
            value: true,
            priority: true,
            source: true
          }
        });

        // Log activity
        await prisma.activity.create({
          data: {
            type: 'LEAD_CREATED',
            title: 'New lead created',
            description: `Lead "${params.title}" was created via AI assistant`,
            leadId: lead.id,
            companyId,
            createdById: userId
          }
        });

        return { success: true, result: { message: 'Lead created successfully', lead } };
      }

      case 'create_contact': {
        const contact = await prisma.contact.create({
          data: {
            firstName: params.firstName,
            lastName: params.lastName,
            email: params.email,
            phone: params.phone,
            jobTitle: params.jobTitle,
            companyId
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
            companyId
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

