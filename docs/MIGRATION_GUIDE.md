# Migration Guide: Single-Server Architecture

This guide explains the migration to the new **single-server deployment** architecture and how to update your existing setup.

## 🎯 What Changed

### Architecture Evolution

**Previous: Dual-Server Setup**
- Frontend: Vite dev server on port 4173
- Backend: Express server on port 3001
- CORS configuration required
- Separate client and server processes

**Current: Single-Server Deployment**
- **Unified**: Express server serves both frontend and API on port 3001
- **No CORS**: Same origin for all requests
- **Relative URLs**: Client uses `/api/*` for all requests
- **Simplified**: One server process to manage

### Benefits of Single-Server
- ✅ **No CORS Issues**: Same origin eliminates cross-origin problems
- ✅ **No Mixed Content**: Consistent HTTP/HTTPS protocol
- ✅ **Simplified Proxy**: Only one port to forward (3001)
- ✅ **Better Performance**: No cross-origin request latency
- ✅ **Easier SSL**: Single certificate covers everything
- ✅ **Cloudflare Ready**: Works seamlessly with proxy services

## 🔄 Migration Steps

### Step 1: Update Repository

```bash
# Pull latest changes
git pull origin main

# Clean old builds and dependencies
npm run clean

# Install fresh dependencies
npm run install:all
```

### Step 2: Update Environment Configuration

**Remove Client Environment File:**
```bash
# Remove obsolete client .env file (if exists)
rm -f client/.env
```

**Update Server Environment:**
```bash
# Copy example if needed
cp server/env.example server/.env

# Edit server configuration
nano server/.env
```

**Server Environment (`server/.env`):**
```env
# Core Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Authentication
JWT_SECRET=your_secure_jwt_secret_here
SESSION_SECRET=your_secure_session_secret_here

# Database
DATABASE_PATH=./data/spending.db

# CORS (single-server deployment)
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

### Step 3: Deploy New Architecture

```bash
# Build client and configure server
./scripts/deploy.sh -e production

# Start single server
./scripts/app.sh start

# Verify deployment
./scripts/app.sh status
```

### Step 4: Update Access Points

**Before (dual-server):**
- Frontend: http://localhost:4173
- Backend: http://localhost:3001

**After (single-server):**
- **Everything**: http://localhost:3001
- **API**: http://localhost:3001/api/*
- **Health**: http://localhost:3001/health

## 🔧 Configuration Changes

### Client Configuration

**Before:**
```javascript
// client/src/integrations/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

**After:**
```javascript
// client/src/integrations/api/client.js
const getApiBaseUrl = () => {
  // Single-server deployment: always use relative URLs
  return '/api';
};
```

### Server Configuration

**Before:**
```javascript
// Separate client and server
app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:5173'],
  credentials: true
}));
```

**After:**
```javascript
// Serve client static files
if (hasClientBuild) {
  app.use(express.static(clientBuildPath));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
```

### Script Changes

**Before:**
```bash
# Start both servers separately
./scripts/app.sh start    # Started both client and server
```

**After:**
```bash
# Start single server (serves everything)
./scripts/app.sh start    # Only starts server (serves client + API)
```

## 🚀 Deployment Updates

### Local Development

**Before:**
```bash
npm run dev              # Started both client and server
# Access: http://localhost:4173 (client) + http://localhost:3001 (API)
```

**After:**
```bash
./scripts/deploy.sh      # Build client files
./scripts/app.sh start   # Start single server
# Access: http://localhost:3001 (everything)
```

### Production Deployment

**Before:**
```bash
# Build client
cd client && npm run build

# Start server
cd server && npm start

# Configure reverse proxy for both ports
```

**After:**
```bash
# Build and deploy everything
./scripts/deploy.sh -e production

# Start single server
./scripts/app.sh start

# Configure reverse proxy for single port (3001)
```

## 🌐 Reverse Proxy Updates

### Nginx Configuration

**Before (dual-server):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:4173;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

**After (single-server):**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Everything on one port
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Cloudflare Configuration

**Before:**
- DNS A record pointing to server
- Port forwarding: 80→4173 (client), 443→3001 (API)
- Complex proxy rules

**After:**
- DNS A record pointing to server
- Simple proxy: All traffic → port 3001
- Single SSL certificate

## 🔍 Verification Steps

### 1. Check Server Status
```bash
./scripts/app.sh status
```

Expected output:
```
✅ Server is running (PID: XXXXX)
🌍 Frontend: http://0.0.0.0:3001/
🔄 Single-server deployment: Frontend + API on same port
📁 Client build available: Yes
```

### 2. Test Endpoints
```bash
# Frontend
curl -I http://localhost:3001/

# API Status
curl http://localhost:3001/api/status

# Health Check
curl http://localhost:3001/health
```

### 3. Verify Client Build
```bash
# Check if client files exist
ls -la client/dist/

# Should show built files:
# index.html, assets/, etc.
```

## 🐛 Troubleshooting Migration Issues

### Issue: "Client build not found"

**Symptoms:**
```json
{"error":"Client build not found","message":"Run ./scripts/deploy.sh to build client files"}
```

**Solution:**
```bash
# Build client files
./scripts/deploy.sh

# Restart server
./scripts/app.sh restart
```

### Issue: "API routes not working"

**Symptoms:** 404 errors on `/api/*` requests

**Solution:**
```bash
# Check server logs
./scripts/app.sh logs

# Verify server environment
cat server/.env | grep NODE_ENV

# Restart with clean environment
./scripts/app.sh restart
```

### Issue: "Port 3001 already in use"

**Symptoms:** Server fails to start

**Solution:**
```bash
# Force stop all processes
./scripts/app.sh force-stop

# Check what's using the port
lsof -i :3001

# Start fresh
./scripts/app.sh start
```

### Issue: "Frontend loads but API fails"

**Symptoms:** Frontend works but API calls fail

**Solution:**
```bash
# Check if client is using correct API URLs
# Should be relative URLs like '/api/status'

# Verify server is serving API routes
curl http://localhost:3001/api/status

# Check server logs for errors
tail -f logs/server.log
```

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup existing data (`server/data/`)
- [ ] Note current configuration
- [ ] Stop existing services

### Migration
- [ ] Pull latest code
- [ ] Clean old builds (`npm run clean`)
- [ ] Install dependencies (`npm run install:all`)
- [ ] Update server `.env` file
- [ ] Remove client `.env` file (if exists)

### Post-Migration
- [ ] Build and deploy (`./scripts/deploy.sh -e production`)
- [ ] Start server (`./scripts/app.sh start`)
- [ ] Test frontend (http://localhost:3001)
- [ ] Test API (http://localhost:3001/api/status)
- [ ] Update reverse proxy configuration
- [ ] Update DNS/Cloudflare settings (if needed)
- [ ] Test full application functionality

## 🎉 Migration Benefits

After migration, you'll enjoy:

- **Simplified Architecture**: One server to manage
- **Better Performance**: No cross-origin request overhead
- **Easier SSL**: Single certificate for everything
- **No CORS Issues**: Same origin for all requests
- **Cloudflare Ready**: Works seamlessly with proxy services
- **Simplified Deployment**: One port to forward
- **Better Debugging**: Single log file to monitor

## 📞 Support

If you encounter issues during migration:

1. **Check Status**: `./scripts/app.sh status`
2. **View Logs**: `./scripts/app.sh logs`
3. **Force Restart**: `./scripts/app.sh force-stop && ./scripts/app.sh start`
4. **Rebuild**: `./scripts/deploy.sh && ./scripts/app.sh restart`

---

**Welcome to single-server deployment! 🚀**

*Everything is simpler now.*