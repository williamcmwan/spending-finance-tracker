#!/bin/bash

# Spending Finance Tracker Unified Deployment Script
# This script deploys the application for both development and production
# Environment is determined by the .env file configuration

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

# Function to detect environment from .env file
detect_environment() {
    local env_file="server/.env"
    
    if [ ! -f "$env_file" ]; then
        print_warning "No server/.env file found. Assuming development environment."
        echo "development"
        return
    fi
    
    # Check NODE_ENV in .env file
    local node_env=$(grep "^NODE_ENV=" "$env_file" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
    
    if [ -n "$node_env" ]; then
        echo "$node_env"
    else
        print_warning "NODE_ENV not found in .env file. Assuming development environment."
        echo "development"
    fi
}

# Function to setup environment files
setup_environment() {
    local environment="$1"
    print_status "Setting up environment for: $environment"
    
    # Create client environment file if it doesn't exist
    if [ ! -f client/.env ]; then
        print_status "Creating client environment file..."
        if [ "$environment" = "production" ]; then
            # Get local IP for production
            LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
            if [ -n "$LOCAL_IP" ]; then
                cat > client/.env << EOF
# Production Client Configuration
VITE_API_URL=http://$LOCAL_IP:3001/api
EOF
                print_status "Created client/.env with production API URL: http://$LOCAL_IP:3001/api"
            else
                cp client/env.example client/.env 2>/dev/null || echo "VITE_API_URL=http://localhost:3001/api" > client/.env
                print_warning "Could not detect IP. Created client/.env with localhost. Please update manually."
            fi
        else
            cp client/env.example client/.env 2>/dev/null || echo "VITE_API_URL=http://localhost:3001/api" > client/.env
            print_status "Created client/.env for development"
        fi
    fi
    
    # Create server environment file if it doesn't exist
    if [ ! -f server/.env ]; then
        print_status "Creating server environment file..."
        cp server/env.example server/.env
        
        if [ "$environment" = "production" ]; then
            # Configure for production
            sed -i.bak "s|NODE_ENV=.*|NODE_ENV=production|" server/.env
            sed -i.bak "s|DATABASE_PATH=.*|DATABASE_PATH=./data/spending.db|" server/.env
            
            # Set production CORS
            LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
            if [ -n "$LOCAL_IP" ]; then
                CORS_ORIGINS="http://localhost:5173,http://localhost:4173,http://$LOCAL_IP:4173,http://$LOCAL_IP:5173"
                sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$CORS_ORIGINS|" server/.env
                print_status "Configured CORS for production with IP: $LOCAL_IP"
            fi
        else
            # Configure for development/test
            sed -i.bak "s|NODE_ENV=.*|NODE_ENV=development|" server/.env
            sed -i.bak "s|DATABASE_PATH=.*|DATABASE_PATH=./data/spending.db|" server/.env
        fi
        
        print_warning "Created server/.env. Please update with your configuration."
    fi
    
    print_success "Environment setup completed for: $environment"
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
            ls -t "$backup_dir"/spending-*.db 2>/dev/null | tail -n +6 | xargs -r rm
            print_status "Old backups cleaned (keeping last 5)"
        else
            print_status "No existing database found, skipping backup"
        fi
    fi
}

# Function to build application
build_application() {
    local environment="$1"
    print_status "Building application for: $environment"
    
    # Backup existing database before any changes
    backup_database
    
    # Build client
    print_status "Building client..."
    
    # Ensure we're in the project root
    if [ ! -d "client" ]; then
        print_error "Client directory not found. Make sure you're in the project root."
        exit 1
    fi
    
    # Build client
    print_status "Building client..."
    cd client
    
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        print_status "Installing client dependencies..."
        npm install
    fi
    
    # Create production environment file
    print_status "Configuring client API URL..."
    # Get the primary network interface IP (works on both Linux and macOS)
    local server_ip=$(ifconfig | grep -E "inet [0-9]" | grep -v "127.0.0.1" | head -1 | awk '{print $2}' | sed 's/addr://' 2>/dev/null || echo "192.168.20.30")
    echo "# Auto-generated client environment for production" > .env
    echo "VITE_API_URL=http://${server_ip}:3001/api" >> .env
    print_status "Client API URL set to: http://${server_ip}:3001/api"
    
    # Clean any problematic temp files
    rm -rf node_modules/.vite-temp .vite 2>/dev/null || true
    
    # Build for production
    print_status "Building client for production..."
    npm run build
    
    # Verify build was successful
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not created"
        exit 1
    fi
    
    cd ..
    
    # Prepare server
    print_status "Preparing server..."
    cd server
    npm install
    
    # Set server host for production
    if [ "$environment" = "production" ]; then
        print_status "Configuring server for network access..."
        if [ ! -f ".env" ]; then
            cp env.example .env
        fi
        # Update or add HOST setting
        if grep -q "^HOST=" .env; then
            sed -i.bak 's/^HOST=.*/HOST=0.0.0.0/' .env
        else
            echo "HOST=0.0.0.0" >> .env
        fi
    fi
    
    cd ..
    
    print_success "Build completed successfully for: $environment"
}

# Function to deploy to Vercel
deploy_vercel() {
    local environment="$1"
    print_status "Deploying to Vercel ($environment)..."
    
    if ! command_exists vercel; then
        print_error "Vercel CLI not found. Please install it with: npm i -g vercel"
        print_status "Then run: vercel login"
        exit 1
    fi
    
    cd client
    
    if [ "$environment" = "production" ]; then
        print_status "Deploying to Vercel production..."
        vercel --prod
    else
        print_status "Deploying to Vercel preview..."
        vercel
    fi
    
    cd ..
    
    print_success "Vercel deployment completed"
    print_status "Your app is now live! Check the URL above."
}

# Function to deploy locally
deploy_local() {
    local environment="$1"
    print_status "Setting up local deployment ($environment)..."
    
    # Build the application
    build_application "$environment"
    
    print_success "Local deployment setup completed for: $environment"
    print_status "Use './scripts/app.sh start' to start the application"
    print_status "Use './scripts/app.sh stop' to stop the application"
    print_status "Use './scripts/app.sh restart' to restart the application"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM  Deployment platform (vercel|local) [default: local]"
    echo "  -e, --env ENVIRONMENT     Force environment (development|production) [default: auto-detect from .env]"
    echo "  -s, --setup              Setup environment only"
    echo "  -b, --build              Build application only"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Platforms:"
    echo "  local                    Deploy locally"
    echo "  vercel                   Deploy to Vercel"
    echo ""
    echo "Environment Detection:"
    echo "  The script automatically detects the environment from server/.env NODE_ENV setting."
    echo "  Use -e flag to override auto-detection."
    echo ""
    echo "Examples:"
    echo "  $0                        # Auto-detect environment, deploy locally"
    echo "  $0 -p vercel             # Auto-detect environment, deploy to Vercel"
    echo "  $0 -e production         # Force production environment, deploy locally"
    echo "  $0 -s                    # Setup environment only"
    echo "  $0 -b                    # Build application only"
}

# Main deployment function
main() {
    local platform="local"
    local environment=""
    local setup_only=false
    local build_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--platform)
                platform="$2"
                shift 2
                ;;
            -e|--env)
                environment="$2"
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
    
    # Detect environment if not specified
    if [ -z "$environment" ]; then
        environment=$(detect_environment)
    fi
    
    # Validate environment
    if [[ "$environment" != "development" && "$environment" != "production" && "$environment" != "test" ]]; then
        print_error "Invalid environment: $environment. Use 'development', 'production', or 'test'"
        exit 1
    fi
    
    print_status "Starting deployment..."
    print_status "Platform: $platform"
    print_status "Environment: $environment"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment "$environment"
    
    if [ "$setup_only" = true ]; then
        print_success "Environment setup completed!"
        exit 0
    fi
    
    # Build application
    build_application "$environment"
    
    if [ "$build_only" = true ]; then
        print_success "Build completed!"
        exit 0
    fi
    
    # Deploy based on platform
    case $platform in
        "vercel")
            deploy_vercel "$environment"
            ;;
        "local")
            deploy_local "$environment"
            ;;
    esac
    
    print_success "Deployment completed successfully!"
    print_status "Environment: $environment"
    print_status "Platform: $platform"
}

# Run main function with all arguments
main "$@"