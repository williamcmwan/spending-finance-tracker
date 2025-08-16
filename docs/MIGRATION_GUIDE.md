# Migration Guide: New Client/Server Structure

This guide explains the changes made to reorganize the project into a client/server structure and how to migrate your existing setup.

## What Changed

### Project Structure

**Before:**
```
spending-finance-tracker/
├── src/                 # All source code
├── public/              # Static assets
├── supabase/            # Database config
├── package.json         # Single package.json
└── README.md
```

**After:**
```
spending-finance-tracker/
├── client/              # Frontend React application
│   ├── src/            # React components and pages
│   ├── public/         # Static assets
│   └── package.json    # Client dependencies
├── server/             # Backend Express server
│   ├── src/            # Server source code
│   │   ├── database/   # SQLite database setup
│   │   └── routes/     # API routes
│   ├── data/           # SQLite database files
│   └── package.json    # Server dependencies
├── scripts/            # Deployment and setup scripts
├── docs/               # Documentation
├── package.json        # Root package.json (monorepo)
└── README.md
```

## Migration Steps

### 1. Update Your Development Workflow

**Old way:**
```bash
npm install
npm run dev
```

**New way:**
```bash
# Setup everything
./scripts/setup.sh

# Or setup and start servers
./scripts/setup.sh -r

# Or use root commands
npm run install:all
npm run dev
```

### 2. Environment Variables

**Client Environment (`client/.env`):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Server Environment (`server/.env`):**
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
CLIENT_URL=http://localhost:5173
DATABASE_PATH=./data/spending.db
```

### 3. New Scripts Available

#### Root Level Scripts
```bash
npm run dev              # Start both client and server
npm run dev:client       # Start only client
npm run dev:server       # Start only server
npm run build            # Build both client and server
npm run build:client     # Build only client
npm run build:server     # Build only server
npm run lint             # Lint both client and server
npm run type-check       # Type check both client and server
npm run setup            # Run setup script
npm run deploy           # Run deployment script
```

#### Client Scripts (`cd client`)
```bash
npm run dev              # Start development server
npm run build:prod       # Build for production
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
```

#### Server Scripts (`cd server`)
```bash
npm run dev              # Start development server
npm run build            # Build database
npm run deploy           # Deploy to production
npm run reset            # Reset database
```

### 4. Deployment Changes

**Old way:**
```bash
npm run build
# Manual deployment steps
```

**New way:**
```bash
# Automated deployment
./scripts/deploy.sh

# Deploy to specific platform
./scripts/deploy.sh -p vercel
./scripts/deploy.sh -p railway

# Deploy to production
./scripts/deploy.sh -e prod
```

## Benefits of the New Structure

### 1. **Separation of Concerns**
- Frontend and backend are clearly separated
- Each has its own dependencies and configuration
- Easier to maintain and scale

### 2. **Flexible Deployment**
- Deploy frontend and backend independently
- Support for multiple deployment platforms
- Environment-specific configurations

### 3. **Better Development Experience**
- Parallel development of frontend and backend
- Independent versioning
- Clearer project organization

### 4. **Enhanced Tooling**
- Automated setup and deployment scripts
- Comprehensive documentation
- CI/CD pipeline support

## Common Issues and Solutions

### Issue: "Command not found" for scripts
**Solution:** Make sure scripts are executable:
```bash
chmod +x scripts/*.sh
```

### Issue: Environment variables not working
**Solution:** Check that you have the correct environment files:
```bash
# Client
cp client/.env.example client/.env
# Edit client/.env

# Server
cp server/env.example server/.env
# Edit server/.env
```

### Issue: Supabase connection failing
**Solution:** Verify your Supabase configuration:
```bash
cd server
supabase status
supabase db reset
```

### Issue: Build failures
**Solution:** Clean and reinstall dependencies:
```bash
npm run clean
npm run install:all
```

## Updating Your CI/CD Pipeline

If you have existing CI/CD pipelines, update them to use the new structure:

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm run install:all

- name: Build
  run: npm run build

- name: Deploy
  run: ./scripts/deploy.sh -e prod
```

### Vercel Configuration
Update your `vercel.json` to point to the client directory:
```json
{
  "buildCommand": "cd client && npm run build:prod",
  "outputDirectory": "client/dist"
}
```

## Rollback Plan

If you need to rollback to the old structure:

1. **Backup your current work**
2. **Restore from git history** (if using version control)
3. **Reorganize files manually** if needed

## Support

If you encounter issues during migration:

1. Check the [Deployment Guide](DEPLOYMENT.md)
2. Review the [README.md](../README.md)
3. Create an issue in the repository
4. Check the troubleshooting section in the deployment guide

## Next Steps

After migration:

1. **Test your application** thoroughly
2. **Update your deployment pipelines**
3. **Configure monitoring** for both client and server
4. **Set up proper logging** and error tracking
5. **Document any custom configurations**

---

**Happy coding with the new structure! 🚀**
