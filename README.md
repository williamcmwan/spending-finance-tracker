# Spending Finance Tracker

A modern, full-stack finance tracking application with **single-server deployment**, drag-and-drop import, and intelligent category management. Built with React, TypeScript, Express.js, and SQLite.

## 🎯 Key Features

- **Single-Server Architecture**: Frontend and backend served from one port (3001)
- **No CORS Issues**: Relative API calls eliminate cross-origin problems
- **HTTPS Ready**: Works seamlessly with Cloudflare proxy and reverse proxies
- **Drag-and-Drop Import**: CSV file upload with intelligent parsing
- **Smart Categories**: 80+ icons with automatic color assignment
- **Advanced Analytics**: Monthly trends, spending breakdowns, capital expenditure tracking
- **Responsive Design**: Mobile-first with modern UI components

## 🏗️ Architecture

```
spending-finance-tracker/
├── client/                # React frontend (builds to dist/)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Route pages
│   │   ├── contexts/      # React contexts
│   │   └── integrations/  # API client
│   └── dist/              # Built static files (served by server)
├── server/                # Express.js backend
│   ├── src/
│   │   ├── routes/        # API endpoints (/api/*)
│   │   ├── database/      # SQLite setup
│   │   └── config/        # Authentication config
│   └── data/              # SQLite database files
├── scripts/               # Management scripts
│   ├── deploy.sh          # Build and deploy
│   ├── app.sh             # Start/stop/status
│   └── setup.sh           # Development setup
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm
- Git

### Development Setup

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd spending-finance-tracker
./scripts/setup.sh
```

2. **Build and start:**
```bash
./scripts/deploy.sh        # Build client files
./scripts/app.sh start     # Start single server
```

3. **Access application:**
- **Frontend + API**: http://localhost:3001
- **Health check**: http://localhost:3001/health
- **API status**: http://localhost:3001/api/status

## 🔧 Single-Server Deployment

### How It Works
1. **Client Build**: React app builds to `client/dist/`
2. **Server Serves All**: Express serves static files + API routes
3. **Relative URLs**: Client uses `/api/*` for all requests
4. **Same Origin**: No CORS, mixed content, or proxy issues

### Production Deployment

```bash
# Build for production
./scripts/deploy.sh -e production

# Start application
./scripts/app.sh start

# Check status
./scripts/app.sh status

# View logs
./scripts/app.sh logs

# Stop application
./scripts/app.sh stop
```

### Environment Detection

The deployment script automatically configures based on `server/.env`:

```bash
# Production mode
NODE_ENV=production
HOST=0.0.0.0
PORT=3001

# Development mode  
NODE_ENV=development
HOST=0.0.0.0
PORT=3001
```

## 🌐 Network Access

### Local Development
- **Local**: `http://localhost:3001`
- **Network**: `http://192.168.x.x:3001`

### Production with Cloudflare
- **HTTPS**: `https://yourdomain.com` (Cloudflare proxy to port 3001)
- **Direct**: `http://your-server-ip:3001`

### Reverse Proxy Setup (Optional)

For port 80/443 access, configure nginx or use iptables:

```bash
# Forward port 80 to 3001
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3001

# Forward port 443 to 3001 (if using SSL termination elsewhere)
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 3001
```

## 📋 Application Features

### 🔐 Authentication
- Email/password registration and login
- Google OAuth integration (optional)
- JWT-based authentication
- Protected routes

### 💰 Transaction Management
- **Three Types**: Income, Expense, Capital Expenditure (Capex)
- **Inline Editing**: Click-to-edit fields (description, date, source)
- **Smart Categories**: 80+ icons with intelligent color assignment
- **Advanced Filtering**: Amount ranges, types, date ranges
- **CSV Import/Export**: Drag-and-drop with source tracking
- **Lazy Loading**: Performance-optimized for large datasets

