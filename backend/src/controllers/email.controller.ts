import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';
import * as gmailService from '../services/gmail.service';
import { v4 as uuidv4 } from 'uuid';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ==================== Gmail OAuth ====================

/**
 * Get Gmail authorization URL
 */
export const getGmailAuthUrl = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Get Gmail auth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Gmail authorization URL'
    });
  }
};

/**
 * Gmail OAuth callback
 */
export const gmailCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;
    
    if (!code || typeof code !== 'string') {
      res.redirect(`${FRONTEND_URL}/email?error=missing_code`);
      return;
    }

    // State contains userId
    const userId = state as string;
    if (!userId) {
      res.redirect(`${FRONTEND_URL}/email?error=invalid_state`);
      return;
    }

    const tokens = await gmailService.exchangeCodeForTokens(code);

    // Save or update credentials
    await prisma.gmailCredential.upsert({
      where: { userId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.expiry,
        email: tokens.email
      },
      create: {
        userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: tokens.expiry,
        email: tokens.email
      }
    });

    res.redirect(`${FRONTEND_URL}/email?connected=true`);
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.redirect(`${FRONTEND_URL}/email?error=auth_failed`);
  }
};

/**
 * Disconnect Gmail
 */
export const disconnectGmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await prisma.gmailCredential.delete({
      where: { userId: req.user.id }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Gmail disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect Gmail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting Gmail'
    });
  }
};

/**
 * Get Gmail connection status
 */
export const getGmailStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const credentials = await prisma.gmailCredential.findUnique({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: {
        isConnected: !!credentials,
        email: credentials?.email || null
      }
    });
  } catch (error) {
    console.error('Get Gmail status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting Gmail status'
    });
  }
};

// ==================== Email Operations ====================

/**
 * Send an email
 */
export const sendEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { to, subject, bodyHtml, bodyText, cc, bcc, contactId, leadId, customerId, templateId } = req.body;

    // Create tracking ID
    const trackingId = uuidv4();
    
    // Create tracking pixel
    const trackingPixel = `<img src="${BACKEND_URL}/api/email/track/open/${trackingId}" width="1" height="1" style="display:none" />`;
    
    // Replace links with tracked links (store them first)
    let processedHtml = bodyHtml;
    const linkMatches = bodyHtml?.match(/href="([^"]+)"/g) || [];
    const trackedLinks: { originalUrl: string; trackingCode: string }[] = [];
    
    for (const match of linkMatches) {
      const originalUrl = match.replace('href="', '').replace('"', '');
      if (!originalUrl.startsWith(BACKEND_URL)) { // Don't track internal links
        const trackingCode = uuidv4();
        trackedLinks.push({ originalUrl, trackingCode });
        const trackedUrl = `${BACKEND_URL}/api/email/track/click/${trackingCode}`;
        processedHtml = processedHtml.replace(originalUrl, trackedUrl);
      }
    }

    // Send via Gmail
    const result = await gmailService.sendEmail(req.user.id, {
      to,
      subject,
      bodyHtml: processedHtml + trackingPixel,
      bodyText,
      cc,
      bcc
    });

    if (!result) {
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
      return;
    }

    // Get sender's Gmail email
    const credentials = await prisma.gmailCredential.findUnique({
      where: { userId: req.user.id }
    });

    // Create email record in database
    const email = await prisma.email.create({
      data: {
        messageId: result.messageId,
        threadId: result.threadId,
        direction: 'OUTBOUND',
        fromEmail: credentials?.email || req.user.email,
        fromName: req.user.name,
        toEmail: to,
        ccEmails: cc || [],
        bccEmails: bcc || [],
        subject,
        bodyText,
        bodyHtml: processedHtml,
        status: 'SENT',
        sentAt: new Date(),
        trackingId,
        contactId,
        leadId,
        customerId,
        templateId,
        companyId: req.companyId,
        createdById: req.user.id,
        trackedLinks: {
          create: trackedLinks.map(link => ({
            originalUrl: link.originalUrl,
            trackingCode: link.trackingCode
          }))
        }
      },
      include: {
        contact: true,
        lead: true,
        customer: true,
        template: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      data: { email }
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending email'
    });
  }
};

/**
 * Get emails from Gmail inbox
 */
export const getInbox = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { maxResults, pageToken, query } = req.query;

    const result = await gmailService.getEmails(req.user.id, {
      maxResults: maxResults ? parseInt(maxResults as string) : 20,
      pageToken: pageToken as string,
      query: query as string,
      labelIds: ['INBOX']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get inbox error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching inbox'
    });
  }
};

/**
 * Get sent emails from Gmail
 */
export const getSent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { maxResults, pageToken } = req.query;

    const result = await gmailService.getEmails(req.user.id, {
      maxResults: maxResults ? parseInt(maxResults as string) : 20,
      pageToken: pageToken as string,
      labelIds: ['SENT']
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Get sent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sent emails'
    });
  }
};

