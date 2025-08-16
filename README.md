# Spending Finance Tracker

A modern, full-stack finance tracking application built with React, TypeScript, Express.js, and SQLite. Track your spending, categorize transactions, and gain insights into your financial habits with an intuitive drag-and-drop import system and comprehensive category management.

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
- ✅ **Three transaction types**: Income, Expense, Capital Expenditure (Capex)
- ✅ **Inline editing** for transaction fields (description, date, source)
- ✅ Categorize transactions with meaningful colors and icons
- ✅ **Source field tracking** (bank names, import sources)
- ✅ **Advanced filtering**: Min/Max amount, transaction type, date range
- ✅ **CSV export** with source and transaction type fields
- ✅ Date-based organization with flexible date ranges
- ✅ Bulk import with CSV drag-and-drop support
- ✅ **Lazy loading** for large transaction lists (performance optimized)

### Dashboard & Analytics
- ✅ **Enhanced dashboard** with comprehensive financial overview
- ✅ **Flexible date range picker** with calendar interface
- ✅ **Quick date presets**: This Month, Last Month, Last 3/6/12 Months, This Year
- ✅ **Default 6-month view** for immediate data visibility
- ✅ **Category icons** displayed in transaction lists
- ✅ **Real-time summary cards**: Income, Spending, Net Income, Savings Rate, Capital Expenditure
- ✅ **Lazy-loaded transaction list** with scroll-based pagination
- ✅ **Monthly category spending table** with pagination and trend indicators
- ✅ **Chronological month sorting** with year display (Jan 2024, Feb 2024)
- ✅ **8-month pagination** for category spending analysis
- ✅ **Hover percentage indicators** for month-over-month changes
- ✅ Category-wise spending breakdown
- ✅ Monthly spending trends with top category selection
- ✅ Income vs expense tracking

### Categories
- ✅ Custom category creation with 80+ icon options
- ✅ **Category icons** with color-coordinated display
- ✅ Intelligent color assignment based on category type
- ✅ Automatic category name capitalization
- ✅ Duplicate category detection and merging
- ✅ Default categories with optimized colors and icons

### Data Management
- ✅ **Source field database migration** with automatic updates
- ✅ **CSV data matching** for source field population
- ✅ **Database optimization** for large datasets
- ✅ **Unlimited transaction loading** (removed artificial limits)
- ✅ Drag-and-drop CSV file upload
- ✅ Visual feedback during file operations
- ✅ Automatic file type validation
- ✅ Transaction validation and preview
- ✅ Bulk import with selective transaction import
- ✅ Template download for proper CSV formatting

### User Experience
- ✅ **Modern popover components** with proper z-index management
- ✅ **Intersection Observer** for smooth lazy loading
- ✅ **Inline editing** with keyboard shortcuts (Enter/Escape)
- ✅ **Calendar date picker** with 2-month view
- ✅ **Quick date selection** dropdown menu
- ✅ Responsive design with modern UI components
- ✅ Dark/light mode support
- ✅ Mobile-friendly interface
- ✅ Real-time data updates
- ✅ Smooth animations and transitions
- ✅ Intuitive category color coding

### Performance Optimizations
- ✅ **Lazy loading** for transaction lists (50 transactions per batch)
- ✅ **Intersection Observer** for automatic scroll-based loading
- ✅ **Separated data fetching** (summary vs. display data)
- ✅ **Memory-efficient rendering** for large datasets
- ✅ **Progressive data loading** to avoid UI blocking

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
- **categories** - Transaction categories with icons and colors
- **transactions** - Financial transactions with source field tracking

### Database Features
- ✅ **Automatic migrations** for schema updates
- ✅ **Source field** for tracking transaction origins (banks, import sources)
- ✅ **Category icons** with 80+ icon options
- ✅ **Optimized indexing** for fast queries on large datasets
- ✅ **Data integrity** with foreign key constraints

The database is automatically initialized when you run the setup script. Migrations are applied automatically when needed.

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

## 🆕 Recent Updates

### Version 2.1.0 - Advanced Analytics & UX Release

#### 📊 **Monthly Category Spending Analysis**
- **8-Month Pagination**: Navigate through spending data in 8-month chunks
- **Chronological Sorting**: Months sorted by year and date (Jan 2024, Feb 2024)
- **Trend Indicators**: Hover to see month-over-month percentage changes
- **Scrollbar-Free Design**: Clean layout without horizontal/vertical scrollbars
- **Readable Text**: Optimized font sizes for better readability

#### 💰 **Capital Expenditure (Capex) Support**
- **Three Transaction Types**: Income, Expense, and Capital Expenditure
- **Capex Summary Card**: Dedicated tracking for capital investments
- **Automatic Categorization**: Garden, Solar, Rental Property → Capex
- **Filtered Analytics**: Charts exclude capex for operational spending analysis

#### 🎯 **Enhanced User Experience**
- **6-Month Default**: Dashboard opens with last 6 months of data
- **Advanced Filtering**: Min/Max amount filters for transaction search
- **Enhanced CSV Export**: Includes source and transaction type fields
- **Improved Tooltips**: Clean percentage indicators without redundant text

#### 🚀 **Performance & Technical Improvements**
- **Database Migrations**: Automatic schema updates for new features
- **Data Integrity**: Source field corruption detection and repair
- **Memory Optimization**: Efficient handling of large transaction datasets
- **Responsive Design**: Improved mobile and tablet experience

### Version 2.0.0 - Major Feature Release

#### 🎯 **Enhanced Dashboard Experience**
- **Flexible Date Ranges**: Calendar-based date picker with custom range selection
- **Quick Date Presets**: One-click access to common periods (This Month, Last 3/6/12 Months, etc.)
- **Lazy Loading**: Performance-optimized transaction loading with scroll-based pagination
- **Category Icons**: Visual category identification with color-coordinated icons

#### 💾 **Database Improvements**
- **Source Field Migration**: Automatic database updates with CSV data matching
- **Unlimited Transactions**: Removed artificial limits for large datasets
- **Performance Optimization**: Enhanced indexing and query optimization

#### ⚡ **Performance Enhancements**
- **Intersection Observer**: Smooth scroll-based lazy loading
- **Memory Management**: Progressive data loading to prevent UI blocking
- **Separated Data Fetching**: Optimized summary vs. display data loading

#### 🎨 **User Interface Improvements**
- **Inline Editing**: Click-to-edit functionality for transaction fields
- **Modern Popover Components**: Enhanced calendar and dropdown interfaces
- **Responsive Design**: Improved mobile and desktop experience
- **Visual Feedback**: Better loading states and user interactions

#### 🔧 **Technical Improvements**
- **Component Architecture**: Modular popover and calendar components
- **TypeScript Integration**: Enhanced type safety across the application
- **Error Handling**: Improved error states and recovery mechanisms

---

**Happy tracking! 💰**
