#!/bin/bash

# Spending Finance Tracker Test Deployment Script
# This script deploys the application to a testing environment

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

# Function to setup test environment
setup_test_env() {
    print_status "Setting up test environment..."
    
    # Create test environment files
    if [ ! -f client/.env.test ]; then
        print_status "Creating client test environment file..."
        cat > client/.env.test << EOF
# Test Environment Variables
VITE_API_URL=http://localhost:3001/api
EOF
        print_warning "Created client/.env.test. Please update with your test API URL."
    fi
    
    if [ ! -f server/.env.test ]; then
        print_status "Creating server test environment file..."
        cat > server/.env.test << EOF
# Test Environment Variables
PORT=3001
NODE_ENV=test

# JWT Configuration
JWT_SECRET=test_jwt_secret_key_change_in_production

# Session Configuration
SESSION_SECRET=test_session_secret_change_in_production

# Google OAuth Configuration (Optional - leave empty to disable Google login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Client Configuration
CLIENT_URL=http://localhost:5173

# Database Configuration (SQLite)
DATABASE_PATH=./data/spending-test.db

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EOF
        print_warning "Created server/.env.test. Please update with your test configuration."
    fi
    
    print_success "Test environment files created"
}

# Function to build for testing
build_for_test() {
    print_status "Building application for testing..."
    
    # Build client for testing
    print_status "Building client..."
    cd client
    npm install
    cp .env.test .env 2>/dev/null || true
    npm run build:prod
    cd ..
    
    # Prepare server for testing
    print_status "Preparing server..."
    cd server
    npm install
    cp .env.test .env 2>/dev/null || true
    npm run migrate
    cd ..
    
    print_success "Build completed successfully"
}

# Function to deploy to Vercel (testing)
deploy_vercel_test() {
    print_status "Deploying to Vercel (testing)..."
    
    if ! command_exists vercel; then
        print_error "Vercel CLI not found. Please install it with: npm i -g vercel"
        print_status "Then run: vercel login"
        exit 1
    fi
    
    cd client
    
    # Deploy to Vercel with test environment
    print_status "Deploying client to Vercel..."
    vercel --env VITE_API_URL=https://your-test-api-url.com/api --prod
    
    cd ..
    
    print_success "Vercel deployment completed"
    print_status "Your app is now live! Check the URL above."
}

# Function to run local test deployment
deploy_local_test() {
    print_status "Setting up local test deployment..."
    
    # Build the application
    build_for_test
    
    # Start servers
    print_status "Starting test servers..."
    
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
    
    print_success "Local test deployment started!"
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
    echo "  -s, --setup              Setup test environment only"
    echo "  -b, --build              Build for testing only"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Platforms:"
    echo "  local                    Deploy locally for testing"
    echo "  vercel                   Deploy to Vercel (recommended)"
    echo ""
    echo "Examples:"
    echo "  $0                        # Deploy locally for testing"
    echo "  $0 -p vercel             # Deploy to Vercel"
    echo "  $0 -s                    # Setup test environment only"
    echo "  $0 -b                    # Build for testing only"
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
    
    print_status "Starting test deployment..."
    print_status "Platform: $platform"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup test environment
    setup_test_env
    
    if [ "$setup_only" = true ]; then
        print_success "Test environment setup completed!"
        exit 0
    fi
    
    # Build for testing
    build_for_test
    
    if [ "$build_only" = true ]; then
        print_success "Build for testing completed!"
        exit 0
    fi
    
    # Deploy based on platform
    case $platform in
        "vercel")
            deploy_vercel_test
            ;;
        "local")
            deploy_local_test
            ;;
    esac
    
    print_success "Test deployment completed successfully!"
}

# Run main function with all arguments
main "$@"
