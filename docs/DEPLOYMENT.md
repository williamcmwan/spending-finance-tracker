# 🚀 Deployment Guide - Single-Server Architecture

## 📋 Overview

The Spending Finance Tracker uses a **single-server deployment** architecture where both the frontend and backend are served from one Express.js server on port 3001. This eliminates CORS issues, simplifies proxy configuration, and provides better performance.

## 🎯 Quick Start

### 1. **Basic Deployment**
```bash
# Build client and configure server
./scripts/deploy.sh

# Start single server (serves frontend + API)
./scripts/app.sh start

# Check status
./scripts/app.sh status
```

### 2. **Production Deployment**
```bash
# Build for production environment
./scripts/deploy.sh -e production

# Start application
./scripts/app.sh start

# Access at http://your-server:3001
```

## 🏗️ Single-Server Architecture

### How It Works
1. **Client Build**: React app builds to `client/dist/`
2. **Server Configuration**: Express serves static files + API routes
3. **Unified Port**: Everything accessible via port 3001
4. **Relative URLs**: Client uses `/api/*` for all requests

### Benefits
- ✅ **No CORS Issues**: Same origin for all requests
- ✅ **No Mixed Content**: Consistent protocol (HTTP/HTTPS)
- ✅ **Simplified Proxy**: Only one port to forward
- ✅ **Better Performance**: No cross-origin latency
- ✅ **Easier SSL**: Single certificate needed
- ✅ **Cloudflare Ready**: Works with proxy services

## 🔧 Environment Configuration

### Server Environment (`server/.env`)
```env
# Core Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Authentication
JWT_SECRET=your_secure_jwt_secret_here
SESSION_SECRET=your_secure_session_secret_here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Database
DATABASE_PATH=./data/spending.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

### Client Configuration
**No environment variables needed!** The client automatically uses relative URLs for all API calls.

## 🚀 Deployment Options

### Option 1: Direct Server Deployment

**Step 1: Setup Server**
```bash
# Clone repository
git clone <your-repo-url>
cd spending-finance-tracker

# Install dependencies
cd client && npm install
cd ../server && npm install
cd ..
```

**Step 2: Configure Environment**
```bash
# Create server environment file
cp server/env.example server/.env

# Edit configuration
nano server/.env
```

**Step 3: Deploy**
```bash
# Build and deploy
./scripts/deploy.sh -e production

# Start application
./scripts/app.sh start
```

**Step 4: Access**
- **Local**: http://localhost:3001
- **Network**: http://your-server-ip:3001

### Option 2: Cloudflare Proxy Deployment

**Step 1: Deploy Server** (same as Option 1)

**Step 2: Configure Cloudflare**
1. **DNS Record**: Point your domain to server IP
2. **Proxy Settings**: Enable Cloudflare proxy
3. **SSL/TLS**: Set to "Flexible" or "Full"
4. **Port**: Ensure 3001 is accessible or use port forwarding

**Step 3: Access**
- **HTTPS**: https://yourdomain.com (Cloudflare proxy)
- **Direct**: http://your-server-ip:3001

### Option 3: Reverse Proxy Deployment

**Step 1: Deploy Server** (same as Option 1)

**Step 2: Configure Reverse Proxy**

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

**iptables Port Forwarding:**
```bash
# Forward port 80 to 3001
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3001

# Forward port 443 to 3001 (for HTTPS)
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 3001
```

## 📱 Application Management

### Start/Stop Commands
```bash
# Start application
./scripts/app.sh start

# Stop application
./scripts/app.sh stop

# Restart application
./scripts/app.sh restart

# Check status
./scripts/app.sh status

# View logs
./scripts/app.sh logs

# Force stop (emergency)
./scripts/app.sh force-stop
```

### Log Management
```bash
# View server logs
tail -f logs/server.log

# View all logs
./scripts/app.sh logs

# Clear logs
rm -f logs/*.log
```

## 🔍 Health Checks

### Endpoints
- **Server Health**: `http://localhost:3001/health`
- **API Status**: `http://localhost:3001/api/status`
- **Frontend**: `http://localhost:3001/`

### Status Verification
```bash
# Check if server is responding
curl http://localhost:3001/health

# Check API status
curl http://localhost:3001/api/status

# Check frontend
curl -I http://localhost:3001/
```

## 🛠️ Troubleshooting

### Common Issues

**1. Server Won't Start**
```bash
# Check if port is in use
lsof -i :3001

# Kill processes using port 3001
./scripts/app.sh force-stop

# Check server logs
tail -n 50 logs/server.log
```

**2. Frontend Not Loading**
```bash
# Verify client build exists
ls -la client/dist/

# Rebuild client if missing
./scripts/deploy.sh

# Check server is serving static files
curl -I http://localhost:3001/
```

**3. API Not Working**
```bash
# Test API endpoint
curl http://localhost:3001/api/status

# Check server environment
cat server/.env | grep NODE_ENV

# Verify database exists
ls -la server/data/
```

**4. Environment Issues**
```bash
# Check environment detection
./scripts/app.sh status

# Verify NODE_ENV
echo $NODE_ENV

# Recreate environment file
cp server/env.example server/.env
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Start with debug output
DEBUG=* ./scripts/app.sh start

# View detailed logs
tail -f logs/server.log
```

**Check Process Status:**
```bash
# List all node processes
ps aux | grep node

# Check port usage
netstat -tulpn | grep :3001

# Check application status
./scripts/app.sh status
```

## 🔐 Security Considerations

### Production Security
```bash
# Set secure secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Set proper file permissions
chmod 600 server/.env
chmod 755 scripts/*.sh

# Configure firewall
sudo ufw allow 3001/tcp
```

### SSL/HTTPS Setup

**Option 1: Cloudflare (Recommended)**
- Enable Cloudflare proxy
- Set SSL/TLS to "Full" or "Flexible"
- Automatic certificate management

**Option 2: Let's Encrypt with Nginx**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Configure nginx to proxy to 3001
```

**Option 3: Self-Signed Certificate**
```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure reverse proxy with SSL
```

## 📊 Performance Optimization

### Server Optimization
```bash
# Enable gzip compression (built into Express)
# Static file caching (configured automatically)
# Database optimization (SQLite with indexing)
```

### Client Optimization
```bash
# Build optimization (Vite production build)
# Asset compression (automatic)
# Lazy loading (implemented)
```

### Monitoring
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Monitor server logs
tail -f logs/server.log | grep ERROR
```

## 🚀 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Share SQLite database or migrate to PostgreSQL
- Use Redis for session storage

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching layers

### CDN Integration
- Use Cloudflare for static assets
- Enable browser caching
- Optimize image delivery

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Server has Node.js 18+
- [ ] Git repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database directory writable
- [ ] Port 3001 available

### Deployment
- [ ] Run `./scripts/deploy.sh -e production`
- [ ] Verify client build created (`client/dist/`)
- [ ] Start server with `./scripts/app.sh start`
- [ ] Check health endpoints
- [ ] Test frontend and API

### Post-Deployment
- [ ] Configure reverse proxy/SSL (if needed)
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document access URLs
- [ ] Test all functionality

## 📞 Support

For deployment issues:

1. **Check Logs**: `./scripts/app.sh logs`
2. **Verify Status**: `./scripts/app.sh status`
3. **Test Health**: `curl http://localhost:3001/health`
4. **Force Restart**: `./scripts/app.sh restart`

---

**Single-server deployment makes everything simpler! 🚀**