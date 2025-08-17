# 🗄️ Production Database Configuration

## 📋 Overview

This guide covers the recommended database configurations for production deployment of the Spending Finance Tracker with **single-server architecture**.

## 🎯 Database Location Recommendations

### 1. **System-Wide Directory (Recommended)**
```bash
# Path: /var/lib/spending-tracker/spending.db
# Permissions: 755 for directory, 644 for database file
# Ownership: app user (e.g., 'appuser')

sudo mkdir -p /var/lib/spending-tracker
sudo chown appuser:appuser /var/lib/spending-tracker
sudo chmod 755 /var/lib/spending-tracker
```

**Advantages:**
- ✅ Standard Linux practice for application data
- ✅ Survives application updates
- ✅ Easy to backup with system tools
- ✅ Clear separation from application code

### 2. **Application Directory**
```bash
# Path: /opt/spending-tracker/data/spending.db
# For applications installed in /opt

sudo mkdir -p /opt/spending-tracker/data
sudo chown appuser:appuser /opt/spending-tracker/data
sudo chmod 755 /opt/spending-tracker/data
```

### 3. **User Directory (Development/Small Production)**
```bash
# Path: $HOME/spending-tracker/data/spending.db
# For single-user deployments

mkdir -p $HOME/spending-tracker/data
chmod 755 $HOME/spending-tracker/data
```

## 🔧 Environment Configuration

### Production .env Setup
```bash
# server/.env
DATABASE_PATH=/var/lib/spending-tracker/spending.db
NODE_ENV=production

# Security
JWT_SECRET=your_strong_jwt_secret_here
SESSION_SECRET=your_strong_session_secret_here

# Production URLs
CLIENT_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
```

### Automatic Configuration
The `deploy.sh` script automatically:
1. Detects writable directories (`/var/lib`, `/opt`, `$HOME`)
2. Creates appropriate directory structure
3. Sets `DATABASE_PATH` in server/.env
4. Creates backup directory structure

## 🔒 Security Considerations

### File Permissions
```bash
# Database file
chmod 640 /var/lib/spending-tracker/spending.db
chown appuser:appuser /var/lib/spending-tracker/spending.db

# Directory
chmod 750 /var/lib/spending-tracker
chown appuser:appuser /var/lib/spending-tracker
```

### User Setup
```bash
# Create dedicated application user
sudo useradd -r -s /bin/false -d /var/lib/spending-tracker appuser

# Set ownership
sudo chown -R appuser:appuser /var/lib/spending-tracker
```

## 📦 Backup Strategy

### Automated Backups (Built into deploy.sh)
- ✅ **Pre-deployment backup** before each migration
- ✅ **Timestamped backups** (YYYYMMDD-HHMMSS format)
- ✅ **Retention policy** (keeps last 5 backups)
- ✅ **Backup location**: `{DATABASE_DIR}/backups/`

### Manual Backup
```bash
# Create backup
cp /var/lib/spending-tracker/spending.db \
   /var/lib/spending-tracker/backups/manual-$(date +%Y%m%d-%H%M%S).db

# Restore from backup
cp /var/lib/spending-tracker/backups/spending-20241201-143022.db \
   /var/lib/spending-tracker/spending.db
```

### Automated Daily Backups (Cron)
```bash
# Add to crontab: crontab -e
0 2 * * * cp /var/lib/spending-tracker/spending.db /var/lib/spending-tracker/backups/daily-$(date +\%Y\%m\%d).db && find /var/lib/spending-tracker/backups/daily-* -mtime +30 -delete
```

## 🌐 Cloud Database Migration

### For High-Scale Production
Consider migrating from SQLite to a cloud database:

#### PostgreSQL (Recommended)
```bash
# Vercel Postgres
DATABASE_URL=postgres://username:password@host:port/database

# Supabase
DATABASE_URL=postgresql://username:password@host:port/database

# Railway
DATABASE_URL=postgresql://username:password@host:port/database
```

#### Migration Steps
1. Export SQLite data to SQL dump
2. Convert SQLite schema to PostgreSQL
3. Update database connection in `server/src/database/init.js`
4. Test migration with staging environment
5. Deploy to production

## 🚀 Docker Production Setup

### Dockerfile Database Volume
```dockerfile
# Create volume for persistent data
VOLUME ["/app/data"]

# Set database path
ENV DATABASE_PATH=/app/data/spending.db
```

### Docker Compose
```yaml
version: '3.8'
services:
  spending-tracker:
    build: .
    volumes:
      - spending_data:/app/data
    environment:
      - DATABASE_PATH=/app/data/spending.db
      - NODE_ENV=production

volumes:
  spending_data:
    driver: local
```

## 🔍 Health Checks

### Database Connectivity Test
```bash
# Test database access
node -e "
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.DATABASE_PATH || './data/spending.db');
db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
  console.log('Database OK - Users:', row.count);
  process.exit(0);
});
"
```

### Monitoring Script
```bash
#!/bin/bash
# check-db-health.sh

DB_PATH="/var/lib/spending-tracker/spending.db"

if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database file not found at $DB_PATH"
    exit 1
fi

# Check file permissions
if [ ! -r "$DB_PATH" ]; then
    echo "ERROR: Database file not readable"
    exit 1
fi

# Check file size (should be > 0)
if [ ! -s "$DB_PATH" ]; then
    echo "ERROR: Database file is empty"
    exit 1
fi

echo "Database health check passed"
```

## 📊 Performance Optimization

### SQLite Production Settings
```sql
-- Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;

-- Optimize for production
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
PRAGMA temp_store=memory;
```

### Database Maintenance
```bash
# Weekly vacuum (add to cron)
0 3 * * 0 sqlite3 /var/lib/spending-tracker/spending.db "VACUUM;"

# Analyze statistics
sqlite3 /var/lib/spending-tracker/spending.db "ANALYZE;"
```

## 🆘 Troubleshooting

### Common Issues

#### Database Locked
```bash
# Check for zombie processes
ps aux | grep spending-tracker

# Force unlock (use with caution)
fuser -k /var/lib/spending-tracker/spending.db
```

#### Permission Denied
```bash
# Fix ownership
sudo chown appuser:appuser /var/lib/spending-tracker/spending.db

# Fix permissions
sudo chmod 640 /var/lib/spending-tracker/spending.db
```

#### Disk Space
```bash
# Check disk usage
df -h /var/lib/spending-tracker/

# Check database size
ls -lh /var/lib/spending-tracker/spending.db
```

## 🎯 Quick Setup Commands

### Complete Production Setup
```bash
# 1. Run deployment script
./scripts/deploy.sh -p local

# 2. Verify database location
cat server/.env | grep DATABASE_PATH

# 3. Check database health
ls -la $(grep DATABASE_PATH server/.env | cut -d= -f2)

# 4. Test application
curl http://localhost:3001/api/health
```

This configuration ensures your production database is secure, performant, and properly backed up! 🚀
