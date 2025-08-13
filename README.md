# Spending Finance Tracker

A modern, full-stack finance tracking application built with React, TypeScript, Express.js, and SQLite. Track your spending, categorize transactions, and gain insights into your financial habits.

## 🏗️ Project Structure

```
spending-finance-tracker/
├── client/                # Frontend React application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── integrations/  # API client
│   │   └── lib/           # Utility functions
│   ├── public/            # Static assets
│   └── package.json       # Client dependencies
├── server/                # Backend Express server
│   ├── src/               # Server source code
│   │   ├── database/      # SQLite database setup
│   │   └── routes/        # API routes
│   ├── data/              # SQLite database files
│   └── package.json       # Server dependencies
├── scripts/               # Deployment and setup scripts
│   ├── deploy.sh          # Deployment script
│   ├── deploy-test.sh     # Test deployment script
│   └── setup.sh           # Development setup script
├── docs/                  # Documentation
│   ├── DEPLOYMENT.md      # Detailed deployment guide
│   └── TEST_DEPLOYMENT.md # Test deployment guide
├── package.json           # Root package.json (monorepo)
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm
- Git

### Development Setup

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd spending-finance-tracker
```

2. **Setup development environment:**
```bash
./scripts/setup.sh
```

3. **Start development servers:**
```bash
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Client-side routing
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **SQLite3** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Helmet.js** - Security headers
- **Morgan** - HTTP request logging

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📋 Features

### Authentication
- ✅ Email/password registration and login
- ✅ Google OAuth integration (optional)
- ✅ JWT-based authentication
- ✅ Protected routes

### Transaction Management
- ✅ Create, read, update, delete transactions
- ✅ Categorize transactions
- ✅ Filter and search transactions
- ✅ Date-based organization

### Categories
- ✅ Custom category creation
- ✅ Category color and icon customization
- ✅ Default categories included

### Analytics
- ✅ Spending summary dashboard
- ✅ Category-wise spending breakdown
- ✅ Monthly spending trends
- ✅ Income vs expense tracking

### User Experience
- ✅ Responsive design
- ✅ Dark/light mode support
- ✅ Mobile-friendly interface
- ✅ Real-time data updates

## 🚀 Deployment

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

For detailed deployment instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 🧪 Testing

### Test Deployment
```bash
# Local testing
./scripts/deploy-test.sh -p local

# Vercel testing
./scripts/deploy-test.sh -p vercel
```

For detailed testing instructions, see [TEST_DEPLOYMENT.md](docs/TEST_DEPLOYMENT.md).

## 📁 Scripts

### Root Scripts
- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run setup` - Setup development environment
- `npm run clean` - Clean build artifacts

### Client Scripts
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

### Server Scripts
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run migrate` - Initialize database
- `npm run reset` - Reset database

## 🔧 Configuration

### Environment Variables

#### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

#### Server (`server/.env`)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
DATABASE_PATH=./data/spending.db
```

## 🗄️ Database

The application uses SQLite for data storage with the following schema:

- **users** - User accounts and authentication
- **categories** - Transaction categories
- **transactions** - Financial transactions

The database is automatically initialized when you run the setup script.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet.js security headers
- Input validation with express-validator
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting guide](docs/DEPLOYMENT.md#troubleshooting)
2. Review the console logs
3. Verify environment variables
4. Check the health endpoint: `http://localhost:3001/health`

---

**Happy tracking! 💰**
