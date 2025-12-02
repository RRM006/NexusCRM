import { Telegraf, Context, Markup } from 'telegraf';
import prisma from '../lib/prisma';

// Initialize bot (will be set up in initBot)
let bot: Telegraf | null = null;

// ==================== BOT INITIALIZATION ====================

export const initBot = (token: string): Telegraf => {
  bot = new Telegraf(token);

  // Error handling
  bot.catch((err, ctx) => {
    console.error('Telegram bot error:', err);
    ctx.reply('❌ An error occurred. Please try again later.');
  });

  // ==================== COMMANDS ====================

  // /start - Welcome message
  bot.start(async (ctx) => {
    const welcomeMessage = `
🎉 *Welcome to NexusCRM Bot!*

I can help you manage your CRM directly from Telegram.

To get started, you need to link your CRM account using your phone number.

📱 *To link your account:*
1. Go to your CRM Profile Settings
2. Add your phone number: \`${ctx.from?.id ? ctx.from.id : 'your phone'}\`
3. Click "Link Telegram"
4. Or send me your phone number using the button below

Once linked, you'll be able to:
• 📊 View dashboard stats
• 👥 Manage leads & customers
• ✅ Track tasks
• 🎫 Handle issues
• 🔔 Receive notifications
`;

    await ctx.replyWithMarkdown(welcomeMessage, 
      Markup.keyboard([
        [Markup.button.contactRequest('📱 Share Phone Number')],
        ['❓ Help']
      ]).resize()
    );
  });

  // Handle contact sharing
  bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    
    if (!contact.phone_number) {
      return ctx.reply('❌ No phone number received. Please try again.');
    }

    // Normalize phone number - create multiple variants to search
    const rawPhone = contact.phone_number;
    const cleanPhone = rawPhone.replace(/[\s+\-()]/g, ''); // Remove all formatting
    
    // Create search variants for different formats
    const phoneVariants: string[] = [
      rawPhone,                           // Original: +8801718964936
      cleanPhone,                         // No symbols: 8801718964936
      `+${cleanPhone}`,                   // With +: +8801718964936
    ];
    
    // For Bangladesh numbers, also try local format
    if (cleanPhone.startsWith('880')) {
      const localNumber = '0' + cleanPhone.slice(3);  // 8801718964936 -> 01718964936
      phoneVariants.push(localNumber);
      phoneVariants.push(cleanPhone.slice(3));        // Without leading 0: 1718964936
    }
    
    // For numbers starting with 0, also try with country code
    if (cleanPhone.startsWith('0')) {
      phoneVariants.push('880' + cleanPhone.slice(1));  // 01718964936 -> 8801718964936
      phoneVariants.push('+880' + cleanPhone.slice(1)); // 01718964936 -> +8801718964936
    }

    // Remove duplicates
    const uniqueVariants = [...new Set(phoneVariants)];
    
    console.log('Searching for phone variants:', uniqueVariants);
    
    try {
      // Find user by any phone number variant
      const user = await prisma.user.findFirst({
        where: {
          OR: uniqueVariants.map(phone => ({ phone }))
        },
        include: {
          userCompanyRoles: {
            include: {
              company: true
            }
          }
        }
      });

      if (!user) {
        return ctx.replyWithMarkdown(`
❌ *Account Not Found*

No CRM account found with this phone number.

📱 *Your number:* \`${contact.phone_number}\`

*We searched for:*
${uniqueVariants.slice(0, 4).map(v => `• \`${v}\``).join('\n')}

*Steps to fix:*
1. Login to NexusCRM web app
2. Go to Profile (click your name → Profile)
3. Add your phone number in one of these formats:
   • \`${cleanPhone}\`
   • \`+${cleanPhone}\`
4. Save and try sharing your contact again
        `);
      }

      // Link Telegram account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramId: String(ctx.from?.id),
          telegramChatId: String(ctx.chat?.id),
          telegramUsername: ctx.from?.username || null,
          telegramLinkedAt: new Date(),
          isPhoneVerified: true
        }
      });

      const companies = user.userCompanyRoles.map(ucr => 
        `• ${ucr.company.name} (${ucr.role})`
      ).join('\n');

      await ctx.replyWithMarkdown(`
✅ *Account Linked Successfully!*

👤 *Name:* ${user.name}
📧 *Email:* ${user.email}

📁 *Your Companies:*
${companies || 'No companies yet'}

You can now use the bot commands. Type /help to see all available commands.
      `, Markup.keyboard([
        ['📊 Dashboard', '👥 Leads'],
        ['✅ Tasks', '🎫 Issues'],
        ['⚙️ Settings', '❓ Help']
      ]).resize());

    } catch (error) {
      console.error('Error linking account:', error);
      ctx.reply('❌ Error linking account. Please try again later.');
    }
  });

  // /help - Show commands
  bot.help(async (ctx) => {
    await ctx.replyWithMarkdown(`
📚 *NexusCRM Bot Commands*

*Account:*
/start - Start the bot & link account
/profile - View your profile
/companies - List your companies
/switch - Switch active company

*CRM Data:*
/dashboard - View stats overview
/leads - List & manage leads
/customers - List customers
/tasks - List & manage tasks
/issues - List & manage issues

*Quick Actions:*
/newlead - Create a new lead
/newtask - Create a new task
/newissue - Create a new issue

*Notifications:*
/notifications - View recent notifications
/settings - Notification preferences

*Help:*
/help - Show this message
    `);
  });

  // /profile - Show user profile
  bot.command('profile', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    await ctx.replyWithMarkdown(`
👤 *Your Profile*

📛 *Name:* ${user.name}
📧 *Email:* ${user.email}
📱 *Phone:* ${user.phone || 'Not set'}
💬 *Telegram:* @${user.telegramUsername || 'Not linked'}

🔗 *Linked:* ${user.telegramLinkedAt ? new Date(user.telegramLinkedAt).toLocaleDateString() : 'N/A'}
    `);
  });

  // /companies - List user's companies
  bot.command('companies', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companies = await prisma.userCompanyRole.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    if (companies.length === 0) {
      return ctx.reply('📁 You don\'t have any companies yet. Create one in the CRM web app!');
    }

    const companyList = companies.map((ucr, i) => 
      `${i + 1}. *${ucr.company.name}*\n   Role: ${ucr.role} | Industry: ${ucr.company.industry || 'N/A'}`
    ).join('\n\n');

    await ctx.replyWithMarkdown(`
📁 *Your Companies*

${companyList}

Use /switch to change your active company.
    `);
  });

  // /dashboard - Show stats
  bot.command('dashboard', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companyRole = await getActiveCompany(user.id);
    if (!companyRole) {
      return ctx.reply('❌ Please select an active company first. Use /switch');
    }

    const [leads, tasks, issues, customers] = await Promise.all([
      prisma.lead.count({ where: { companyId: companyRole.companyId } }),
      prisma.task.count({ where: { companyId: companyRole.companyId, status: { not: 'COMPLETED' } } }),
      prisma.issue.count({ where: { companyId: companyRole.companyId, status: 'OPEN' } }),
      prisma.userCompanyRole.count({ where: { companyId: companyRole.companyId, role: 'CUSTOMER' } })
    ]);

    const openLeads = await prisma.lead.count({ 
      where: { companyId: companyRole.companyId, status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] } } 
    });

    await ctx.replyWithMarkdown(`
📊 *Dashboard - ${companyRole.company.name}*

👥 *Customers:* ${customers}
🎯 *Total Leads:* ${leads}
📈 *Open Leads:* ${openLeads}
✅ *Pending Tasks:* ${tasks}
🎫 *Open Issues:* ${issues}

_Updated: ${new Date().toLocaleString()}_
    `, Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Refresh', 'refresh_dashboard')],
      [Markup.button.callback('👥 View Leads', 'view_leads'), Markup.button.callback('✅ View Tasks', 'view_tasks')]
    ]));
  });

  // /leads - List leads
  bot.command('leads', async (ctx) => {
    await showLeads(ctx);
  });

  // /tasks - List tasks
  bot.command('tasks', async (ctx) => {
    await showTasks(ctx);
  });

  // /issues - List issues
  bot.command('issues', async (ctx) => {
    await showIssues(ctx);
  });

  // /customers - List customers
  bot.command('customers', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companyRole = await getActiveCompany(user.id);
    if (!companyRole) return ctx.reply('❌ Please select an active company first.');

    const customers = await prisma.userCompanyRole.findMany({
      where: { companyId: companyRole.companyId, role: 'CUSTOMER' },
      include: { user: { select: { name: true, email: true, phone: true } } },
      take: 10
    });

    if (customers.length === 0) {
      return ctx.reply('👥 No customers found in this company.');
    }

    const customerList = customers.map((c, i) => 
      `${i + 1}. *${c.user.name}*\n   📧 ${c.user.email}`
    ).join('\n\n');

    await ctx.replyWithMarkdown(`
👥 *Customers - ${companyRole.company.name}*

${customerList}

_Showing first 10 customers_
    `);
  });

  // /newlead - Create lead
  bot.command('newlead', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companyRole = await getActiveCompany(user.id);
    if (!companyRole) return ctx.reply('❌ Please select an active company first.');

    if (companyRole.role === 'CUSTOMER') {
      return ctx.reply('❌ Customers cannot create leads.');
    }

    // Store state for conversation
    await ctx.replyWithMarkdown(`
🎯 *Create New Lead*

Please enter the lead details in this format:

\`Title | Value | Source\`

*Example:*
\`Enterprise Deal | 50000 | WEBSITE\`

*Available sources:*
WEBSITE, REFERRAL, SOCIAL_MEDIA, EMAIL_CAMPAIGN, COLD_CALL, TRADE_SHOW, OTHER
    `);
    
    // Note: For stateful conversations, you'd typically use Telegraf's session middleware
    // For this implementation, lead creation is done via inline format in a single message
  });

  // /newtask - Create task
  bot.command('newtask', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companyRole = await getActiveCompany(user.id);
    if (!companyRole) return ctx.reply('❌ Please select an active company first.');

    await ctx.replyWithMarkdown(`
✅ *Create New Task*

Please enter the task details in this format:

\`Title | Priority | Due Date\`

*Example:*
\`Follow up with client | HIGH | 2025-12-15\`

*Priorities:* LOW, MEDIUM, HIGH, URGENT
*Date format:* YYYY-MM-DD
    `);
  });

  // /switch - Switch company
  bot.command('switch', async (ctx) => {
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    const companies = await prisma.userCompanyRole.findMany({
      where: { userId: user.id },
      include: { company: true }
    });

    if (companies.length === 0) {
      return ctx.reply('📁 You don\'t have any companies.');
    }

    const buttons = companies.map(c => 
      [Markup.button.callback(`${c.company.name} (${c.role})`, `switch_${c.companyId}`)]
    );

    await ctx.reply('🔄 Select a company to switch to:', Markup.inlineKeyboard(buttons));
  });

  // ==================== CALLBACK QUERIES ====================

  bot.action('refresh_dashboard', async (ctx) => {
    await ctx.answerCbQuery('Refreshing...');
    // Re-run dashboard command
    const user = await getUserFromTelegram(ctx);
    if (user) {
      const companyRole = await getActiveCompany(user.id);
      if (companyRole) {
        const [leads, tasks, issues, customers] = await Promise.all([
          prisma.lead.count({ where: { companyId: companyRole.companyId } }),
          prisma.task.count({ where: { companyId: companyRole.companyId, status: { not: 'COMPLETED' } } }),
          prisma.issue.count({ where: { companyId: companyRole.companyId, status: 'OPEN' } }),
          prisma.userCompanyRole.count({ where: { companyId: companyRole.companyId, role: 'CUSTOMER' } })
        ]);

        await ctx.editMessageText(`
📊 *Dashboard - ${companyRole.company.name}*

👥 *Customers:* ${customers}
🎯 *Total Leads:* ${leads}
✅ *Pending Tasks:* ${tasks}
🎫 *Open Issues:* ${issues}

_Updated: ${new Date().toLocaleString()}_
        `, { parse_mode: 'Markdown' });
      }
    }
  });

  bot.action('view_leads', async (ctx) => {
    await ctx.answerCbQuery();
    await showLeads(ctx);
  });

  bot.action('view_tasks', async (ctx) => {
    await ctx.answerCbQuery();
    await showTasks(ctx);
  });

  // Switch company callback
  bot.action(/switch_(.+)/, async (ctx) => {
    const companyId = ctx.match[1];
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    // Store active company preference (you'd typically store this in DB)
    await ctx.answerCbQuery('Company switched!');
    await ctx.reply(`✅ Switched to company. Use /dashboard to see stats.`);
  });

  // Lead actions
  bot.action(/lead_(.+)_(.+)/, async (ctx) => {
    const action = ctx.match[1];
    const leadId = ctx.match[2];
    
    const user = await getUserFromTelegram(ctx);
    if (!user) return;

    if (action === 'view') {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { assignedTo: true, customer: true }
      });

      if (!lead) return ctx.answerCbQuery('Lead not found');

      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(`
🎯 *Lead Details*

📌 *Title:* ${lead.title}
💰 *Value:* $${lead.value.toLocaleString()}
📊 *Status:* ${lead.status}
🏷️ *Source:* ${lead.source}
👤 *Assigned:* ${lead.assignedTo?.name || 'Unassigned'}

📝 ${lead.description || 'No description'}
      `, Markup.inlineKeyboard([
        [Markup.button.callback('✅ Won', `lead_won_${leadId}`), Markup.button.callback('❌ Lost', `lead_lost_${leadId}`)],
        [Markup.button.callback('📞 Contacted', `lead_contacted_${leadId}`)]
      ]));
    } else if (['won', 'lost', 'contacted'].includes(action)) {
      const statusMap: Record<string, string> = {
        'won': 'WON',
        'lost': 'LOST',
        'contacted': 'CONTACTED'
      };

      await prisma.lead.update({
        where: { id: leadId },
        data: { status: statusMap[action] as any }
      });

      await ctx.answerCbQuery(`Lead marked as ${action.toUpperCase()}`);
      await ctx.reply(`✅ Lead status updated to ${action.toUpperCase()}`);
    }
  });

  // Task actions
  bot.action(/task_(.+)_(.+)/, async (ctx) => {
    const action = ctx.match[1];
    const taskId = ctx.match[2];

    if (action === 'complete') {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      await ctx.answerCbQuery('Task completed!');
      await ctx.reply('✅ Task marked as completed!');
    } else if (action === 'view') {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { assignedTo: true }
      });

      if (!task) return ctx.answerCbQuery('Task not found');

      await ctx.answerCbQuery();
      await ctx.replyWithMarkdown(`
✅ *Task Details*

📌 *Title:* ${task.title}
📊 *Status:* ${task.status}
🔴 *Priority:* ${task.priority}
👤 *Assigned:* ${task.assignedTo?.name || 'Unassigned'}
📅 *Due:* ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}

📝 ${task.description || 'No description'}
      `, task.status !== 'COMPLETED' ? Markup.inlineKeyboard([
        [Markup.button.callback('✅ Mark Complete', `task_complete_${taskId}`)]
      ]) : undefined);
    }
  });

  // Issue actions
  bot.action(/issue_(.+)_(.+)/, async (ctx) => {
    const action = ctx.match[1];
    const issueId = ctx.match[2];

    if (action === 'resolve') {
      const user = await getUserFromTelegram(ctx);
      if (!user) return;

      await prisma.issue.update({
        where: { id: issueId },
        data: { 
          status: 'RESOLVED', 
          resolvedById: user.id,
          resolvedAt: new Date()
        }
      });
      await ctx.answerCbQuery('Issue resolved!');
      await ctx.reply('✅ Issue marked as resolved!');
    }
  });

  // ==================== TEXT HANDLERS ====================

  // Handle keyboard buttons
  bot.hears('📊 Dashboard', async (ctx) => {
    ctx.reply('Loading dashboard...');
    // Trigger dashboard command
    await ctx.telegram.sendMessage(ctx.chat.id, '/dashboard');
  });

  bot.hears('👥 Leads', (ctx) => showLeads(ctx));
  bot.hears('✅ Tasks', (ctx) => showTasks(ctx));
  bot.hears('🎫 Issues', (ctx) => showIssues(ctx));
  bot.hears('❓ Help', (ctx) => ctx.reply('/help'));
  bot.hears('⚙️ Settings', (ctx) => ctx.reply('Settings coming soon! For now, manage settings in the CRM web app.'));

  return bot;
};

