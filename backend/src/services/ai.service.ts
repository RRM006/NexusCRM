import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../index';
import { Role } from '@prisma/client';
import { getToolsForRole, executeTool } from './mcp-tools';

// Model to use - gemini-2.0-flash supports function calling and works on free tier
// gemini-pro does NOT support function calling
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Models that support function calling
const FUNCTION_CALLING_MODELS = [
  'gemini-1.5-pro', 'gemini-1.5-flash', 
  'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-exp', 'gemini-2.0-flash-lite',
  'gemini-2.5-flash', 'gemini-2.5-pro',
  'gemini-flash-latest', 'gemini-pro-latest'
];
const supportsFunctionCalling = FUNCTION_CALLING_MODELS.some(m => GEMINI_MODEL.includes(m));

// Debug logging
console.log(`[AI Service] Using model: ${GEMINI_MODEL}`);
console.log(`[AI Service] Function calling supported: ${supportsFunctionCalling}`);

// Schema types for Gemini function declarations
const SchemaType = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT'
} as const;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// System prompts based on role
const SYSTEM_PROMPTS = {
  ADMIN: `You are an AI assistant for NexusCRM. You have FULL ACCESS to CRM data and can perform real actions.

AVAILABLE ACTIONS - YOU MUST USE THESE TOOLS:
- create_lead: Create new leads/prospects (requires firstName, lastName)
- create_contact: Create new contacts
- create_customer: Create new customers
- create_task: Create tasks
- create_note: Add notes to leads/customers
- get_leads, get_contacts, get_customers, get_tasks, get_issues: Query data
- update_lead_status: Update lead pipeline status
- search_crm: Search across all CRM data

CRITICAL RULES:
1. When user provides data to create something, IMMEDIATELY call the tool - don't ask for confirmation
2. When user asks to "create a lead" with info like name, email, phone - USE create_lead tool RIGHT NOW
3. After the tool executes, confirm what was created with the actual data returned
4. NEVER pretend to create something - ALWAYS use the tool
5. If tool fails, report the actual error

Be concise. Use bullet points. Confirm actions with real data.`,

  STAFF: `You are an AI assistant for NexusCRM. You can access leads, contacts, tasks, and activities.

AVAILABLE ACTIONS - USE THESE TOOLS:
- create_lead: Create new leads (requires firstName, lastName)
- create_contact: Create contacts
- create_task: Create tasks
- create_note: Add notes
- get_leads, get_contacts, get_tasks: Query data
- update_lead_status: Update lead status
- search_crm: Search CRM

CRITICAL RULES:
1. When user provides info to create something, IMMEDIATELY call the tool
2. Don't ask for confirmation - just create it with the provided data
3. After tool executes, confirm with the actual returned data
4. NEVER pretend - ALWAYS use tools for real actions

Be concise and professional.`,

  CUSTOMER: `You are an AI assistant for NexusCRM. You can view your issues and tasks, and create support tickets.

AVAILABLE ACTIONS:
- get_issues: View your support issues
- get_tasks: View tasks assigned to you
- create_issue: Create a new support issue

CRITICAL RULES:
1. When user wants to create an issue, IMMEDIATELY use create_issue tool
2. Confirm actions with actual data from the tool response
3. NEVER pretend to do something - ALWAYS use the tool

Be friendly and helpful.`
};

interface Message {
  role: 'user' | 'assistant' | 'function';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
}

/**
 * Convert MCP tools to Gemini function declaration format
 */
function getGeminiFunctionDeclarations(role: Role) {
  const tools = getToolsForRole(role);
  
  return tools.map(tool => {
    const properties: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(tool.parameters.properties || {})) {
      const prop: any = value;
      properties[key] = {
        type: getSchemaType(prop.type),
        description: prop.description || ''
      };
      if (prop.enum) {
        properties[key].enum = prop.enum;
      }
    }
    
    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties,
        required: tool.parameters.required || []
      }
    };
  });
}

function getSchemaType(type: string): string {
  switch (type?.toLowerCase()) {
    case 'number':
    case 'integer':
      return SchemaType.NUMBER;
    case 'boolean':
      return SchemaType.BOOLEAN;
    case 'array':
      return SchemaType.ARRAY;
    case 'object':
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING;
  }
}

/**
 * Generate AI response using Gemini with function calling (MCP)
 */