/**
 * Get email by Gmail message ID
 */
export const getEmailById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    const email = await gmailService.getEmailById(req.user.id, id);

    if (!email) {
      res.status(404).json({
        success: false,
        message: 'Email not found'
      });
      return;
    }

    // Mark as read
    await gmailService.markAsRead(req.user.id, id);

    res.json({
      success: true,
      data: { email }
    });
  } catch (error: any) {
    console.error('Get email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching email'
    });
  }
};

/**
 * Delete email
 */
export const deleteEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await gmailService.deleteEmail(req.user.id, id);

    res.json({
      success: true,
      message: 'Email deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting email'
    });
  }
};

/**
 * Get emails sent from CRM (stored in database)
 */
export const getCrmEmails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { page = 1, limit = 20, contactId, leadId, customerId } = req.query;

    const where: any = {
      companyId: req.companyId
    };

    if (contactId) where.contactId = contactId;
    if (leadId) where.leadId = leadId;
    if (customerId) where.customerId = customerId;

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        include: {
          contact: true,
          lead: true,
          customer: true,
          template: true,
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.email.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get CRM emails error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emails'
    });
  }
};

/**
 * Get email statistics
 */
export const getEmailStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const [sent, opened, clicked, bounced] = await Promise.all([
      prisma.email.count({
        where: { companyId: req.companyId, status: 'SENT' }
      }),
      prisma.email.count({
        where: { companyId: req.companyId, openedAt: { not: null } }
      }),
      prisma.email.count({
        where: { companyId: req.companyId, clickedAt: { not: null } }
      }),
      prisma.email.count({
        where: { companyId: req.companyId, status: 'BOUNCED' }
      })
    ]);

    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0';
    const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0';
    const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) : '0';

    res.json({
      success: true,
      data: {
        sent,
        opened,
        clicked,
        bounced,
        openRate,
        clickRate,
        bounceRate
      }
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email statistics'
    });
  }
};

// ==================== Email Tracking ====================

/**
 * Track email open (tracking pixel)
 */
export const trackOpen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    // Update email record
    await prisma.email.updateMany({
      where: { trackingId },
      data: {
        status: 'OPENED',
        openedAt: new Date(),
        openCount: { increment: 1 }
      }
    });

    // Return 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.set({
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.send(pixel);
  } catch (error) {
    console.error('Track open error:', error);
    // Still return the pixel even if tracking fails
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
};

/**
 * Track email link click
 */
export const trackClick = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingCode } = req.params;

    // Find and update the link
    const link = await prisma.emailLink.update({
      where: { trackingCode },
      data: {
        clickCount: { increment: 1 },
        lastClickedAt: new Date()
      }
    });

    // Update the email record
    await prisma.email.update({
      where: { id: link.emailId },
      data: {
        status: 'CLICKED',
        clickedAt: new Date(),
        clickCount: { increment: 1 }
      }
    });

    // Redirect to original URL
    res.redirect(link.originalUrl);
  } catch (error) {
    console.error('Track click error:', error);
    res.redirect(FRONTEND_URL);
  }
};

// ==================== Email Templates ====================

/**
 * Get all email templates
 */
export const getTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { companyId: req.companyId },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates'
    });
  }
};

/**
 * Create email template
 */
export const createTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, subject, bodyHtml, bodyText, category, variables } = req.body;

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        bodyHtml,
        bodyText,
        category,
        variables: variables || [],
        companyId: req.companyId,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template'
    });
  }
};

/**
 * Update email template
 */
export const updateTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { name, subject, bodyHtml, bodyText, category, variables, isActive } = req.body;

    const template = await prisma.emailTemplate.update({
      where: { id, companyId: req.companyId },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(bodyHtml !== undefined && { bodyHtml }),
        ...(bodyText !== undefined && { bodyText }),
        ...(category !== undefined && { category }),
        ...(variables !== undefined && { variables }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: { template }
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template'
    });
  }
};

/**
 * Delete email template
 */
export const deleteTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;

    await prisma.emailTemplate.delete({
      where: { id, companyId: req.companyId }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template'
    });
  }
};

/**
 * Get email history for a contact/lead/customer
 */
export const getEmailHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.companyId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { entityType, entityId } = req.params;

    const where: any = { companyId: req.companyId };

    switch (entityType) {
      case 'contact':
        where.contactId = entityId;
        break;
      case 'lead':
        where.leadId = entityId;
        break;
      case 'customer':
        where.customerId = entityId;
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid entity type'
        });
        return;
    }

    const emails = await prisma.email.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        template: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { emails }
    });
  } catch (error) {
    console.error('Get email history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email history'
    });
  }
};

