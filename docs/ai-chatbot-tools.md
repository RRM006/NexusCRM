# AI Chatbot & MCP Tools Documentation

## Overview

NexusCRM includes an AI-powered chatbot assistant that can perform real CRM operations through natural language. The system uses **MCP (Model Context Protocol)** tools to interact with CRM data, enabling users to create, update, and query information without using the traditional UI.

### Key Features
- **Natural Language Processing**: Users can ask questions or give commands in plain English
- **Real-time Actions**: All operations are executed immediately and saved to the database
- **Role-based Access**: Tools are filtered based on user role (ADMIN, STAFF, CUSTOMER)
- **Activity Logging**: All AI-initiated actions are logged in the activity timeline
- **Page Integration**: Items created via AI appear on their respective pages

---

## How It Works

1. User sends a message in the AI chatbot
2. The AI (Google Gemini) analyzes the request
3. If action is needed, the AI calls the appropriate MCP tool
4. The tool executes the operation in the database
5. The result is returned to the AI
6. AI confirms the action with real data
7. The created/updated item appears on the relevant page

---

## Available Tools by Category

### 📋 Lead Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_lead` | Create a new lead/prospect | firstName, lastName | ADMIN, STAFF |
| `get_leads` | List leads with filtering | - | ADMIN, STAFF |
| `get_lead_details` | Get detailed lead info | leadId | ADMIN, STAFF |
| `update_lead_status` | Update lead status | leadId, status | ADMIN, STAFF |
| `move_lead_stage` | Move lead to pipeline stage | leadId, stageName | ADMIN, STAFF |
| `convert_lead_to_deal` | Convert lead to deal | leadId | ADMIN, STAFF |

**Example Prompts:**
- "Create a lead for John Smith from ABC Company, email john@abc.com"
- "Show me all new leads"
- "Move lead to Qualified stage"
- "Convert this lead to a deal worth $50,000"

### 💼 Deal Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_deal` | Create a new deal | title | ADMIN, STAFF |
| `get_deals` | List deals with filtering | - | ADMIN, STAFF |
| `update_deal_status` | Mark deal as WON/LOST | dealId, status | ADMIN, STAFF |

**Example Prompts:**
- "Create a deal called 'Enterprise Contract' worth $100,000"
- "Show all active deals"
- "Mark this deal as won"
- "List deals we lost this month"

### 👤 Contact Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_contact` | Create a new contact | firstName, lastName | ADMIN, STAFF |
| `get_contacts` | List contacts | - | ADMIN, STAFF |

**Example Prompts:**
- "Add contact Sarah Johnson, email sarah@company.com, phone 555-1234"
- "Find contacts at TechCorp"

### 👥 Customer Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_customer` | Create a new customer | name, email | ADMIN |
| `get_customers` | List customers | - | ADMIN |

**Example Prompts:**
- "Create a customer: Acme Corp, billing@acme.com"
- "Show all active customers"

### ✅ Task Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_task` | Create a new task | title | ADMIN, STAFF |
| `get_tasks` | List tasks | - | ALL |
| `update_task_status` | Update task status | taskId, status | ALL |

**Example Prompts:**
- "Create a task: Follow up with client, due Friday"
- "Show my overdue tasks"
- "Mark task as completed"

### 🎫 Issue/Ticket Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_issue` | Create a support issue | title, description | ALL |
| `get_issues` | List issues | - | ALL |
| `update_issue_status` | Update issue status | issueId, status | ADMIN, STAFF |

**Example Prompts:**
- "Create an issue: Payment not processing - Customer reports payment fails at checkout"
- "Show all open tickets"
- "Resolve issue with note: Fixed by clearing cache"

### 📋 Pipeline Management

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `get_pipeline_stages` | Get pipeline stages | - | ADMIN, STAFF |

**Example Prompts:**
- "Show me the pipeline stages"
- "How many leads are in each stage?"

### 📝 Notes & Activities

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `create_note` | Create a note | content | ADMIN, STAFF |
| `log_activity` | Log CRM activity | type, title | ADMIN, STAFF |
| `log_call` | Log a phone call | contactName, outcome | ADMIN, STAFF |
| `get_activities` | View activity timeline | - | ADMIN, STAFF |

**Example Prompts:**
- "Add note: Customer prefers email communication"
- "Log call with John - 15 minutes, discussed pricing, callback scheduled"
- "Show recent activities"

### 📧 Email

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `send_email` | Create and queue email | toEmail, subject, body | ADMIN, STAFF |
| `draft_email` | Draft email content | purpose | ADMIN, STAFF |

