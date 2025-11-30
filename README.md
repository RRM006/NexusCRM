# NexusCRM - Modern Multi-Tenant CRM Application

A complete, modern multi-tenant CRM web application built with React, Node.js, Express, Prisma, and PostgreSQL, featuring real-time WebRTC voice calling.

## Features

### Multi-Tenant Architecture
- **Multiple Companies**: Users can belong to multiple companies with different roles
- **Role-Based Access Control**: ADMIN, STAFF, and CUSTOMER roles with granular permissions
- **Workspace Switching**: Seamlessly switch between companies and roles
- **Tenant Isolation**: Complete data isolation between companies

### User Management
- **Unified User System**: Single account across all companies
- **JWT Authentication**: Secure authentication with access and refresh tokens
- **Google OAuth Sign-In**: Sign in with Google account (auto-creates or links accounts)
- **Profile Management**: Update profile information and change password

### CRM Modules
- **Customers**: View users who joined as customers (Admin only)
- **Leads**: Track sales pipeline with status management
- **Contacts**: Maintain contact directory
- **Issues**: Customer support system with call logging
- **Tasks**: Create and manage tasks with priorities and due dates
- **Notes**: Keep track of important information
- **Activities**: Activity timeline for all CRM actions

### Issue Management System
- **Customers create issues**: Only customers can submit support issues
- **Admins resolve issues**: Admins can view, update status, and resolve issues
- **Call system**: Admins can log calls for each issue with duration, status, and notes
- **Call history**: View all calls made for each issue

### 🔊 WebRTC Voice Calling
- **Browser-based calling**: No phone or third-party apps needed
- **Customer-to-Admin calls**: Customers can call support directly from their dashboard
- **Real-time notifications**: Admins receive incoming call popups with accept/reject
- **Call flow**: Request → Ringing → Accept → Connect → End
- **Call status indicators**: Shows online agents and connection status
- **Free & peer-to-peer**: Uses WebRTC + Socket.io (no paid APIs like Twilio)

### 🤖 AI Assistant (Gemini)
- **Gemini-powered chatbot**: Intelligent AI assistant in the sidebar
- **Role-based access**: AI only accesses data based on user's permissions
- **CRM context aware**: AI understands your leads, contacts, tasks, and issues
- **Smart suggestions**: Quick prompts based on your role
- **Conversation history**: Save and continue conversations
- **Features include**:
  - Answer questions about CRM data
  - Summarize customer interactions
  - Suggest next actions
  - Draft emails and messages

### 📧 Email Integration (Gmail API)
- **Gmail integration**: Connect your Gmail account to send/receive emails
- **Email compose modal**: Rich text editor with templates support
- **Email tracking**: Open rates, click tracking for sent emails
- **CRM email history**: View all emails sent to contacts, leads, customers
- **Email templates**: Create reusable templates with variable placeholders
- **All roles supported**: Every role can access email functionality

### 🤖 Telegram Bot Integration
- **Full CRM access via Telegram**: Manage leads, tasks, issues from your phone
- **Phone number linking**: Auto-link accounts via phone number verification
- **Real-time notifications**: Get notified about new leads, tasks, issues
- **Interactive commands**: View dashboard, manage data with inline keyboards
- **All roles supported**: Admins, Staff, and Customers can use the bot
- **Scheduled reminders**: Automatic task due date reminders

### Modern UI/UX
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Smooth Animations**: Framer Motion animations throughout
- **Beautiful Components**: Modern card-based design with gradients

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** with custom design system
- **React Router DOM** for routing
- **React Hook Form + Zod** for form validation
- **Axios** for API calls
- **Framer Motion** for animations
- **Lucide React** for icons
- **Socket.io Client** for real-time communication
- **WebRTC** for peer-to-peer audio

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation
- **Socket.io** for WebSocket signaling
- **Telegraf** for Telegram bot
- **node-cron** for scheduled tasks

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn
- Modern browser with WebRTC support (Chrome, Firefox, Edge, Safari)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/modern_crm"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Google OAuth (Optional - for Google Sign-In)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"

# Gmail API (Optional - for Email Integration)
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/email/gmail/callback"
BACKEND_URL="http://localhost:5000"

# Gemini AI (Optional - for AI Assistant)
GEMINI_API_KEY="your-gemini-api-key"