### 📊 Analytics & Dashboard
- **Flexible Date Ranges**: Calendar picker with presets
- **Summary Cards**: Income, Spending, Net Income, Savings Rate, Capex
- **Monthly Trends**: Category spending with pagination
- **Performance Optimized**: Lazy loading, intersection observers
- **Responsive Design**: Mobile-first with modern UI

### 🗂️ Category Management
- **Custom Categories**: Create with icons and colors
- **Smart Assignment**: Automatic color coordination
- **Default Categories**: Pre-configured with optimized icons
- **Duplicate Detection**: Intelligent merging

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for building and development
- **Tailwind CSS** + **shadcn/ui** components
- **React Router** for routing
- **React Query** for data fetching
- **Zod** for validation

### Backend
- **Express.js** with ES modules
- **SQLite3** database
- **JWT** authentication
- **Passport.js** for OAuth
- **Helmet.js** for security

### Development
- **ESLint** + **Prettier**
- **TypeScript** throughout
- **Shell scripts** for automation

## 🔧 Configuration

### Server Environment (`server/.env`)
```env
# Server Configuration
PORT=3001
NODE_ENV=production
HOST=0.0.0.0

# Authentication
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Database
DATABASE_PATH=./data/spending.db

# CORS (for single-server deployment)
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com
```

### Client Configuration
No environment variables needed! The client automatically uses relative URLs (`/api/*`) for all requests.

## 📚 Scripts Reference

### Root Commands
```bash
npm run setup          # ./scripts/setup.sh
npm run deploy         # ./scripts/deploy.sh
npm run deploy:prod    # ./scripts/deploy.sh -e production
npm start              # ./scripts/app.sh start
npm stop               # ./scripts/app.sh stop
npm run status         # ./scripts/app.sh status
npm run logs           # ./scripts/app.sh logs
```

### Management Scripts
```bash
./scripts/app.sh start    # Start application
./scripts/app.sh stop     # Stop application  
./scripts/app.sh restart  # Restart application
./scripts/app.sh status   # Show status
./scripts/app.sh logs     # Show logs
```

## 🗄️ Database

**SQLite** with automatic migrations:
- **users**: Authentication and profiles
- **categories**: Icons, colors, and metadata
- **transactions**: Financial data with source tracking

Features:
- Automatic schema migrations
- Source field for transaction origins
- Optimized indexing for performance
- Data integrity with foreign keys

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for secure storage
- **CORS Protection**: Configured allowed origins
- **Security Headers**: Helmet.js protection
- **Input Validation**: Server-side validation
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment Benefits

### Single-Server Advantages
- ✅ **No CORS Issues**: Same origin for all requests
- ✅ **No Mixed Content**: All HTTPS or all HTTP
- ✅ **Simplified Proxy**: One port to forward
- ✅ **Better Performance**: No cross-origin latency
- ✅ **Easier SSL**: Single certificate needed
- ✅ **Simplified Deployment**: One server to manage

### Cloudflare Ready
- ✅ **Proxy Support**: Works with Cloudflare proxy
- ✅ **SSL Termination**: HTTPS handled by Cloudflare
- ✅ **CDN Benefits**: Static assets cached
- ✅ **DDoS Protection**: Built-in security

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if port is in use
lsof -i :3001

# Force stop any processes
./scripts/app.sh force-stop
```

**Client not served:**
```bash
# Ensure client is built
ls -la client/dist/

# Rebuild if missing
./scripts/deploy.sh
```

**Environment issues:**
```bash
# Check server environment
cat server/.env

# Verify NODE_ENV is set correctly
```

### Health Checks
- **Server**: `http://localhost:3001/health`
- **API**: `http://localhost:3001/api/status`
- **Frontend**: `http://localhost:3001/`

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test with `./scripts/deploy.sh && ./scripts/app.sh start`
4. Submit a pull request

---

**Happy tracking! 💰**

*Single-server deployment makes everything simpler.*