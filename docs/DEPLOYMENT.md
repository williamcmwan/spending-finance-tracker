# 🚀 Deployment Guide

## 📋 Overview

This guide covers deployment of the Spending Finance Tracker using the unified deployment system. The application supports both development and production environments, automatically detected from your `.env` configuration.

## 🎯 Quick Start

### 1. **Basic Deployment**
```bash
# Auto-detect environment and deploy locally
./scripts/deploy.sh

# Start the application
./scripts/app.sh start

# Check status
./scripts/app.sh status
```

### 2. **Environment-Specific Deployment**
```bash
# Force production environment
./scripts/deploy.sh -e production

# Force development environment  
./scripts/deploy.sh -e development

# Deploy to Vercel
./scripts/deploy.sh -p vercel
```

## 🔧 Environment Configuration

### **Environment Detection**
The deployment script automatically detects your environment from `server/.env`:

```bash
# Production
NODE_ENV=production

# Development
NODE_ENV=development

# Test
NODE_ENV=test
```

### **Environment Files**

#### **Server Configuration (`server/.env`)**
```bash
# Environment
NODE_ENV=production

# Server
PORT=3001

# Security
JWT_SECRET=your_production_jwt_secret
SESSION_SECRET=your_production_session_secret

# Database
DATABASE_PATH=./data/spending.db

# CORS (auto-configured for production)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://192.168.1.100:4173
```

#### **Client Configuration (`client/.env`)**
```bash
# API URL (auto-configured based on environment)
VITE_API_URL=http://localhost:3001/api          # Development
VITE_API_URL=http://192.168.1.100:3001/api     # Production (auto-detected IP)
```

## 📦 Deployment Scripts

### **1. Unified Deploy Script (`./scripts/deploy.sh`)**

#### **Usage**
```bash
./scripts/deploy.sh [OPTIONS]

Options:
  -p, --platform PLATFORM  Deployment platform (vercel|local) [default: local]
  -e, --env ENVIRONMENT     Force environment (development|production) [default: auto-detect]
  -s, --setup              Setup environment only
  -b, --build              Build application only
  -h, --help               Show help message
```

#### **Examples**
```bash
# Auto-detect environment, deploy locally
./scripts/deploy.sh

# Force production, deploy locally
./scripts/deploy.sh -e production

# Deploy to Vercel with auto-detected environment
./scripts/deploy.sh -p vercel

# Setup environment files only
./scripts/deploy.sh -s

# Build application only
./scripts/deploy.sh -b
```

#### **What It Does**
1. ✅ **Detects environment** from `server/.env`
2. ✅ **Creates environment files** if missing
3. ✅ **Configures CORS** automatically for production
4. ✅ **Backs up database** before changes
5. ✅ **Builds application** for target environment
6. ✅ **Prepares for deployment** or deploys to Vercel

### **2. Application Management Script (`./scripts/app.sh`)**

#### **Usage**
```bash
./scripts/app.sh COMMAND [COMPONENT] [OPTIONS]

Commands:
  start [server|client|all]    Start application components [default: all]
  stop [server|client|all]     Stop application components [default: all]
  restart [server|client|all]  Restart application components [default: all]
  status                       Show application status
  logs [server|client|all] [lines]  Show logs [default: all, 50 lines]
  help                         Show help message
```

#### **Examples**
```bash
# Start both server and client
./scripts/app.sh start

# Start only server
./scripts/app.sh start server

# Stop everything
./scripts/app.sh stop

# Restart only client
./scripts/app.sh restart client

# Check status
./scripts/app.sh status

# View server logs (last 100 lines)
./scripts/app.sh logs server 100

# View all logs
./scripts/app.sh logs
```

#### **What It Does**
1. ✅ **Manages background processes** (server & client)
2. ✅ **Tracks PIDs** for proper process management
3. ✅ **Logs output** to separate files
4. ✅ **Graceful shutdown** with fallback to force kill
5. ✅ **Status monitoring** with real-time information
6. ✅ **Log viewing** with configurable line counts

## 🌐 Deployment Scenarios

### **1. Local Development**
```bash
# Setup
./scripts/deploy.sh -e development -s

# Build and start
./scripts/deploy.sh -e development
./scripts/app.sh start

# Access
# Client: http://localhost:4173
# Server: http://localhost:3001
```

### **2. Local Production**
```bash
# Setup
./scripts/deploy.sh -e production -s

# Build and start
./scripts/deploy.sh -e production
./scripts/app.sh start

# Access
# Client: http://192.168.1.100:4173 (your IP)
# Server: http://192.168.1.100:3001
```