# Telegram Bot (Optional - for Telegram integration)
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/telegram-webhook"  # Production only
```

4. Generate Prisma client and run migrations:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file for frontend configuration:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth & tenant middleware
│   │   ├── routes/             # API routes
│   │   ├── socket/             # Socket.io signaling server
│   │   │   └── index.ts        # WebRTC signaling logic
│   │   ├── validators/         # Request validators
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript types
│   │   └── index.ts            # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── calling/        # Voice calling components
│   │   │       ├── ActiveCallUI.jsx
│   │   │       ├── CallSupportButton.jsx
│   │   │       └── IncomingCallModal.jsx
│   │   ├── context/            # React contexts
│   │   │   └── CallContext.jsx # Call state management
│   │   ├── hooks/              # Custom hooks
│   │   │   └── useWebRTC.js    # WebRTC hook
│   │   ├── lib/                # Utility libraries
│   │   │   ├── socket.js       # Socket.io client
│   │   │   └── webrtc.js       # WebRTC utilities
│   │   ├── layouts/            # Page layouts
│   │   ├── pages/              # Page components
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   └── crm/            # CRM module pages
│   │   ├── services/           # API services
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## Voice Calling System

### Architecture

```
┌─────────────┐     Socket.io      ┌─────────────┐
│   Customer  │◄──────────────────►│   Server    │
│   Browser   │                    │  (Node.js)  │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       │         WebRTC P2P               │
       │◄─────────────────────────────────┤
       │                                   │
       ▼                                   ▼
┌─────────────┐     Socket.io      ┌─────────────┐
│    Admin    │◄──────────────────►│   Server    │
│   Browser   │                    │  (Node.js)  │
└─────────────┘                    └─────────────┘
```

### Call Flow

1. **Customer initiates call**: Click "Call Support" button
2. **Signaling**: Socket.io notifies all online admins in the company
3. **Admin accepts**: Admin clicks "Accept" on incoming call modal
4. **WebRTC negotiation**: 
   - Admin creates offer → sends via Socket.io
   - Customer receives offer → creates answer
   - ICE candidates exchanged
5. **P2P connection**: Direct audio stream between browsers
6. **Call ends**: Either party can end the call

### Components

| Component | Description |
|-----------|-------------|
| `CallSupportButton` | Customer dashboard button to initiate calls |
| `IncomingCallModal` | Admin popup showing incoming call with accept/reject |
| `ActiveCallUI` | Bottom bar during active call with mute/end controls |
| `CallContext` | Global state management for calls |
| `useWebRTC` | Hook for WebRTC peer connection management |

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Register user with socket |
| `call-request` | Client → Server | Customer requests call |
| `incoming-call` | Server → Admin | Notify admin of incoming call |
| `call-accept` | Admin → Server | Admin accepts call |
| `call-connected` | Server → Both | Call established |
| `webrtc-offer` | Peer → Peer | SDP offer |
| `webrtc-answer` | Peer → Peer | SDP answer |
| `webrtc-ice-candidate` | Peer → Peer | ICE candidate exchange |
| `call-end` | Either → Server | End active call |

## 🤖 Telegram Bot Setup

### Creating Your Bot

1. **Open Telegram** and search for `@BotFather`
2. **Send `/newbot`** and follow the prompts
3. **Copy your bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. **Add the token** to your backend `.env` file:
   ```env
   TELEGRAM_BOT_TOKEN="your-bot-token-here"
   ```

### How Users Link Their Account

1. User adds their phone number in **Settings → Telegram** in the CRM
2. User opens the bot in Telegram: `@YourBotName`
3. User clicks **"Share Phone Number"** button
4. Bot automatically links the account if phone matches

### Available Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start bot & link account |
| `/help` | Show all commands |
| `/dashboard` | View CRM statistics |
| `/leads` | List & manage leads |
| `/tasks` | List & manage tasks |
| `/issues` | List & manage issues |
| `/customers` | List customers |
| `/companies` | List your companies |
| `/switch` | Switch active company |
| `/newlead` | Create a new lead |
| `/newtask` | Create a new task |
| `/profile` | View your profile |

### Bot Features

- **Interactive Inline Keyboards**: Quick actions without typing commands
- **Real-time Notifications**:
  - New leads assigned to you
  - Tasks due today/tomorrow
  - New customer issues
  - Issues resolved
  - New customers joined
- **Scheduled Reminders**:
  - Hourly task due reminders
  - Daily overdue task alerts
  - Tomorrow's task preview (5 PM)

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

### Production Deployment

For production, use webhooks instead of polling:

```env
# Backend .env
TELEGRAM_WEBHOOK_URL="https://your-domain.com/telegram-webhook"
NODE_ENV=production
```

The bot automatically switches to webhook mode in production.

## 🔐 Google OAuth Setup

### Creating Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable the Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://your-domain.com` (production)
   - Add authorized redirect URIs (not needed for implicit flow)