export async function generateAIResponse(
  messages: Message[],
  userId: string,
  companyId: string,
  role: Role
): Promise<{ content: string; toolsUsed?: string[] }> {
  if (!genAI) {
    throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY environment variable.');
  }

  const systemPrompt = SYSTEM_PROMPTS[role];
  const toolsUsed: string[] = [];

  try {
    // Check if function calling is supported
    let functionDeclarations: any[] = [];
    
    if (supportsFunctionCalling) {
      try {
        functionDeclarations = getGeminiFunctionDeclarations(role);
        console.log(`MCP tools enabled: ${functionDeclarations.length} tools available for ${role}`);
      } catch (e) {
        console.warn('Failed to get function declarations, proceeding without tools:', e);
        functionDeclarations = [];
      }
    } else {
      console.log(`Model ${GEMINI_MODEL} does not support function calling. Using simple mode.`);
    }

    const modelConfig: any = { model: GEMINI_MODEL };
    
    // Only add tools if model supports it and we have valid declarations
    if (supportsFunctionCalling && functionDeclarations.length > 0) {
      modelConfig.tools = [{ functionDeclarations }];
    }

    const model = genAI.getGenerativeModel(modelConfig);

    // Build conversation history for Gemini
    const history: any[] = [];
    
    // Add previous messages (excluding the last user message)
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.role === 'user') {
        history.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        history.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Create chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System: ${systemPrompt}\n\nPlease acknowledge and wait for my question.` }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m your CRM assistant with access to your data based on your role. How can I help you today?' }]
        },
        ...history
      ]
    });

    // Send the last user message
    const lastMessage = messages[messages.length - 1];
    let result = await chat.sendMessage(lastMessage.content);
    let response = result.response;

    // Handle function calls (MCP tool execution)
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    while (iterations < maxIterations) {
      const functionCalls = response.functionCalls();
      
      if (!functionCalls || functionCalls.length === 0) {
        if (iterations === 0) {
          console.log(`[AI] No function calls in response. Model gave direct answer.`);
        }
        break;
      }
      
      console.log(`[AI] Received ${functionCalls.length} function call(s) from Gemini`);
      
      iterations++;
      
      // Execute each function call
      const functionResponses: any[] = [];
      
      for (const call of functionCalls) {
        console.log(`[AI] Executing MCP tool: ${call.name}`);
        console.log(`[AI] Tool args:`, JSON.stringify(call.args, null, 2));
        toolsUsed.push(call.name);
        
        try {
          const toolResult = await executeTool(
            call.name,
            call.args as Record<string, any>,
            userId,
            companyId,
            role
          );
          
          console.log(`[AI] Tool result for ${call.name}:`, JSON.stringify(toolResult, null, 2));
          
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: toolResult
            }
          });
        } catch (toolError: any) {
          console.error(`[AI] Tool execution error for ${call.name}:`, toolError);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { success: false, error: toolError.message || 'Tool execution failed' }
            }
          });
        }
      }

      // Send function responses back to the model
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    const finalText = response.text();
    
    return {
      content: finalText,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined
    };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // If function calling fails, try without tools
    if (error.message?.includes('tools') || error.message?.includes('function')) {
      console.log('Retrying without function calling...');
      return generateSimpleResponse(messages, systemPrompt);
    }
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to generate AI response. Please try again.');
  }
}

/**
 * Simple response without function calling (fallback)
 */
async function generateSimpleResponse(
  messages: Message[],
  systemPrompt: string
): Promise<{ content: string; toolsUsed?: string[] }> {
  if (!genAI) {
    throw new Error('Gemini API is not configured.');
  }

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  
  const history: any[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      history.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant') {
      history.push({ role: 'model', parts: [{ text: msg.content }] });
    }
  }

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `System: ${systemPrompt}` }] },
      { role: 'model', parts: [{ text: 'I understand. How can I help you?' }] },
      ...history
    ]
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  
  return { content: result.response.text() };
}

/**
 * Generate a title for the conversation based on first message
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  if (!genAI) {
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(
      `Generate a very short title (max 5 words) for a conversation that starts with: "${firstMessage}". Return only the title.`
    );
    return result.response.text().trim().substring(0, 50);
  } catch (error) {
    return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
  }
}

/**
 * Get quick suggestions based on role
 */
export function getQuickSuggestions(role: Role): string[] {
  const suggestions: Record<Role, string[]> = {
    ADMIN: [
      "Show me all leads in the pipeline",
      "What tasks are overdue?",
      "Give me a dashboard summary",
      "Search for contacts with 'john'",
      "Create a follow-up task for tomorrow",
      "What are the critical priority issues?"
    ],
    STAFF: [
      "Show me my assigned tasks",
      "List all new leads",
      "Search for a contact",
      "Create a task for lead follow-up",
      "What leads need attention?"
    ],
    CUSTOMER: [
      "Show my open issues",
      "What's the status of my tickets?",
      "Create a new support issue",
      "Show my assigned tasks"
    ]
  };

  return suggestions[role];
}

/**
 * Get available tools description for a role
 */
export function getAvailableToolsDescription(role: Role): string[] {
  const tools = getToolsForRole(role);
  return tools.map(t => `${t.name}: ${t.description}`);
}
