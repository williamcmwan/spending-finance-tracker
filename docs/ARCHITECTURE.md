# 🏗️ Architecture Overview - Single-Server Deployment

## 📋 System Architecture

The Spending Finance Tracker uses a **unified single-server architecture** where both the frontend React application and backend Express.js API are served from a single Node.js process on port 3001.

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Express.js Server                │
│                        Port 3001                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   Static Files  │    │        API Routes               │ │
│  │   (React App)   │    │        /api/*                   │ │
│  │                 │    │                                 │ │
│  │  • index.html   │    │  • /api/auth/*                  │ │
│  │  • /assets/*    │    │  • /api/transactions/*          │ │
│  │  • /favicon.ico │    │  • /api/categories/*            │ │
│  │  • /* (SPA)     │    │  • /api/analytics/*             │ │
│  └─────────────────┘    │  • /api/import/*                │ │
│                         │  • /health                      │ │
│                         │  • /api/status                  │ │
│                         └─────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    SQLite Database                          │
│                   server/data/spending.db                   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Components

### Frontend (React SPA)
- **Location**: `client/dist/` (built static files)
- **Served by**: Express.js static middleware
- **Routing**: Client-side routing with fallback to `index.html`
- **API Calls**: Relative URLs (`/api/*`)

### Backend (Express.js API)
- **Location**: `server/src/`
- **Routes**: All API endpoints under `/api/*`
- **Authentication**: JWT + Passport.js
- **Database**: SQLite3 with automatic migrations

### Database (SQLite)
- **Location**: `server/data/spending.db`
- **Schema**: Users, Categories, Transactions
- **Features**: Automatic migrations, indexing, foreign keys

## 🔄 Request Flow

### Frontend Requests
```
Browser Request: https://yourdomain.com/dashboard
        ↓
Express Server (Port 3001)
        ↓
Static File Middleware
        ↓
Serve: client/dist/index.html
        ↓
React Router handles /dashboard
```

### API Requests
```
Frontend: fetch('/api/transactions')
        ↓
Express Server (Port 3001)
        ↓
API Route: /api/transactions
        ↓
SQLite Database Query
        ↓
JSON Response
```

## 🚀 Deployment Architecture

### Development
```bash
./scripts/deploy.sh      # Build client to dist/
./scripts/app.sh start   # Start single server
# Access: http://localhost:3001
```

### Production with Cloudflare
```
User Request: https://yourdomain.com
        ↓
Cloudflare Proxy (SSL Termination)
        ↓
Your Server: Port 3001
        ↓
Express Server (Frontend + API)
```

### Production with Reverse Proxy
```
User Request: https://yourdomain.com
        ↓
Nginx/Apache (Port 80/443)
        ↓
Proxy to: localhost:3001
        ↓
Express Server (Frontend + API)
```

## 📁 File Structure

```
spending-finance-tracker/
├── client/                    # Frontend source
│   ├── src/                   # React components
│   ├── dist/                  # Built files (served by server)
│   └── package.json           # Frontend dependencies
├── server/                    # Backend source
│   ├── src/
│   │   ├── index.js          # Main server file
│   │   ├── routes/           # API endpoints
│   │   ├── database/         # SQLite setup
│   │   └── config/           # Auth configuration
│   ├── data/                 # SQLite database
│   └── package.json          # Backend dependencies
├── scripts/                  # Management scripts
│   ├── deploy.sh             # Build & deploy
│   ├── app.sh                # Start/stop/status
│   └── setup.sh              # Development setup
└── docs/                     # Documentation
    ├── DEPLOYMENT.md         # Deployment guide
    ├── MIGRATION_GUIDE.md    # Migration instructions
    └── ARCHITECTURE.md       # This file
```

## 🔧 Configuration

### Server Configuration (`server/src/index.js`)
```javascript
// Serve static files from client build
const clientBuildPath = path.join(__dirname, '../../client/dist');
const hasClientBuild = fs.existsSync(clientBuildPath);

if (hasClientBuild) {
  // Serve static assets
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

### Client Configuration (`client/src/integrations/api/client.js`)
```javascript
const getApiBaseUrl = () => {
  // Single-server deployment: always use relative URLs
  return '/api';
};
```

## 🌐 Network Architecture

### Port Usage
- **Single Port**: 3001 (everything)
- **No CORS**: Same origin for all requests
- **No Mixed Content**: Consistent protocol

### Access Patterns
```
Local Development:
http://localhost:3001/              → Frontend
http://localhost:3001/api/status    → API
http://localhost:3001/health        → Health Check

Production:
https://yourdomain.com/             → Frontend (via proxy)
https://yourdomain.com/api/status   → API (via proxy)
https://yourdomain.com/health       → Health Check (via proxy)
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login → /api/auth/login
2. Server validates credentials
3. JWT token generated
4. Token stored in HTTP-only cookie
5. Subsequent requests include cookie
6. Server validates JWT for protected routes
```

### Security Layers
- **Helmet.js**: Security headers
- **CORS**: Configured allowed origins
- **JWT**: Stateless authentication
- **bcrypt**: Password hashing
- **express-validator**: Input validation
- **HTTPS**: SSL/TLS encryption (via proxy)

## ⚡ Performance Architecture

### Frontend Optimizations
- **Vite Build**: Optimized production bundles
- **Code Splitting**: Dynamic imports
- **Lazy Loading**: Transaction lists
- **Caching**: Browser caching headers

### Backend Optimizations
- **SQLite Indexing**: Fast queries
- **Connection Pooling**: Database efficiency
- **Static File Serving**: Express.js built-in
- **Compression**: Gzip middleware

### Network Optimizations
- **Single Origin**: No CORS overhead
- **CDN Ready**: Works with Cloudflare
- **HTTP/2**: Supported via proxy
- **Asset Optimization**: Minified bundles

## 📊 Monitoring Architecture

### Health Checks
- **Server Health**: `/health` endpoint
- **API Status**: `/api/status` endpoint
- **Database**: Connection testing
- **File System**: Build file verification

### Logging
```
logs/
├── server.log    # Application logs
├── server.pid    # Process ID
└── (client.log)  # Legacy (not used in single-server)
```

### Process Management
```bash
./scripts/app.sh status    # Check running processes
./scripts/app.sh logs      # View application logs
./scripts/app.sh restart   # Restart application
```

## 🔄 Data Flow

### Transaction Creation Flow
```
1. User submits form → Frontend validation
2. POST /api/transactions → Express route
3. Input validation → express-validator
4. Authentication check → JWT middleware
5. Database insert → SQLite
6. Response → JSON success/error
7. Frontend update → React state
```

### File Import Flow
```
1. User drops CSV file → Frontend drag-and-drop
2. File validation → Client-side checks
3. POST /api/import/csv → Multer middleware
4. CSV parsing → PapaParse
5. Data validation → Server validation
6. Batch database insert → SQLite transaction
7. Progress updates → Real-time feedback
```

## 🚀 Scaling Considerations

### Vertical Scaling
- **CPU**: Single-threaded Node.js
- **Memory**: SQLite + Express.js
- **Storage**: SQLite file growth
- **Network**: Single port bandwidth

### Horizontal Scaling Options
- **Load Balancer**: Multiple server instances
- **Database**: Migrate to PostgreSQL
- **Session Storage**: Redis for sessions
- **File Storage**: External file service

### CDN Integration
- **Static Assets**: Serve via CDN
- **Database**: Keep local for simplicity
- **API**: Keep on origin server
- **Images**: Upload to external storage

## 🎯 Architecture Benefits

### Simplicity
- ✅ **Single Process**: One server to manage
- ✅ **Single Port**: One port to forward
- ✅ **Single Certificate**: One SSL cert needed
- ✅ **Single Origin**: No CORS complexity

### Performance
- ✅ **No Cross-Origin Latency**: Same server
- ✅ **Efficient Routing**: Express.js routing
- ✅ **Static File Serving**: Built-in middleware
- ✅ **Database Locality**: SQLite co-located

### Deployment
- ✅ **Simple Proxy**: One upstream server
- ✅ **Easy SSL**: Single certificate
- ✅ **Cloudflare Ready**: Works with proxy
- ✅ **Container Friendly**: Single container

### Development
- ✅ **Consistent URLs**: Same in dev/prod
- ✅ **No CORS Setup**: Same origin always
- ✅ **Simple Testing**: One server to test
- ✅ **Easy Debugging**: Single log file

---

**Single-server architecture: Simple, fast, and reliable! 🚀**
