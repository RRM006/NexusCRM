import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry
} from '../utils/jwt.utils';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

interface GoogleUserPayload {
  sub: string;        // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Verify Google ID token and extract user info
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleUserPayload | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) return null;
    
    return {
      sub: payload.sub,
      email: payload.email || '',
      email_verified: payload.email_verified || false,
      name: payload.name || '',
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    return null;
  }
}

/**
 * Generate tokens and create refresh token in database
 */
async function generateTokensForUser(user: { id: string; email: string }) {
  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const tokenId = uuidv4();
  const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    }
  });

  return { accessToken, refreshToken };
}

/**
 * Handle Google Sign-In
 * - If user exists with same Google ID: Log them in
 * - If user exists with same email: Link Google account and log in
 * - If new user: Create account and log in
 */
export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server'
      });
      return;
    }

    // Verify the Google token
    const googleUser = await verifyGoogleToken(credential);
    
    if (!googleUser) {
      res.status(401).json({
        success: false,
        message: 'Invalid Google credential'
      });
      return;
    }

    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
      include: {
        userCompanyRoles: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
          }
        }
      }
    });

    if (user) {
      // User found by Google ID - just log them in
      const tokens = await generateTokensForUser(user);
      
      const companies = user.userCompanyRoles.map(ucr => ({
        id: ucr.company.id,
        name: ucr.company.name,
        slug: ucr.company.slug,
        logo: ucr.company.logo,
        role: ucr.role
      }));

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar || user.googleAvatar,
            phone: user.phone,
            bio: user.bio
          },
          companies,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isNewUser: false
        }
      });
      return;
    }

    // Check if user exists with same email
    user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        userCompanyRoles: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
          }
        }
      }
    });

    if (user) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.sub,
          googleEmail: googleUser.email,
          googleAvatar: googleUser.picture,
          googleLinkedAt: new Date(),
          isEmailVerified: googleUser.email_verified || user.isEmailVerified,
          // Update avatar if user doesn't have one
          avatar: user.avatar || googleUser.picture
        },
        include: {
          userCompanyRoles: {
            where: { isActive: true },
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true
                }
              }
            }
          }
        }
      });

      const tokens = await generateTokensForUser(user);
      
      const companies = user.userCompanyRoles.map(ucr => ({
        id: ucr.company.id,
        name: ucr.company.name,
        slug: ucr.company.slug,
        logo: ucr.company.logo,
        role: ucr.role
      }));

      res.json({
        success: true,
        message: 'Google account linked and logged in successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            bio: user.bio
          },
          companies,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isNewUser: false,
          accountLinked: true
        }
      });
      return;
    }

    // Create new user
    // Generate a random secure password for Google users (they won't use it)
    const randomPassword = uuidv4() + uuidv4();
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    user = await prisma.user.create({
      data: {
        name: googleUser.name,
        email: googleUser.email,
        password: hashedPassword,
        avatar: googleUser.picture,
        googleId: googleUser.sub,
        googleEmail: googleUser.email,
        googleAvatar: googleUser.picture,
        googleLinkedAt: new Date(),
        isEmailVerified: googleUser.email_verified
      },
      include: {
        userCompanyRoles: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true
              }
            }
          }
        }
      }
    });

    const tokens = await generateTokensForUser(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully with Google',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: user.phone,
          bio: user.bio
        },
        companies: [],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: true
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during Google sign-in'
    });
  }
};

/**
 * Unlink Google account from user
 */
export const unlinkGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (!user.googleId) {
      res.status(400).json({
        success: false,
        message: 'No Google account linked'
      });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        googleEmail: null,
        googleAvatar: null,
        googleLinkedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Google account unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink Google error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlinking Google account'
    });
  }
};

