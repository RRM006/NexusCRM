import { Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import { generateAIResponse, generateConversationTitle, getQuickSuggestions, getAvailableToolsDescription } from '../services/ai.service';
import { getToolsForRole } from '../services/mcp-tools';
import { Role } from '@prisma/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
}

/**
 * Send a message to AI and get response
 */
export const chat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { message, conversationId, context } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    // Build context-aware message
    let contextualMessage = message;
    if (context) {
      const contextParts: string[] = [];
      
      if (context.currentPage) {
        contextParts.push(`[User is currently on the ${context.currentPage} page]`);
      }
      if (context.selectedEntity) {
        contextParts.push(`[User is viewing ${context.selectedEntity.type}: ${context.selectedEntity.name || context.selectedEntity.id}]`);
      }
      if (context.recentActions && context.recentActions.length > 0) {
        contextParts.push(`[Recent actions: ${context.recentActions.join(', ')}]`);
      }
      
      if (contextParts.length > 0) {
        contextualMessage = `${contextParts.join(' ')}\n\nUser message: ${message}`;
      }
    }

    // Get user's role for this company
    const userRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId: req.companyId,
        isActive: true
      }
    });

    if (!userRole) {
      res.status(403).json({ success: false, message: 'No active role in this company' });
      return;
    }

    let conversation;
    let messages: Message[] = [];

    if (conversationId) {
      // Get existing conversation
      conversation = await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          userId: req.user.id,
          companyId: req.companyId
        }
      });

      if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
      }

      messages = conversation.messages as Message[];
    }

    // Add user message (store original message, but send contextual to AI)
    const userMessage: Message = {
      role: 'user',
      content: message, // Store original message in history
      timestamp: new Date().toISOString()
    };
    messages.push(userMessage);

    // Create messages array for AI with context
    const messagesForAI = [...messages];
    if (contextualMessage !== message) {
      // Replace last message with contextual version for AI processing
      messagesForAI[messagesForAI.length - 1] = {
        ...userMessage,
        content: contextualMessage
      };
    }

    // Generate AI response with MCP tools
    const aiResult = await generateAIResponse(
      messagesForAI,
      req.user.id,
      req.companyId,
      userRole.role as Role
    );

    // Add AI response to messages
    const assistantMessage: Message = {
      role: 'assistant',
      content: aiResult.content,
      timestamp: new Date().toISOString(),
      toolsUsed: aiResult.toolsUsed
    };
    messages.push(assistantMessage);

    if (conversation) {
      // Update existing conversation
      conversation = await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: {
          messages: messages,
          messageCount: messages.length,
          lastMessageAt: new Date()
        }
      });
    } else {
      // Create new conversation
      const title = await generateConversationTitle(message);
      
      conversation = await prisma.aIConversation.create({
        data: {
          title,
          messages: messages,
          userId: req.user.id,
          companyId: req.companyId,
          messageCount: messages.length,
          lastMessageAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: assistantMessage,
        title: conversation.title
      }
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing AI request'
    });
  }
};

/**
 * Get all conversations for user
 */
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const conversations = await prisma.aIConversation.findMany({
      where: {
        userId: req.user.id,
        companyId: req.companyId
      },
      select: {
        id: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations'
    });
  }
};

/**
 * Get a specific conversation
 */
export const getConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: req.user.id,
        companyId: req.companyId
      }
    });

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation'
    });
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id,
        userId: req.user.id,
        companyId: req.companyId
      }
    });

    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    await prisma.aIConversation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation'
    });
  }
};

/**
 * Get quick suggestions based on user's role
 */
export const getSuggestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Get user's role for this company
    const userRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId: req.companyId,
        isActive: true
      }
    });

    if (!userRole) {
      res.status(403).json({ success: false, message: 'No active role in this company' });
      return;
    }

    const suggestions = getQuickSuggestions(userRole.role as Role);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions'
    });
  }
};

/**
 * Clear all conversations for user in current company
 */
export const clearConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await prisma.aIConversation.deleteMany({
      where: {
        userId: req.user.id,
        companyId: req.companyId
      }
    });

    res.json({
      success: true,
      message: 'All conversations cleared'
    });
  } catch (error) {
    console.error('Clear conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing conversations'
    });
  }
};

/**
 * Get available MCP tools for the current user's role
 */
export const getTools = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Get user's role for this company
    const userRole = await prisma.userCompanyRole.findFirst({
      where: {
        userId: req.user.id,
        companyId: req.companyId,
        isActive: true
      }
    });

    if (!userRole) {
      res.status(403).json({ success: false, message: 'No active role in this company' });
      return;
    }

    const tools = getToolsForRole(userRole.role as Role);
    const toolDescriptions = getAvailableToolsDescription(userRole.role as Role);

    res.json({
      success: true,
      data: {
        role: userRole.role,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        })),
        descriptions: toolDescriptions
      }
    });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available tools'
    });
  }
};

