import cron from 'node-cron';
import prisma from '../lib/prisma';
import { notifyTaskDue } from './bot';

/**
 * Initialize scheduled tasks for notifications
 */
export const initScheduler = () => {
  console.log('📅 Initializing notification scheduler...');

  // Check for tasks due today - runs every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly task reminder check...');
    await checkTasksDueToday();
  });

  // Check for overdue tasks - runs daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('📋 Running daily overdue task check...');
    await checkOverdueTasks();
  });

  // Check for tasks due tomorrow - runs daily at 5 PM
  cron.schedule('0 17 * * *', async () => {
    console.log('📋 Running tomorrow\'s task reminder...');
    await checkTasksDueTomorrow();
  });

  console.log('✅ Scheduler initialized');
};

/**
 * Find tasks due today and send reminders
 */
async function checkTasksDueToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasksDueToday = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: today,
        lt: tomorrow
      },
      status: { not: 'COMPLETED' }
    },
    include: {
      assignedTo: {
        select: { telegramChatId: true }
      }
    }
  });

  console.log(`Found ${tasksDueToday.length} tasks due today`);

  for (const task of tasksDueToday) {
    if (task.assignedToId && task.assignedTo?.telegramChatId) {
      await notifyTaskDue(task.id);
    }
  }
}

/**
 * Find tasks due tomorrow and send advance reminders
 */
async function checkTasksDueTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const tasksDueTomorrow = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: tomorrow,
        lt: dayAfter
      },
      status: { not: 'COMPLETED' }
    },
    include: {
      assignedTo: {
        select: { telegramChatId: true, id: true }
      }
    }
  });

  console.log(`Found ${tasksDueTomorrow.length} tasks due tomorrow`);

  for (const task of tasksDueTomorrow) {
    if (task.assignedTo?.telegramChatId) {
      await notifyTaskDue(task.id);
    }
  }
}

/**
 * Find overdue tasks and send urgent reminders
 */
async function checkOverdueTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: today },
      status: { not: 'COMPLETED' }
    },
    include: {
      assignedTo: {
        select: { telegramChatId: true, id: true, name: true }
      },
      tenantCompany: true
    }
  });

  console.log(`Found ${overdueTasks.length} overdue tasks`);

  // Group by company for admin notifications
  const tasksByCompany = overdueTasks.reduce((acc, task) => {
    if (!acc[task.companyId]) acc[task.companyId] = [];
    acc[task.companyId].push(task);
    return acc;
  }, {} as Record<string, typeof overdueTasks>);

  // Notify assigned users
  for (const task of overdueTasks) {
    if (task.assignedTo?.telegramChatId) {
      await notifyTaskDue(task.id);
    }
  }

  // Notify admins about overdue tasks in their company
  for (const [companyId, tasks] of Object.entries(tasksByCompany)) {
    const admins = await prisma.userCompanyRole.findMany({
      where: { companyId, role: 'ADMIN' },
      include: { user: { select: { telegramChatId: true, id: true } } }
    });

    for (const admin of admins) {
      if (admin.user.telegramChatId) {
        const { sendTelegramNotification } = await import('./bot');
        await sendTelegramNotification(
          admin.userId,
          '⚠️ Overdue Tasks Alert',
          `You have ${tasks.length} overdue task(s) in your company.\n\nPlease review and take action.`,
          [{ text: 'View Tasks', callback: 'view_tasks' }]
        );
      }
    }
  }
}

export default { initScheduler };

