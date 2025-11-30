import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET || 'nexus-super-admin-secret-key-2024';

export interface SuperAdminRequest extends Request {
  superAdmin?: {
    email: string;
    isSuperAdmin: boolean;
  };
}

export const authenticateSuperAdmin = async (
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Super admin access token is required'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, SUPER_ADMIN_SECRET) as { 
        isSuperAdmin: boolean; 
        email: string 
      };
      
      if (!decoded.isSuperAdmin) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
        return;
      }

      req.superAdmin = {
        email: decoded.email,
        isSuperAdmin: decoded.isSuperAdmin
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired super admin token'
      });
    }
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

