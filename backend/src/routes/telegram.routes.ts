import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { sendTelegramNotification } from '../telegram/bot';

const router = Router();

// Extend Request type
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

/**
 * @route   PUT /api/telegram/phone
 * @desc    Update user's phone number
 * @access  Private
 */
router.put('/phone',
  authenticate,
  [
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
      .withMessage('Please enter a valid phone number (7-20 digits)')
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { phone } = req.body;
      const userId = req.user!.id;

      // Check if phone number is already used by another user
      const existingUser = await prisma.user.findFirst({
        where: { 
          phone,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already linked to another account'
        });
      }

      // Update user's phone number
      const user = await prisma.user.update({
        where: { id: userId },
        data: { phone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isPhoneVerified: true,
          telegramId: true,
          telegramUsername: true,
          telegramLinkedAt: true
        }
      });

      res.json({
        success: true,
        message: 'Phone number updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/telegram/status
 * @desc    Get Telegram link status
 * @access  Private
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        phone: true,
        isPhoneVerified: true,
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        hasPhone: !!user?.phone,
        phone: user?.phone,
        isPhoneVerified: user?.isPhoneVerified || false,
        isTelegramLinked: !!user?.telegramId,
        telegramUsername: user?.telegramUsername,
        linkedAt: user?.telegramLinkedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/telegram/unlink
 * @desc    Unlink Telegram account
 * @access  Private
 */
router.delete('/unlink', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramId: null,
        telegramChatId: null,
        telegramUsername: null,
        telegramLinkedAt: null,
        isPhoneVerified: false
      }
    });

    res.json({
      success: true,
      message: 'Telegram account unlinked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/telegram/test-notification
 * @desc    Send a test notification via Telegram
 * @access  Private
 */
router.post('/test-notification', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, name: true }
    });

    if (!user?.telegramChatId) {
      return res.status(400).json({
        success: false,
        message: 'Telegram account not linked'
      });
    }

    await sendTelegramNotification(
      userId,
      '🧪 Test Notification',
      `Hello ${user.name}! This is a test notification from NexusCRM.\n\nIf you received this, your Telegram notifications are working correctly! 🎉`,
      [{ text: '👍 Got it!', callback: 'test_ack' }]
    );

    res.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/telegram/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        hasMore: Number(offset) + notifications.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/telegram/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });

    if (notification.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/telegram/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/telegram/notifications/:id
 * @desc    Delete a single notification
 * @access  Private
 */
router.delete('/notifications/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.deleteMany({
      where: { id, userId }
    });

    if (notification.count === 0) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/telegram/notifications
 * @desc    Delete all notifications for user
 * @access  Private
 */
router.delete('/notifications', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

