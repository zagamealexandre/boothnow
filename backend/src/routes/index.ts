import { Express } from 'express';
import { authMiddleware, adminAuthMiddleware } from '../middleware/auth';
import { boothRoutes } from './booths';
import { userRoutes } from './users';
import { paymentRoutes } from './payments';
import { placesRoutes } from './places';
import { analyticsRoutes } from './analytics';
import { sessionRoutes } from './sessions';

export const setupRoutes = (app: Express) => {
  // Public routes
  app.use('/api/places', placesRoutes);
  app.use('/api/health', (req, res) => res.json({ status: 'OK' }));

  // Protected routes (require authentication)
  app.use('/api/booths', authMiddleware, boothRoutes);
  app.use('/api/users', authMiddleware, userRoutes);
  app.use('/api/payments', authMiddleware, paymentRoutes);
  app.use('/api/sessions', authMiddleware, sessionRoutes);
  app.use('/api/analytics', authMiddleware, analyticsRoutes);

  // Admin routes (require admin authentication)
  app.use('/api/admin', adminAuthMiddleware);
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  });
};
