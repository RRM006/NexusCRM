import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './lib/prisma';

// Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import userCompanyRoleRoutes from './routes/userCompanyRole.routes';
import customerRoutes from './routes/customer.routes';
import leadRoutes from './routes/lead.routes';
import contactRoutes from './routes/contact.routes';
import taskRoutes from './routes/task.routes';
import noteRoutes from './routes/note.routes';
import activityRoutes from './routes/activity.routes';
import dashboardRoutes from './routes/dashboard.routes';
import issueRoutes from './routes/issue.routes';
import telegramRoutes from './routes/telegram.routes';
import emailRoutes from './routes/email.routes';
import aiRoutes from './routes/ai.routes';
import pipelineRoutes from './routes/pipeline.routes';
import dealRoutes from './routes/deal.routes';
import superAdminRoutes from './routes/superAdmin.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';

// Socket.io
import { initializeSocket } from './socket';

// Telegram Bot
import { initBot } from './telegram/bot';
import { initScheduler } from './telegram/scheduler';

dotenv.config();

const app = express();
const httpServer = createServer(app);
export { prisma };

// Initialize Socket.io
const io = initializeSocket(httpServer);
export { io };

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/user-company-roles', userCompanyRoleRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL database');
    
    // Initialize Telegram Bot (if token is configured)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    if (telegramToken) {
      const bot = initBot(telegramToken);
      
      // Use webhook in production, polling in development
      if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
        await bot.telegram.setWebhook(process.env.TELEGRAM_WEBHOOK_URL);
        app.use(bot.webhookCallback('/telegram-webhook'));
        console.log('🤖 Telegram bot initialized with webhook');
      } else {
        bot.launch();
        console.log('🤖 Telegram bot initialized with polling');
      }
      
      // Initialize notification scheduler
      initScheduler();
    } else {
      console.log('⚠️ Telegram bot not configured (TELEGRAM_BOT_TOKEN not set)');
    }
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
