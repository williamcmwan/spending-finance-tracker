# Deployment Guide

This guide covers deploying the Spending Finance Tracker application to production with comprehensive category management and drag-and-drop import functionality.

## Quick Start

### Local Development
```bash
# Setup environment
./scripts/setup.sh

# Start development servers
npm run dev
```

### Production Deployment (Vercel)
```bash
# Deploy to Vercel
./scripts/deploy.sh -p vercel
```

## Prerequisites

- Node.js (v18 or higher)
- npm
- Git
- Vercel CLI (for production deployment): `npm i -g vercel`

## Environment Setup

### Client Environment (`client/.env`)
```env
# Client Environment Variables
VITE_API_URL=http://localhost:3001/api
```

### Server Environment (`server/.env`)
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# Session Configuration
SESSION_SECRET=your_session_secret_here_change_this_in_production

# Google OAuth Configuration (Optional - leave empty to disable Google login)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# Client Configuration
CLIENT_URL=https://your-domain.com

# Database Configuration (SQLite)
DATABASE_PATH=./data/spending.db

# CORS Configuration
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:5173
```

## Deployment Options

### 1. Local Development

**Best for:** Development and testing

```bash
# Setup environment
./scripts/setup.sh

# Start development servers
npm run dev
```

**Access your app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

### 2. Vercel Deployment

**Best for:** Production deployment

```bash
# Deploy to Vercel
./scripts/deploy.sh -p vercel
```

**Prerequisites:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

**What happens:**
- Builds the client for production
- Deploys to Vercel with a unique URL
- Provides you with a live URL

**Benefits:**
- ✅ Instant deployment
- ✅ HTTPS by default
- ✅ Global CDN
- ✅ Automatic preview URLs
- ✅ Easy rollbacks

## Manual Deployment Steps

If you prefer to deploy manually:

### Local Deployment
```bash
# Setup environment
./scripts/setup.sh

# Build application
npm run build

# Start servers manually
cd server && npm start &
cd client && npm run preview &
```

### Vercel Deployment
```bash
# Setup and build
./scripts/setup.sh
npm run build

# Deploy to Vercel
cd client
vercel --prod
```

## Database Setup

### SQLite Setup

The application uses SQLite for local data storage. The database is automatically initialized when you run the setup script.

1. **Initialize Database:**
```bash
cd server
npm run migrate
```

2. **Reset Database (if needed):**
```bash
cd server
npm run reset
```

### Database Location

The SQLite database file is stored at:
```
server/data/spending.db
```

### Database Schema

The application includes the following tables:
- **users** - User accounts and authentication
- **categories** - Transaction categories  
- **transactions** - Financial transactions

## Monitoring and Maintenance

### Health Checks

- **Frontend**: Check if the app loads without errors
- **Backend**: Verify API endpoints respond
- **Database**: Test data persistence
- **Authentication**: Test login/logout flows

### Performance Monitoring

- **Load Time**: Check initial page load speed
- **API Response**: Monitor API response times
- **Memory Usage**: Watch for memory leaks
- **Error Rates**: Monitor for 4xx/5xx errors

### Security Testing

- **Authentication**: Test with invalid credentials
- **Authorization**: Test protected routes
- **CORS**: Verify cross-origin requests
- **Environment Variables**: Ensure secrets are not exposed

## Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill processes using ports 3001 or 5173
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

**2. Database errors**
```bash
# Reset database
cd server
rm -f data/spending.db
npm run migrate
```

**3. Build errors**
```bash
# Clean and rebuild
rm -rf client/node_modules client/dist
rm -rf server/node_modules
npm install
npm run build
```

**4. Vercel deployment fails**
```bash
# Check Vercel CLI
vercel --version
vercel login

# Try deployment again
./scripts/deploy.sh -p vercel
```

### Getting Help

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check the server logs at `http://localhost:3001/health`

## Best Practices

1. **Use strong secrets** for JWT and session keys
2. **Set up proper CORS** for your domain
3. **Monitor logs** during deployment
4. **Test all features** after deployment
5. **Keep backups** of your database
6. **Use environment-specific configurations**
7. **Document your deployment process**

---

**Happy deploying! 🚀**
