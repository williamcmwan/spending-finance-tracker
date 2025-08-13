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
        print_warning "Created server/.env. Please update with your configuration."
    fi
    
    print_success "Environment setup completed"
}

# Function to build application
build_application() {
    print_status "Building application..."
    
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
