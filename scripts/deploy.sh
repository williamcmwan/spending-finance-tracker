#!/bin/bash

# Spending Finance Tracker Deployment Script
# This script deploys the application to production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create environment files if they don't exist
    if [ ! -f client/.env ]; then
        print_status "Creating client environment file..."
        cp client/env.example client/.env
        print_warning "Created client/.env. Please update with your configuration."
    fi
    
    if [ ! -f server/.env ]; then
        print_status "Creating server environment file..."
        cp server/env.example server/.env
        
        # Set production database path
        print_status "Configuring production database path..."
        if [ -w "/var/lib" ]; then
            # System-wide data directory (preferred for production)
            PROD_DB_PATH="/var/lib/spending-tracker/spending.db"
            mkdir -p "/var/lib/spending-tracker"
        elif [ -w "/opt" ]; then
            # Application directory
            PROD_DB_PATH="/opt/spending-tracker/data/spending.db"
            mkdir -p "/opt/spending-tracker/data"
        else
            # User directory fallback
            PROD_DB_PATH="$HOME/spending-tracker/data/spending.db"
            mkdir -p "$HOME/spending-tracker/data"
        fi
        
        # Update the .env file with production database path
        sed -i.bak "s|DATABASE_PATH=.*|DATABASE_PATH=$PROD_DB_PATH|" server/.env
        
        # Set production environment
        sed -i.bak "s|NODE_ENV=.*|NODE_ENV=production|" server/.env
        
        # Get local IP address for CORS configuration (macOS compatible)
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
        
        if [ -n "$LOCAL_IP" ]; then
            # Update CORS origins to include local network IP
            CORS_ORIGINS="http://localhost:5173,http://localhost:4173,http://$LOCAL_IP:4173,http://$LOCAL_IP:5173"
            sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$CORS_ORIGINS|" server/.env
            print_status "Configured CORS for local network IP: $LOCAL_IP"
        fi
        
        print_warning "Created server/.env with production database path: $PROD_DB_PATH"
        print_warning "Please update server/.env with your production configuration."
    fi
    
    print_success "Environment setup completed"
}

# Function to backup database
backup_database() {
    print_status "Checking for database backup..."
    
    # Source the environment file to get DATABASE_PATH
    if [ -f server/.env ]; then
        export $(grep -v '^#' server/.env | xargs)
        
        if [ -n "$DATABASE_PATH" ] && [ -f "$DATABASE_PATH" ]; then
            local backup_dir="$(dirname "$DATABASE_PATH")/backups"
            local backup_file="$backup_dir/spending-$(date +%Y%m%d-%H%M%S).db"
            
            mkdir -p "$backup_dir"
            cp "$DATABASE_PATH" "$backup_file"
            
            print_success "Database backed up to: $backup_file"
            
            # Keep only last 5 backups
            ls -t "$backup_dir"/spending-*.db | tail -n +6 | xargs -r rm
            print_status "Old backups cleaned (keeping last 5)"
        else
            print_status "No existing database found, skipping backup"
        fi
    fi
}

# Function to build application
build_application() {
    print_status "Building application..."
    
    # Backup existing database before migration
    backup_database
    
    # Build client
    print_status "Building client..."
    cd client
    npm install
    npm run build:prod
    cd ..
    
    # Prepare server
    print_status "Preparing server..."
    cd server
    npm install
    npm run migrate
    cd ..
    
    print_success "Build completed successfully"
}

# Function to deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command_exists vercel; then
        print_error "Vercel CLI not found. Please install it with: npm i -g vercel"
        print_status "Then run: vercel login"
        exit 1
    fi
    
    cd client
    
    # Deploy to Vercel
    print_status "Deploying client to Vercel..."
    vercel --prod
    
    cd ..
    
    print_success "Vercel deployment completed"
    print_status "Your app is now live! Check the URL above."
}

# Function to deploy locally
deploy_local() {
    print_status "Setting up local deployment..."
    
    # Build the application
    build_application
    
    # Start servers
    print_status "Starting servers..."
    
    # Start server in background
    cd server
    print_status "Starting server on port 3001..."
    npm start &
    SERVER_PID=$!
    cd ..
    
    # Wait a moment for server to start
    sleep 3
    
    # Start client
    cd client
    print_status "Starting client on port 5173..."
    npm run preview &
    CLIENT_PID=$!
    cd ..
    
    print_success "Local deployment started!"
    print_status "Server: http://localhost:3001"
    print_status "Client: http://localhost:4173 (Vite preview)"
    print_status "Press Ctrl+C to stop all servers"
    
    # Wait for user to stop
    wait
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM  Deployment platform (vercel|local) [default: local]"
    echo "  -s, --setup              Setup environment only"
    echo "  -b, --build              Build application only"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Platforms:"
    echo "  local                    Deploy locally"
    echo "  vercel                   Deploy to Vercel (recommended)"
    echo ""
    echo "Examples:"
    echo "  $0                        # Deploy locally"
    echo "  $0 -p vercel             # Deploy to Vercel"
    echo "  $0 -s                    # Setup environment only"
    echo "  $0 -b                    # Build application only"
}

# Main deployment function
main() {
    local platform="local"
    local setup_only=false
    local build_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--platform)
                platform="$2"
                shift 2
                ;;
            -s|--setup)
                setup_only=true
                shift
                ;;
            -b|--build)
                build_only=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate platform
    if [[ "$platform" != "vercel" && "$platform" != "local" ]]; then
        print_error "Invalid platform: $platform. Use 'vercel' or 'local'"
        exit 1
    fi
    
    print_status "Starting deployment..."
    print_status "Platform: $platform"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    if [ "$setup_only" = true ]; then
        print_success "Environment setup completed!"
        exit 0
    fi
    
    # Build application
    build_application
    
    if [ "$build_only" = true ]; then
        print_success "Build completed!"
        exit 0
    fi
    
    # Deploy based on platform
    case $platform in
        "vercel")
            deploy_vercel
            ;;
        "local")
            deploy_local
            ;;
    esac
    
    print_success "Deployment completed successfully!"
}

# Run main function with all arguments
main "$@"