// ==================== HELPER FUNCTIONS ====================

async function getUserFromTelegram(ctx: Context): Promise<any | null> {
  const telegramId = String(ctx.from?.id);
  
  const user = await prisma.user.findUnique({
    where: { telegramId }
  });

  if (!user) {
    await ctx.reply('❌ Your Telegram is not linked to a CRM account. Please use /start to link your account.');
    return null;
  }

  return user;
}

async function getActiveCompany(userId: string) {
  // Get the first company (in a real app, you'd store user preference)
  const companyRole = await prisma.userCompanyRole.findFirst({
    where: { userId },
    include: { company: true },
    orderBy: { joinedAt: 'desc' }
  });

  return companyRole;
}

async function showLeads(ctx: Context) {
  const user = await getUserFromTelegram(ctx);
  if (!user) return;

  const companyRole = await getActiveCompany(user.id);
  if (!companyRole) return ctx.reply('❌ Please select an active company first.');

  const leads = await prisma.lead.findMany({
    where: { companyId: companyRole.companyId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (leads.length === 0) {
    return ctx.reply('🎯 No leads found. Create one using /newlead');
  }

  const leadList = leads.map((l, i) => 
    `${i + 1}. *${l.title}*\n   💰 $${l.value.toLocaleString()} | 📊 ${l.status}`
  ).join('\n\n');

  const buttons = leads.slice(0, 5).map(l => 
    [Markup.button.callback(`👁️ ${l.title.substring(0, 20)}`, `lead_view_${l.id}`)]
  );

  await ctx.replyWithMarkdown(`
🎯 *Leads - ${companyRole.company.name}*

${leadList}

_Showing latest 10 leads_
  `, Markup.inlineKeyboard([
    ...buttons,
    [Markup.button.callback('➕ New Lead', 'new_lead')]
  ]));
}

async function showTasks(ctx: Context) {
  const user = await getUserFromTelegram(ctx);
  if (!user) return;

  const companyRole = await getActiveCompany(user.id);
  if (!companyRole) return ctx.reply('❌ Please select an active company first.');

  const tasks = await prisma.task.findMany({
    where: { 
      companyId: companyRole.companyId,
      status: { not: 'COMPLETED' }
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 10
  });

  if (tasks.length === 0) {
    return ctx.reply('✅ No pending tasks. Create one using /newtask');
  }

  const taskList = tasks.map((t, i) => {
    const dueStr = t.dueDate ? `📅 ${new Date(t.dueDate).toLocaleDateString()}` : '';
    return `${i + 1}. *${t.title}*\n   🔴 ${t.priority} | ${t.status} ${dueStr}`;
  }).join('\n\n');

  const buttons = tasks.slice(0, 5).map(t => 
    [
      Markup.button.callback(`👁️ ${t.title.substring(0, 15)}`, `task_view_${t.id}`),
      Markup.button.callback('✅', `task_complete_${t.id}`)
    ]
  );

  await ctx.replyWithMarkdown(`
✅ *Tasks - ${companyRole.company.name}*

${taskList}

_Showing pending tasks_
  `, Markup.inlineKeyboard([
    ...buttons,
    [Markup.button.callback('➕ New Task', 'new_task')]
  ]));
}

async function showIssues(ctx: Context) {
  const user = await getUserFromTelegram(ctx);
  if (!user) return;

  const companyRole = await getActiveCompany(user.id);
  if (!companyRole) return ctx.reply('❌ Please select an active company first.');

  const issues = await prisma.issue.findMany({
    where: { 
      companyId: companyRole.companyId,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  if (issues.length === 0) {
    return ctx.reply('🎫 No open issues.');
  }

  const issueList = issues.map((issue, i) => 
    `${i + 1}. *${issue.title}*\n   🔴 ${issue.priority} | ${issue.status}\n   👤 ${issue.customer?.name || 'Unknown'}`
  ).join('\n\n');

  const buttons = issues.slice(0, 5).map(issue => 
    [
      Markup.button.callback(`👁️ ${issue.title.substring(0, 15)}`, `issue_view_${issue.id}`),
      Markup.button.callback('✅ Resolve', `issue_resolve_${issue.id}`)
    ]
  );

  await ctx.replyWithMarkdown(`
🎫 *Issues - ${companyRole.company.name}*

${issueList}

_Showing open issues_
  `, Markup.inlineKeyboard(buttons));
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function sendTelegramNotification(
  userId: string, 
  title: string, 
  message: string,
  buttons?: Array<{ text: string; callback: string }>
) {
  if (!bot) {
    console.error('Telegram bot not initialized');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true }
  });

  if (!user?.telegramChatId) {
    console.log(`User ${userId} has no Telegram linked`);
    return;
  }

  try {
    const keyboard = buttons 
      ? Markup.inlineKeyboard(buttons.map(b => [Markup.button.callback(b.text, b.callback)]))
      : undefined;

    await bot.telegram.sendMessage(
      user.telegramChatId,
      `*${title}*\n\n${message}`,
      { parse_mode: 'Markdown', ...keyboard }
    );

    console.log(`Notification sent to user ${userId} via Telegram`);
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

export async function notifyNewLead(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { 
      assignedTo: true,
      tenantCompany: true
    }
  });

  if (!lead) return;

  // Notify assigned user
  if (lead.assignedToId) {
    await sendTelegramNotification(
      lead.assignedToId,
      '🎯 New Lead Assigned',
      `You have been assigned a new lead:\n\n*${lead.title}*\n💰 Value: $${lead.value.toLocaleString()}\n🏷️ Source: ${lead.source}`,
      [{ text: 'View Lead', callback: `lead_view_${lead.id}` }]
    );
  }

  // Notify all admins
  const admins = await prisma.userCompanyRole.findMany({
    where: { companyId: lead.companyId, role: 'ADMIN' },
    include: { user: true }
  });

  for (const admin of admins) {
    if (admin.userId !== lead.assignedToId) {
      await sendTelegramNotification(
        admin.userId,
        '🎯 New Lead Created',
        `A new lead has been created:\n\n*${lead.title}*\n💰 Value: $${lead.value.toLocaleString()}`,
        [{ text: 'View Lead', callback: `lead_view_${lead.id}` }]
      );
    }
  }
}

export async function notifyTaskDue(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignedTo: true }
  });

  if (!task || !task.assignedToId) return;

  await sendTelegramNotification(
    task.assignedToId,
    '⏰ Task Due Soon',
    `Your task is due soon:\n\n*${task.title}*\n📅 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}\n🔴 Priority: ${task.priority}`,
    [{ text: 'View Task', callback: `task_view_${task.id}` }, { text: '✅ Complete', callback: `task_complete_${task.id}` }]
  );
}

export async function notifyNewIssue(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { customer: true, tenantCompany: true }
  });

  if (!issue) return;

  // Notify all admins and staff
  const staff = await prisma.userCompanyRole.findMany({
    where: { companyId: issue.companyId, role: { in: ['ADMIN', 'STAFF'] } },
    include: { user: true }
  });

  for (const member of staff) {
    await sendTelegramNotification(
      member.userId,
      '🎫 New Issue Created',
      `A customer has created a new issue:\n\n*${issue.title}*\n👤 Customer: ${issue.customer?.name || 'Unknown'}\n🔴 Priority: ${issue.priority}\n🏷️ Category: ${issue.category}`,
      [{ text: 'View Issue', callback: `issue_view_${issue.id}` }]
    );
  }
}

export async function notifyIssueResolved(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { customer: true, resolvedBy: true }
  });

  if (!issue) return;

  // Notify the customer who created the issue
  await sendTelegramNotification(
    issue.customerId,
    '✅ Issue Resolved',
    `Your issue has been resolved:\n\n*${issue.title}*\n👤 Resolved by: ${issue.resolvedBy?.name || 'Support Team'}\n📝 Resolution: ${issue.resolution || 'Issue has been addressed.'}`,
    []
  );
}

export async function notifyNewCustomer(userId: string, companyId: string) {
  const [user, company] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.company.findUnique({ where: { id: companyId } })
  ]);

  if (!user || !company) return;

  // Notify admins
  const admins = await prisma.userCompanyRole.findMany({
    where: { companyId, role: 'ADMIN' },
    include: { user: true }
  });

  for (const admin of admins) {
    await sendTelegramNotification(
      admin.userId,
      '👋 New Customer Joined',
      `A new customer has joined your company:\n\n*${user.name}*\n📧 Email: ${user.email}\n🏢 Company: ${company.name}`,
      []
    );
  }
}

export const getBot = () => bot;

export default { initBot, getBot, sendTelegramNotification, notifyNewLead, notifyTaskDue, notifyNewIssue, notifyIssueResolved, notifyNewCustomer };

