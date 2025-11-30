import { Router } from 'express';
import {
  chat,
  getConversations,
  getConversation,
  deleteConversation,
  getSuggestions,
  clearConversations,
  getTools
} from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// Chat with AI (uses MCP tools)
router.post('/chat', chat);

// Get quick suggestions
router.get('/suggestions', getSuggestions);

// Get available MCP tools for current role
router.get('/tools', getTools);

// Conversation management
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.delete('/conversations', clearConversations);

export default router;

