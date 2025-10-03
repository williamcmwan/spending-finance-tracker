# Spending Finance Tracker

A modern, full-stack finance tracking application with **multi-currency support**, **TOTP 2FA security**, **dark mode**, and **single-server deployment**. Features drag-and-drop import, intelligent category management, and fully responsive mobile-optimized UI. Built with React, TypeScript, Express.js, and SQLite.

## 🎯 Key Features

- **Single-Server Architecture**: Frontend and backend served from one port (3001)
- **No CORS Issues**: Relative API calls eliminate cross-origin problems
- **HTTPS Ready**: Works seamlessly with Cloudflare proxy and reverse proxies
- **Multi-Currency Support**: Track transactions in multiple currencies with automatic conversion
- **TOTP 2FA Security**: Mobile authenticator app integration (Google Authenticator, Authy, etc.)
- **Dark Mode**: Full dark mode support with system preference detection
- **Drag-and-Drop Import**: CSV file upload with intelligent parsing
- **Smart Categories**: 80+ icons with automatic color assignment
- **Advanced Analytics**: Monthly trends, spending breakdowns, capital expenditure tracking
- **Fully Responsive**: Mobile-optimized UI with touch-friendly controls

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

### 🔐 Authentication & Security
- Email/password registration and login
- **TOTP 2FA**: Mobile authenticator app support (Google Authenticator, Authy, Microsoft Authenticator)
- QR code setup for easy 2FA enrollment
- JWT-based authentication with secure session management
- Protected routes with middleware
- Optional 2FA bypass for development (BYPASS_2FA env variable)

### 💰 Transaction Management
- **Three Types**: Income, Expense, Capital Expenditure (Capex)
- **Multi-Currency Support**: Track transactions in USD, EUR, GBP, INR, AUD, CAD, JPY, CNY
- **Currency Conversion**: Automatic exchange rate handling and display
- **Inline Editing**: Click-to-edit fields (description, date, source, amount)
- **Smart Categories**: 80+ icons with intelligent color assignment
- **Advanced Filtering**: Amount ranges, types, date ranges, categories
- **CSV Import/Export**: Drag-and-drop with source tracking
- **Lazy Loading**: Performance-optimized for large datasets

### 📊 Analytics & Dashboard
- **Flexible Date Ranges**: Calendar picker with presets (This Month, Last Month, This Year, etc.)
- **Summary Cards**: Income, Spending, Net Income, Savings Rate, Capex with trend indicators
- **Multi-Currency Dashboard**: All amounts displayed in selected currency
- **Monthly Trends**: Category spending breakdown with pagination
- **Performance Optimized**: Lazy loading, intersection observers, efficient data fetching
- **Dark Mode**: Full dark theme with automatic system detection
- **Fully Responsive**: Touch-optimized mobile interface with collapsible sidebar

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
- **SQLite3** database with migrations
- **JWT** authentication with 2FA support
- **Speakeasy** for TOTP 2FA
- **bcryptjs** for password hashing
- **Helmet.js** for security headers
- **express-validator** for input validation

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

# 2FA Configuration
BYPASS_2FA=false  # Set to 'true' for development to skip 2FA

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
- **users**: Authentication, profiles, and TOTP 2FA secrets
- **categories**: Icons, colors, and metadata
- **transactions**: Financial data with multi-currency support and source tracking

Features:
- Automatic schema migrations
- Multi-currency transaction support (currency and converted amounts)
- TOTP secret storage for 2FA
- Source field for transaction origins
- Optimized indexing for performance
- Data integrity with foreign keys

## 🔒 Security

- **TOTP 2FA**: Time-based one-time passwords with mobile authenticator apps
- **JWT Authentication**: Secure token-based auth with two-stage verification
- **Password Hashing**: bcrypt with salt rounds for secure storage
- **CORS Protection**: Configured allowed origins
- **Security Headers**: Helmet.js protection
- **Input Validation**: Server-side validation with express-validator
- **Environment Variables**: Sensitive data protection
- **Secure Session Management**: 7-day JWT tokens with automatic refresh

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