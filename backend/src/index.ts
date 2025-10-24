import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://boothnow.com', 'https://app.boothnow.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.get('/api/places/7eleven', (req, res) => {
  const { lat, lng } = req.query;
  
  // Mock data for now
  const mockPlaces = [
    {
      place_id: '1',
      name: '7-Eleven Stockholm Central',
      address: 'Storgatan 1, Stockholm',
      lat: 59.3293,
      lng: 18.0686,
      rating: 4.2,
      boothnow_enabled: true,
      availability: true
    },
    {
      place_id: '2',
      name: '7-Eleven Oslo Downtown',
      address: 'Karl Johans gate 1, Oslo',
      lat: 59.9139,
      lng: 10.7522,
      rating: 4.0,
      boothnow_enabled: true,
      availability: false
    }
  ];

  res.json({
    places: mockPlaces,
    total: mockPlaces.length,
    boothnow_count: mockPlaces.filter(p => p.boothnow_enabled).length
  });
});

// Socket.io handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 BoothNow Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, server, io };