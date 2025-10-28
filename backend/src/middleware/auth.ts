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

    // Clerk payload can vary; use a broad type and guard accesses
    const payload: any = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      issuer: 'https://clerk.boothnow.com'
    });

    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.userId = payload.sub;
    req.user = payload;
    
    // Debug: Log the payload structure to understand the format
    console.log('🔍 Clerk payload structure:', JSON.stringify(payload, null, 2));
    
    // Extract email from various possible locations in the payload
    let userEmail = null;
    if (payload?.email) {
      userEmail = payload.email;
    } else if (payload?.email_address) {
      userEmail = payload.email_address;
    } else if (Array.isArray(payload?.emailAddresses) && payload.emailAddresses.length > 0) {
      const first = payload.emailAddresses[0];
      userEmail = first?.emailAddress ?? first?.email_address ?? first ?? null;
    } else if (payload?.primary_email_address) {
      userEmail = payload.primary_email_address;
    }
    
    // Add email to the user object for easy access
    if (userEmail) {
      req.user = req.user || {};
      req.user.email = userEmail;
      console.log('✅ Extracted email from payload:', userEmail);
    } else {
      console.log('❌ No email found in payload structure');
    }
    
    return next();
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
    return await authMiddleware(req, res, () => {
      // Check if user has admin role
      const userRoles = req.user?.metadata?.roles || [];
      
      if (!userRoles.includes('admin') && !userRoles.includes('partner')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      return next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(403).json({ error: 'Admin access required' });
  }
};