**Example Prompts:**
- "Send email to john@company.com, subject: Meeting Follow-up"
- "Draft a follow-up email for our meeting yesterday"

### 🔍 Search & Dashboard

| Tool | Description | Required Parameters | Available To |
|------|-------------|---------------------|--------------|
| `search_crm` | Search all CRM data | query | ADMIN, STAFF |
| `get_dashboard_stats` | Get CRM statistics | - | ADMIN, STAFF |

**Example Prompts:**
- "Search for anything related to 'enterprise'"
- "Give me a dashboard summary"

---

## Role-Based Access

### ADMIN
- Full access to all tools
- Can create/manage customers
- Can view all data across the company

### STAFF
- Can manage leads, deals, contacts, tasks
- Cannot create customers directly
- Can view assigned and company data

### CUSTOMER
- Can view their own issues and tasks
- Can create support issues/tickets
- Can update their assigned tasks

---

## Integration with CRM Pages

When you create or update items via the AI chatbot, they **immediately appear** on the corresponding pages:

| Action | Page Location |
|--------|---------------|
| Create Lead | CRM → Leads, Pipeline (Kanban) |
| Create Contact | CRM → Contacts |
| Create Customer | CRM → Customers |
| Create Task | CRM → Tasks |
| Create Issue | CRM → Issues |
| Create Deal | CRM → Pipeline (Deals view) |
| Create Note | Lead/Customer detail pages |
| Log Activity | CRM → Activities |
| Send Email | Email page |

---

## Technical Architecture

### AI Model
- **Provider**: Google Gemini
- **Model**: gemini-2.0-flash (configurable via GEMINI_MODEL env)
- **Features**: Function calling for tool execution

### Tool Execution Flow
```
User Message → Gemini AI → Tool Detection → MCP Tool Execution
     ↓                                            ↓
Response ← AI Formats Result ← Database Operation
```

### Database Integration
- All tools use Prisma ORM
- Multi-tenant isolation via companyId
- Activity logging for audit trail
- Real-time data consistency

---

## Configuration

### Environment Variables
```env
GEMINI_API_KEY=your_google_ai_api_key
GEMINI_MODEL=gemini-2.0-flash  # Optional, defaults to gemini-2.0-flash
```

### Supported Gemini Models
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-2.0-flash (recommended)
- gemini-2.0-flash-lite
- gemini-2.5-flash
- gemini-2.5-pro

---

## Troubleshooting

### "Tool not working"
1. Check user role - some tools are role-restricted
2. Verify required parameters are provided
3. Check browser console for errors

### "AI not using tools"
1. Be specific in your request
2. Include key action words: "create", "add", "update", "show", "list"
3. Provide required information upfront

### "Created item not showing"
1. Refresh the target page
2. Check filters aren't hiding the item
3. Verify the correct company context

### "Permission denied"
1. Verify user role has access
2. Check company context is set
3. Confirm data belongs to user's company

---

## Best Practices

1. **Be Specific**: "Create a lead for John Smith at Tech Corp" works better than "add lead"

2. **Provide Context**: Include relevant details like email, phone, value

3. **Use Natural Language**: The AI understands conversational requests

4. **Check Results**: AI will confirm with actual data - verify it's correct

5. **Use for Bulk Actions**: Great for quick data entry via conversation

---

## Examples

### Creating a Complete Lead
```
User: Create a lead for Jane Doe from ABC Corp, email jane@abc.com, 
      phone 555-1234, source is referral, estimated value $25000

AI: ✅ Lead created successfully!
    - Name: Jane Doe
    - Company: ABC Corp
    - Email: jane@abc.com
    - Value: $25,000
    - Status: New
```

### Logging a Sales Call
```
User: Log a call with Mike Johnson, 20 minutes, discussed pricing, 
      he's interested but needs board approval, callback next week

AI: ✅ Call logged!
    - Contact: Mike Johnson
    - Duration: 20 minutes
    - Outcome: Callback Scheduled
    - Notes: Discussed pricing, interested but needs board approval
```

### Creating a Support Issue
```
User: I can't access my billing page, it shows error 500

AI: ✅ Support issue created!
    - Title: Cannot access billing page
    - Description: User reports error 500 when accessing billing page
    - Priority: Medium
    - Status: Open
    - ID: ISS-1234
```

---

## API Reference

For developers extending the MCP tools, see:
- `backend/src/services/mcp-tools.ts` - Tool definitions and executors
- `backend/src/services/ai.service.ts` - AI integration
- `backend/src/controllers/ai.controller.ts` - API endpoints

---

*Last Updated: December 2024*

