import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ChatService } from '../services/chat.service';
import { SuperAdminRequest } from '../middleware/superAdmin.middleware';

// ========== Standard user chat (ADMIN / STAFF / CUSTOMER) ==========

export const startConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.companyId || !req.userRole) {
      res.status(400).json({
        success: false,
        message: 'User, role, and company context are required'
      });
      return;
    }

    const { withUserId } = req.body as { withUserId: string };

    if (!withUserId) {
      res.status(400).json({
        success: false,
        message: 'withUserId is required'
      });
      return;
    }

    const conversation = await ChatService.startConversationForUser({
      currentUserId: req.user.id,
      currentRole: req.userRole,
      companyId: req.companyId,
      withUserId
    });

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start conversation'
    });
  }
};

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({
        success: false,
        message: 'User and company context are required'
      });
      return;
    }

    const { conversationId, content } = req.body as {
      conversationId: string;
      content: string;
    };

    if (!conversationId || !content) {
      res.status(400).json({
        success: false,
        message: 'conversationId and content are required'
      });
      return;
    }

    const message = await ChatService.sendMessageAsUser({
      conversationId,
      senderUserId: req.user.id,
      companyId: req.companyId,
      content
    });

    res.json({
      success: true,
      data: { message }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

export const listConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({
        success: false,
        message: 'User and company context are required'
      });
      return;
    }

    const conversations = await ChatService.listUserConversations(
      req.user.id,
      req.companyId
    );

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list conversations'
    });
  }
};

export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(400).json({
        success: false,
        message: 'User and company context are required'
      });
      return;
    }

    const { conversationId } = req.params;

    const conversation = await ChatService.getUserConversation(
      conversationId,
      req.user.id,
      req.companyId
    );

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load conversation'
    });
  }
};

// ========== Super Admin chat endpoints ==========

/**
 * NOTE: Super Admin chat endpoints intentionally bypass tenant middleware.
 * Super Admin is authenticated via `authenticateSuperAdmin` and can
 * start conversations with ANY company or customer across tenants.
 */

export const superAdminStartWithCompany = async (
  req: SuperAdminRequest,
  res: Response
): Promise<void> => {
  try {
    const { companyId } = req.body as { companyId: string };

    if (!companyId) {
      res.status(400).json({
        success: false,
        message: 'companyId is required'
      });
      return;
    }

    const conversation = await ChatService.startConversationSuperAdminWithCompany({
      companyId
    });

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start conversation'
    });
  }
};

export const superAdminStartWithCustomer = async (
  req: SuperAdminRequest,
  res: Response
): Promise<void> => {
  try {
    const { customerUserId, companyId } = req.body as {
      customerUserId: string;
      companyId?: string;
    };

    if (!customerUserId) {
      res.status(400).json({
        success: false,
        message: 'customerUserId is required'
      });
      return;
    }

    const conversation =
      await ChatService.startConversationSuperAdminWithCustomer({
        customerUserId,
        companyId
      });

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start conversation'
    });
  }
};

export const superAdminSendMessage = async (
  req: SuperAdminRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId, content } = req.body as {
      conversationId: string;
      content: string;
    };

    if (!conversationId || !content) {
      res.status(400).json({
        success: false,
        message: 'conversationId and content are required'
      });
      return;
    }

    const message = await ChatService.sendMessageAsSuperAdmin({
      conversationId,
      content
    });

    res.json({
      success: true,
      data: { message }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

export const superAdminListConversations = async (
  _req: SuperAdminRequest,
  res: Response
): Promise<void> => {
  try {
    const conversations = await ChatService.listSuperAdminConversations();

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list conversations'
    });
  }
};

export const superAdminGetConversation = async (
  req: SuperAdminRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;

    const conversation = await ChatService.getSuperAdminConversation(
      conversationId
    );

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to load conversation'
    });
  }
};


