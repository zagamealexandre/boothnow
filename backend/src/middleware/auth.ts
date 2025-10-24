import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.userId = payload.sub;
    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    await authMiddleware(req, res, () => {
      // Check if user has admin role
      const userRoles = req.user?.metadata?.roles || [];
      
      if (!userRoles.includes('admin') && !userRoles.includes('partner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(403).json({ error: 'Admin access required' });
  }
};