### **3. Network Production**
```bash
# Auto-detects your IP and configures CORS
./scripts/deploy.sh -e production

# Start services
./scripts/app.sh start

# Access from any device on network
# http://YOUR_IP:4173
```

### **4. Vercel Deployment**
```bash
# Deploy to Vercel (production)
./scripts/deploy.sh -p vercel -e production

# Deploy to Vercel (preview)
./scripts/deploy.sh -p vercel -e development
```

## 🗄️ Database Management

### **Automatic Backup**
- ✅ **Pre-deployment backup** before any changes
- ✅ **Timestamped backups** (`spending-YYYYMMDD-HHMMSS.db`)
- ✅ **Retention policy** (keeps last 5 backups)
- ✅ **Backup location**: `{DATABASE_DIR}/backups/`

### **Database Location**
```bash
# Development/Production
DATABASE_PATH=./data/spending.db

# Backups
./data/backups/spending-20241201-143022.db
```

## 📊 Monitoring & Logs

### **Application Status**
```bash
# Check if services are running
./scripts/app.sh status

# Output example:
# Application Status
# Environment: production
# 
# Server: Running (PID: 12345)
#   Log: /path/to/logs/server.log
#   URL: http://localhost:3001
# 
# Client: Running (PID: 12346)
#   Log: /path/to/logs/client.log
#   URL: http://localhost:4173
```

### **Log Files**
```bash
# Log locations
logs/server.log    # Server output
logs/client.log    # Client output

# View logs
./scripts/app.sh logs server     # Server logs
./scripts/app.sh logs client     # Client logs
./scripts/app.sh logs all        # All logs
```

### **Process Management**
```bash
# PID files (auto-managed)
server/.server.pid    # Server process ID
client/.client.pid    # Client process ID
```

## 🔒 Security Considerations

### **Production Security**
- ✅ **Strong JWT secrets** (change defaults)
- ✅ **Secure session secrets** (change defaults)
- ✅ **CORS configuration** (auto-configured for network)
- ✅ **Database permissions** (user-only access)

### **Environment Variables**
```bash
# Required for production
JWT_SECRET=your_unique_jwt_secret_here
SESSION_SECRET=your_unique_session_secret_here

# Optional for enhanced security
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. CORS Errors**
```bash
# Rebuild with correct environment
./scripts/deploy.sh -e production -b
./scripts/app.sh restart
```

#### **2. Port Already in Use**
```bash
# Stop existing processes
./scripts/app.sh stop

# Check for zombie processes
ps aux | grep node

# Kill if necessary
kill -9 PID
```

#### **3. Database Issues**
```bash
# Check database file
ls -la server/data/spending.db

# Check permissions
chmod 644 server/data/spending.db

# Restore from backup
cp server/data/backups/spending-*.db server/data/spending.db
```

#### **4. Build Failures**
```bash
# Clean and rebuild
rm -rf client/dist server/node_modules client/node_modules
./scripts/deploy.sh -b
```

### **Log Analysis**
```bash
# Check recent errors
./scripts/app.sh logs server | grep -i error
./scripts/app.sh logs client | grep -i error

# Monitor real-time
tail -f logs/server.log
tail -f logs/client.log
```

## 🎯 Best Practices

### **1. Environment Management**
- ✅ Use separate `.env` files for different environments
- ✅ Never commit secrets to version control
- ✅ Regularly rotate JWT and session secrets

### **2. Deployment Workflow**
```bash
# 1. Setup environment
./scripts/deploy.sh -s

# 2. Build application
./scripts/deploy.sh -b

# 3. Start services
./scripts/app.sh start

# 4. Monitor status
./scripts/app.sh status
```

### **3. Maintenance**
```bash
# Regular backup check
ls -la server/data/backups/

# Log rotation (if needed)
./scripts/app.sh logs server 1000 > archive/server-$(date +%Y%m%d).log

# Process monitoring
./scripts/app.sh status
```

## 🎉 Quick Reference

### **Essential Commands**
```bash
# Deploy and start
./scripts/deploy.sh && ./scripts/app.sh start

# Stop everything
./scripts/app.sh stop

# Restart after changes
./scripts/app.sh restart

# Check status
./scripts/app.sh status

# View logs
./scripts/app.sh logs
```

### **File Structure**
```
scripts/
├── deploy.sh          # Unified deployment script
└── app.sh             # Application management script

logs/
├── server.log         # Server output
└── client.log         # Client output

server/
├── .env               # Server configuration
├── .server.pid        # Server process ID
└── data/
    ├── spending.db    # Main database
    └── backups/       # Database backups

client/
├── .env               # Client configuration
├── .client.pid        # Client process ID
└── dist/              # Built application
```

**Your application is now ready for seamless deployment and management! 🚀**