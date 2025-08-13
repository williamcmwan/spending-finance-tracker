# Test Deployment Guide

This guide helps you deploy the Spending Finance Tracker application for testing purposes.

## Quick Start

### Option 1: Local Testing (Recommended for Development)
```bash
./scripts/deploy-test.sh -p local
```

### Option 2: Vercel Deployment (Recommended for Production Testing)
```bash
./scripts/deploy-test.sh -p vercel
```

## Prerequisites

- Node.js (v18 or higher)
- npm
- Git
- Vercel CLI (for Vercel deployment): `npm i -g vercel`

## Test Environment Setup

The test deployment script automatically creates environment files for testing:

### Client Environment (`client/.env.test`)
```env
# Test Environment Variables
VITE_API_URL=http://localhost:3001/api
```

### Server Environment (`server/.env.test`)
```env
# Test Environment Variables
PORT=3001
NODE_ENV=test

# JWT Configuration
JWT_SECRET=test_jwt_secret_key_change_in_production

# Session Configuration
SESSION_SECRET=test_session_secret_change_in_production

# Google OAuth Configuration (Optional - leave empty to disable Google login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Client Configuration
CLIENT_URL=http://localhost:5173

# Database Configuration (SQLite)
DATABASE_PATH=./data/spending-test.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Deployment Options

### 1. Local Testing

**Best for:** Development and quick testing

```bash
./scripts/deploy-test.sh -p local
```

This will:
- Build the client and server
- Start the server on `http://localhost:3001`
- Start the client preview on `http://localhost:4173`
- Initialize the SQLite database

**Access your app:**
- Frontend: http://localhost:4173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

### 2. Vercel Deployment

**Best for:** Production testing and sharing

```bash
./scripts/deploy-test.sh -p vercel
```

**Prerequisites:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

**What happens:**
- Builds the client for production
- Deploys to Vercel with a unique URL
- Provides you with a live URL to share

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
./scripts/deploy-test.sh -s

# Build application
./scripts/deploy-test.sh -b

# Start servers manually
cd server && npm start &
cd client && npm run preview &
```

### Vercel Deployment
```bash
# Setup and build
./scripts/deploy-test.sh -s
./scripts/deploy-test.sh -b

# Deploy to Vercel
cd client
vercel --prod
```

## Testing Checklist

Before considering your deployment ready:

- [ ] **Authentication works**
  - [ ] Email/password registration
  - [ ] Email/password login
  - [ ] Google OAuth (if configured)
  - [ ] JWT token validation

- [ ] **Core functionality works**
  - [ ] Create transactions
  - [ ] Edit transactions
  - [ ] Delete transactions
  - [ ] View transaction list
  - [ ] Filter transactions

- [ ] **Categories work**
  - [ ] View categories
  - [ ] Create categories
  - [ ] Edit categories
  - [ ] Delete categories

- [ ] **Analytics work**
  - [ ] Spending summary
  - [ ] Category breakdown
  - [ ] Monthly trends

- [ ] **Database works**
  - [ ] Data persists between sessions
  - [ ] No SQL errors in console

## Troubleshooting

### Common Issues

**1. Port already in use**
```bash
# Kill processes using ports 3001 or 4173
lsof -ti:3001 | xargs kill -9
lsof -ti:4173 | xargs kill -9
```

**2. Database errors**
```bash
# Reset database
cd server
rm -f data/spending-test.db
npm run migrate
```

**3. Build errors**
```bash
# Clean and rebuild
rm -rf client/node_modules client/dist
rm -rf server/node_modules
npm install
./scripts/deploy-test.sh -b
```

**4. Vercel deployment fails**
```bash
# Check Vercel CLI
vercel --version
vercel login

# Try deployment again
./scripts/deploy-test.sh -p vercel
```

### Getting Help

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check the server logs at `http://localhost:3001/health`

## Monitoring

### Local Testing
- Server logs: Check terminal output
- Client logs: Check browser console
- Database: Check `server/data/spending-test.db`

### Vercel Deployment
- Function logs: `vercel logs`
- Analytics: Vercel dashboard
- Performance: Vercel analytics

## Continuous Testing

For ongoing testing, consider:

1. **Automated testing** with GitHub Actions
2. **Staging environment** for pre-production testing
3. **Database backups** before major changes
4. **Environment-specific configurations**

## Cleanup

### Local Cleanup
```bash
# Stop servers (Ctrl+C)
# Remove test database
rm -f server/data/spending-test.db
```

### Vercel Cleanup
```bash
# Remove deployment
vercel remove --yes
```

---

**Happy testing! 🧪**
