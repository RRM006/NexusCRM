import { Role } from '@prisma/client';
import { prisma } from '../index';

export interface StartConversationInput {
  currentUserId: string;
  currentRole: Role;
  companyId: string;
  withUserId: string;
}

export interface SendMessageInput {
  conversationId: string;
  senderUserId: string;
  companyId: string;
  content: string;
}

export interface SuperAdminStartCompanyChatInput {
  companyId: string;
}

export interface SuperAdminStartCustomerChatInput {
  customerUserId: string;
  companyId?: string;
}

export interface SuperAdminSendMessageInput {
  conversationId: string;
  content: string;
}

export class ChatService {
  /**
   * Start or get an existing 1:1 conversation between the current user and target user
   * within the same company.
   *
   * Role rules (backend-enforced):
   * - ADMIN/STAFF -> can message CUSTOMER users in their company
   * - CUSTOMER    -> can message ADMIN/STAFF users in their company
   * - No Company -> Company, Company -> other Company, Customer -> other Customer
   */
  static async startConversationForUser(input: StartConversationInput) {
    const { currentUserId, currentRole, companyId, withUserId } = input;

    if (currentUserId === withUserId) {
      throw new Error('You cannot start a conversation with yourself');
    }

    // Load target user role within this company
    const targetRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: withUserId,
        companyId,
        isActive: true
      }
    });

    if (!targetRole) {
      throw new Error('Target user is not part of this company');
    }

    // Enforce role matrix
    if (currentRole === Role.ADMIN || currentRole === Role.STAFF) {
      // Company user can only talk to CUSTOMERS in their company
      if (targetRole.role !== Role.CUSTOMER) {
        throw new Error('You can only message customers in your company');
      }
    } else if (currentRole === Role.CUSTOMER) {
      // Customer can only talk to ADMIN/STAFF in their company
      if (targetRole.role !== Role.ADMIN && targetRole.role !== Role.STAFF) {
        throw new Error('You can only message your company admins or staff');
      }
    } else {
      throw new Error('Unsupported role for chat');
    }

    const userIds = [currentUserId, withUserId];

    // Idempotent: check for existing conversation
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'USER_TO_USER',
        companyId,
        OR: [
          {
            userOneId: userIds[0],
            userTwoId: userIds[1]
          },
          {
            userOneId: userIds[1],
            userTwoId: userIds[0]
          }
        ]
      }
    });

    if (existing) {
      return existing;
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'USER_TO_USER',
        companyId,
        userOneId: userIds[0],
        userTwoId: userIds[1]
      }
    });

    return conversation;
  }

  /**
   * Send a message in a conversation as a normal authenticated user.
   * Ensures the user is a participant and belongs to the same tenant.
   * Also handles sending messages in SUPERADMIN_TO_CUSTOMER conversations
   * from the customer's side.
   */
  static async sendMessageAsUser(input: SendMessageInput) {
    const { conversationId, senderUserId, companyId, content } = input;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Handle USER_TO_USER conversations
    if (conversation.type === 'USER_TO_USER') {
      // Tenant isolation: user must be acting inside the conversation's company
      if (conversation.companyId !== companyId) {
        throw new Error('You do not have access to this conversation');
      }

      // Validate membership
      const isParticipant =
        conversation.userOneId === senderUserId ||
        conversation.userTwoId === senderUserId;

      if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
      }
    }
    // Handle SUPERADMIN_TO_CUSTOMER conversations (customer replying to super admin)
    else if (conversation.type === 'SUPERADMIN_TO_CUSTOMER') {
      // Customer must be the targetUserId
      if (conversation.targetUserId !== senderUserId) {
        throw new Error('You are not a participant in this conversation');
      }
      // Tenant isolation
      if (conversation.companyId !== companyId) {
        throw new Error('You do not have access to this conversation');
      }
    }
    // Handle SUPERADMIN_TO_COMPANY conversations (company user replying)
    else if (conversation.type === 'SUPERADMIN_TO_COMPANY') {
      // Tenant isolation - user must be in the company
      if (conversation.companyId !== companyId) {
        throw new Error('You do not have access to this conversation');
      }
      // Any ADMIN/STAFF in the company can reply
    }
    else {
      throw new Error('Unsupported conversation type');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderUserId,
        content,
        isSuperAdminSender: false
      }
    });

    return message;
  }

  /**
   * List all conversations for the current user within the current tenant.
   * Includes:
   * - USER_TO_USER conversations where user is a participant
   * - SUPERADMIN_TO_CUSTOMER conversations where user is the target customer
   * - SUPERADMIN_TO_COMPANY conversations for users in that company
   */
  static async listUserConversations(userId: string, companyId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        companyId,
        OR: [
          // USER_TO_USER where user is participant
          {
            type: 'USER_TO_USER',
            OR: [
              { userOneId: userId },
              { userTwoId: userId }
            ]
          },
          // SUPERADMIN_TO_CUSTOMER where user is the target customer
          {
            type: 'SUPERADMIN_TO_CUSTOMER',
            targetUserId: userId
          },
          // SUPERADMIN_TO_COMPANY for this company (all company users can see)
          {
            type: 'SUPERADMIN_TO_COMPANY'
          }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        userOne: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            senderUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    return conversations;
  }

  /**
   * Get a single conversation with its messages for a user,
   * enforcing tenant + membership checks.
   * Handles USER_TO_USER, SUPERADMIN_TO_CUSTOMER, and SUPERADMIN_TO_COMPANY types.
   */
  static async getUserConversation(
    conversationId: string,
    userId: string,
    companyId: string
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        userOne: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            senderUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Tenant isolation
    if (conversation.companyId !== companyId) {
      throw new Error('You do not have access to this conversation');
    }

    // Validate access based on conversation type
    if (conversation.type === 'USER_TO_USER') {
      const isParticipant =
        conversation.userOneId === userId ||
        conversation.userTwoId === userId;
      if (!isParticipant) {
        throw new Error('You are not a participant in this conversation');
      }
    } else if (conversation.type === 'SUPERADMIN_TO_CUSTOMER') {
      if (conversation.targetUserId !== userId) {
        throw new Error('You are not a participant in this conversation');
      }
    }
    // SUPERADMIN_TO_COMPANY - any user in the company can access

    return conversation;
  }

  // ==================== SUPER ADMIN CHAT ====================

  /**
   * Super Admin <-> Company conversation.
   * Super Admin is global and NOT bound by companyId checks, but we still
   * store the companyId on the conversation for filtering.
   */
  static async startConversationSuperAdminWithCompany(
    input: SuperAdminStartCompanyChatInput
  ) {
    const { companyId } = input;

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'SUPERADMIN_TO_COMPANY',
        companyId
      }
    });

    if (existing) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        type: 'SUPERADMIN_TO_COMPANY',
        companyId
      }
    });
  }

  /**
   * Super Admin <-> Customer conversation.
   * We bind to the customer user and their company; Super Admin bypasses
   * normal tenant membership checks.
   */
  static async startConversationSuperAdminWithCustomer(
    input: SuperAdminStartCustomerChatInput
  ) {
    const { customerUserId, companyId } = input;

    // Find customer's company role (must be CUSTOMER)
    const customerRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: customerUserId,
        role: Role.CUSTOMER,
        ...(companyId ? { companyId } : {}),
        isActive: true
      }
    });

    if (!customerRole) {
      throw new Error('Customer not found for the specified company');
    }

    const effectiveCompanyId = customerRole.companyId;

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'SUPERADMIN_TO_CUSTOMER',
        companyId: effectiveCompanyId,
        targetUserId: customerUserId
      }
    });

    if (existing) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        type: 'SUPERADMIN_TO_CUSTOMER',
        companyId: effectiveCompanyId,
        targetUserId: customerUserId
      }
    });
  }

  /**
   * Send message as Super Admin. Super Admin is represented via
   * isSuperAdminSender = true and no senderUserId.
   */
  static async sendMessageAsSuperAdmin(input: SuperAdminSendMessageInput) {
    const { conversationId, content } = input;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (
      conversation.type !== 'SUPERADMIN_TO_COMPANY' &&
      conversation.type !== 'SUPERADMIN_TO_CUSTOMER'
    ) {
      throw new Error('This conversation does not belong to Super Admin');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        isSuperAdminSender: true
      }
    });

    return message;
  }

  /**
   * List all conversations visible to Super Admin (across companies).
   * Includes company, target user, and message sender info.
   */
  static async listSuperAdminConversations() {
    return prisma.conversation.findMany({
      where: {
        type: {
          in: ['SUPERADMIN_TO_COMPANY', 'SUPERADMIN_TO_CUSTOMER']
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            senderUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get a single Super Admin conversation with messages.
   * Includes company, target user, and message sender info.
   */
  static async getSuperAdminConversation(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            senderUser: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (
      conversation.type !== 'SUPERADMIN_TO_COMPANY' &&
      conversation.type !== 'SUPERADMIN_TO_CUSTOMER'
    ) {
      throw new Error('This conversation does not belong to Super Admin');
    }

    return conversation;
  }
}

export default ChatService;


