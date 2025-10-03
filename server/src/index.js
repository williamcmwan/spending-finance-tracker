import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Removed Passport/Session (no third-party OAuth)

// Database
import { initializeDatabase } from './database/init.js';
import { authRoutes } from './routes/auth.js';
import { transactionRoutes } from './routes/transactions.js';
import { categoryRoutes } from './routes/categories.js';
import { categoryRulesRoutes } from './routes/categoryRules.js';
import { analyticsRoutes } from './routes/analytics.js';
import { settingsRoutes } from './routes/settings.js';
import { importRoutes } from './routes/import.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration for production and development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081', 
  'http://localhost:8082',
  'http://localhost:4173',
  process.env.CLIENT_URL
];

// Add network IP origins for local network deployment
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...additionalOrigins);
}

// For production, allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/
  );
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions/Passport removed

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Spending Finance Tracker API is running',
    version: '1.0.0',
    database: 'SQLite'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/category-rules', categoryRulesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve static files from client build (single-server deployment)
const clientBuildPath = path.join(__dirname, '../../client/dist');

// Check if client build exists
const hasClientBuild = fs.existsSync(clientBuildPath) && fs.existsSync(path.join(clientBuildPath, 'index.html'));

if (hasClientBuild) {
  console.log(`📁 Serving static files from: ${clientBuildPath}`);
  
  // Serve static assets with proper headers
  app.use(express.static(clientBuildPath, {
    setHeaders: (res, path) => {
      // Set security headers for static files
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
    }
  }));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    // Serve index.html for all other routes (SPA routing)
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // No client build available
  console.warn(`⚠️  No client build found at: ${clientBuildPath}`);
  console.warn(`⚠️  Run './scripts/deploy.sh' to build client files for single-server deployment`);
  
  // 404 handler when no client build is available
  app.use('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.status(404).json({ 
      error: 'Client build not found', 
      message: 'Run ./scripts/deploy.sh to build client files for single-server deployment'
    });
  });
}

// Start server
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  
  // Show access information
  console.log(`🌐 Network access: http://${HOST}:${PORT}`);
  
  if (hasClientBuild) {
    console.log(`🌍 Frontend: http://${HOST}:${PORT}/`);
    console.log(`🔄 Single-server deployment: Frontend + API on same port`);
    console.log(`🔐 For HTTPS access, configure reverse proxy (nginx/Cloudflare)`);
  } else {
    console.log(`⚠️  No client build - API only mode`);
    console.log(`📝 Run './scripts/deploy.sh' to build client for single-server deployment`);
  }
  
  console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Client build available: ${hasClientBuild ? 'Yes' : 'No'}`);
});

export default app;