5. **Copy the Client ID** (looks like: `xxx.apps.googleusercontent.com`)

### Configuration

**Backend `.env`**:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

**Frontend `.env`**:
```env
VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
```

### How It Works

1. User clicks "Sign in with Google" on login/signup page
2. Google OAuth popup appears for authentication
3. User selects their Google account
4. Backend verifies the Google token
5. If email exists: Links Google account and logs in
6. If new user: Creates account with Google profile info

## 🤖 Gemini AI Setup

### Getting Your API Key

1. **Go to Google AI Studio**: https://aistudio.google.com/
2. **Sign in** with your Google account
3. **Click "Get API Key"** in the top right
4. **Create API Key** for a new or existing project
5. **Copy the API key**

### Configuration

**Backend `.env`**:
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### How It Works

1. Click the **AI Assistant** button in the sidebar (available for all roles)
2. The AI has access to your CRM data based on your role:
   - **ADMIN**: Full access to customers, leads, contacts, tasks, issues, activities
   - **STAFF**: Access to leads, contacts, and tasks
   - **CUSTOMER**: Access to their own issues and tasks only
3. Ask questions, get summaries, or request drafts
4. Conversations are saved and can be continued later

### MCP (Model Context Protocol) Integration

The AI Assistant uses MCP tools to directly interact with your CRM data:

**Available MCP Tools by Role:**

| Tool | ADMIN | STAFF | CUSTOMER | Description |
|------|:-----:|:-----:|:--------:|-------------|
| `get_leads` | ✅ | ✅ | ❌ | Query leads with status filtering |
| `get_lead_details` | ✅ | ✅ | ❌ | Get detailed lead info with tasks/notes |
| `get_contacts` | ✅ | ✅ | ❌ | Search and list contacts |
| `get_customers` | ✅ | ❌ | ❌ | View customer data |
| `get_tasks` | ✅ | ✅ | ✅ | Query tasks (filtered by role) |
| `get_issues` | ✅ | ✅ | ✅ | View support issues |
| `get_activities` | ✅ | ✅ | ❌ | Get activity timeline |
| `get_dashboard_stats` | ✅ | ✅ | ❌ | Get CRM statistics |
| `create_task` | ✅ | ✅ | ❌ | Create new tasks |
| `update_lead_status` | ✅ | ✅ | ❌ | Update lead pipeline status |
| `create_note` | ✅ | ✅ | ❌ | Add notes to leads/customers |
| `create_issue` | ❌ | ❌ | ✅ | Create support tickets |
| `draft_email` | ✅ | ✅ | ❌ | Generate email drafts |
| `search_crm` | ✅ | ✅ | ❌ | Search across CRM entities |

**Example Prompts:**
- "Show me all leads in negotiation stage"
- "Create a follow-up task for tomorrow"
- "What's the total pipeline value?"
- "Search for contacts named John"
- "Update lead ABC123 to won"

### AI Capabilities by Role

| Role | Can Ask About |
|------|---------------|
| ADMIN | All CRM data, analytics, team tasks, customer insights |
| STAFF | Leads, contacts, assigned tasks, sales pipeline |
| CUSTOMER | Their support issues, task status, general help |

## 📧 Gmail API Setup (For Email Integration)

### Creating Gmail API Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (same project as Google OAuth)
3. **Enable the Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" and enable it
4. **Configure OAuth consent screen** (if not already done):
   - Add these scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
5. **Create OAuth credentials** (if different from sign-in):
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI:
     - `http://localhost:5000/api/email/gmail/callback` (development)
     - `https://your-api-domain.com/api/email/gmail/callback` (production)
6. **Copy the Client ID and Client Secret**

