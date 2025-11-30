import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../index';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/gmail/callback';

// Scopes required for Gmail API
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email'
];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate authorization URL for Gmail
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent'
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiry: Date;
  email: string;
}> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  oauth2Client.setCredentials(tokens);
  
  // Get user's email
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiry: new Date(tokens.expiry_date!),
    email: userInfo.data.email!
  };
}

/**
 * Get authenticated Gmail client for a user
 */
export async function getGmailClient(userId: string): Promise<gmail_v1.Gmail | null> {
  const credentials = await prisma.gmailCredential.findUnique({
    where: { userId }
  });

  if (!credentials) {
    return null;
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.tokenExpiry.getTime()
  });

  // Auto-refresh tokens if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.gmailCredential.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          tokenExpiry: new Date(tokens.expiry_date || Date.now() + 3600000)
        }
      });
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Create email in RFC 2822 format
 */
function createRawEmail(options: {
  to: string;
  from: string;
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  cc?: string[];
  bcc?: string[];
  trackingPixel?: string;
}): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2);
  
  let email = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    options.cc?.length ? `Cc: ${options.cc.join(', ')}` : '',
    options.bcc?.length ? `Bcc: ${options.bcc.join(', ')}` : '',
    `Subject: ${options.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    options.bodyText || stripHtml(options.bodyHtml || ''),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    (options.bodyHtml || '') + (options.trackingPixel || ''),
    '',
    `--${boundary}--`
  ].filter(line => line !== '').join('\r\n');

  return Buffer.from(email).toString('base64url');
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

/**
 * Send email using Gmail API
 */
export async function sendEmail(
  userId: string,
  options: {
    to: string;
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    cc?: string[];
    bcc?: string[];
    trackingPixel?: string;
  }
): Promise<{ messageId: string; threadId: string } | null> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail not connected. Please connect your Gmail account.');
  }

  const credentials = await prisma.gmailCredential.findUnique({
    where: { userId }
  });

  if (!credentials) {
    throw new Error('Gmail credentials not found');
  }

  const raw = createRawEmail({
    ...options,
    from: credentials.email
  });

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    return {
      messageId: response.data.id!,
      threadId: response.data.threadId!
    };
  } catch (error) {
    console.error('Gmail send error:', error);
    throw error;
  }
}

/**
 * Get emails from Gmail
 */
export async function getEmails(
  userId: string,
  options: {
    maxResults?: number;
    pageToken?: string;
    query?: string;
    labelIds?: string[];
  } = {}
): Promise<{
  emails: Array<{
    id: string;
    threadId: string;
    snippet: string;
    from: string;
    to: string;
    subject: string;
    date: Date;
    isRead: boolean;
  }>;
  nextPageToken?: string;
}> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail not connected');
  }

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options.maxResults || 20,
    pageToken: options.pageToken,
    q: options.query,
    labelIds: options.labelIds
  });

  const emails = await Promise.all(
    (response.data.messages || []).map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date']
      });

      const headers = message.data.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: message.data.id!,
        threadId: message.data.threadId!,
        snippet: message.data.snippet || '',
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: new Date(getHeader('Date')),
        isRead: !message.data.labelIds?.includes('UNREAD')
      };
    })
  );

  return {
    emails,
    nextPageToken: response.data.nextPageToken || undefined
  };
}

/**
 * Get a single email by ID
 */
export async function getEmailById(
  userId: string,
  messageId: string
): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date: Date;
  bodyHtml?: string;
  bodyText?: string;
  isRead: boolean;
} | null> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Gmail not connected');
  }

  try {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = message.data.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    // Extract body
    let bodyHtml = '';
    let bodyText = '';

    function extractBody(part: any): void {
      if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    }

    if (message.data.payload) {
      extractBody(message.data.payload);
    }

    return {
      id: message.data.id!,
      threadId: message.data.threadId!,
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc') || undefined,
      subject: getHeader('Subject'),
      date: new Date(getHeader('Date')),
      bodyHtml,
      bodyText,
      isRead: !message.data.labelIds?.includes('UNREAD')
    };
  } catch (error) {
    console.error('Get email error:', error);
    return null;
  }
}

/**
 * Mark email as read
 */
export async function markAsRead(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  if (!gmail) throw new Error('Gmail not connected');

  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      removeLabelIds: ['UNREAD']
    }
  });
}

/**
 * Delete email (move to trash)
 */
export async function deleteEmail(userId: string, messageId: string): Promise<void> {
  const gmail = await getGmailClient(userId);
  if (!gmail) throw new Error('Gmail not connected');

  await gmail.users.messages.trash({
    userId: 'me',
    id: messageId
  });
}