### Configuration

**Backend `.env`**:
```env
# Google OAuth (for Sign-In)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"

# Gmail API (for Email Integration)
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/email/gmail/callback"
BACKEND_URL="http://localhost:5000"
```

### How Email Integration Works

1. User navigates to Email section in the CRM
2. Clicks "Connect Gmail" to authorize
3. User grants permission for email access
4. CRM can now send and read emails from their Gmail account
5. Sent emails are tracked for opens and clicks
6. Email history is linked to contacts, leads, and customers

### Email Tracking

- **Open Tracking**: 1x1 transparent pixel embedded in emails
- **Click Tracking**: Links are replaced with tracking URLs that redirect
- **Statistics**: View open rates, click rates, and bounce rates

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Sign in with Google OAuth
- `DELETE /api/auth/google/unlink` - Unlink Google account
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Companies
- `POST /api/companies` - Create company
- `GET /api/companies/my` - Get user's companies
- `GET /api/companies/search` - Search companies
- `POST /api/companies/join` - Join company as customer
- `GET /api/companies/:id` - Get company details
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### User Company Roles
- `GET /api/user-company-roles/my-roles` - Get user's roles
- `POST /api/user-company-roles/invite` - Invite user to company
- `PUT /api/user-company-roles/:id` - Update user role
- `DELETE /api/user-company-roles/:id` - Remove user
- `DELETE /api/user-company-roles/leave/:companyId` - Leave company

### CRM Modules
Each module supports CRUD operations:
- `GET /api/{module}` - List with pagination
- `GET /api/{module}/:id` - Get single item
- `POST /api/{module}` - Create new item
- `PUT /api/{module}/:id` - Update item
- `DELETE /api/{module}/:id` - Delete item

Modules: `customers`, `leads`, `contacts`, `tasks`, `notes`, `activities`

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/staff` - Staff dashboard
- `GET /api/dashboard/customer` - Customer dashboard

### Telegram
- `PUT /api/telegram/phone` - Update phone number
- `GET /api/telegram/status` - Get Telegram link status
- `DELETE /api/telegram/unlink` - Unlink Telegram account
- `POST /api/telegram/test-notification` - Send test notification
- `GET /api/telegram/notifications` - Get notifications
- `PUT /api/telegram/notifications/:id/read` - Mark notification read
- `PUT /api/telegram/notifications/read-all` - Mark all as read

## User Flow

1. **Landing Page**: Introduction to NexusCRM
2. **Sign Up**: Create a new account
3. **Role Selection**: 
   - Create a new company (become ADMIN)
   - Join existing company as CUSTOMER
4. **Dashboard**: Role-based dashboard view
5. **CRM Modules**: Manage customers, leads, tasks, etc.
6. **Voice Support**: Customers can call support, admins receive calls
7. **Workspace Switching**: Switch between companies/roles

## Multi-Tenant Permission Rules

### ADMIN
- Full access to all CRM data
- Can invite/remove users
- Can manage company settings
- Can delete company
- **Receives incoming support calls**

### STAFF
- Access to customers, leads, contacts
- Can create/edit/delete CRM data
- Cannot manage users or company settings

### CUSTOMER
- Limited view access
- Can see assigned tasks
- Can view activities
- Cannot modify CRM data
- **Can initiate support calls**

## Browser Requirements

For WebRTC voice calling to work, users need:
- **Chrome 74+**, **Firefox 66+**, **Safari 12.1+**, or **Edge 79+**
- Microphone access permission
- HTTPS (required for production, localhost works for development)

## Troubleshooting

### Voice calling not working?

1. **Check microphone permissions**: Browser must have microphone access
2. **Check console for errors**: Look for WebRTC or Socket.io errors
3. **Verify both users are connected**: Check "Call Center Active" status
4. **Try different browsers**: Some older browsers don't support WebRTC
5. **Check firewall**: P2P connections may be blocked by corporate firewalls

### Common Issues

| Issue | Solution |
|-------|----------|
| No audio | Check microphone permissions in browser settings |
| Call not connecting | Ensure both parties have stable internet |
| Admin not receiving calls | Verify admin is logged in and socket is connected |
| "No agents available" | No admin is currently online for that company |

## License

MIT License - feel free to use this project for learning or commercial purposes.
