#!/bin/bash

# Spending Finance Tracker Setup Script
# This script sets up the development environment with enhanced category management and import functionality

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

# Function to setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Create client environment file
    if [ ! -f client/.env ]; then
        print_status "Creating client environment file..."
        cp client/env.example client/.env
        print_warning "Created client/.env. Please update with your configuration."
    fi
    
    # Create server environment file
    if [ ! -f server/.env ]; then
        print_status "Creating server environment file..."
        cp server/env.example server/.env
        print_warning "Created server/.env. Please update with your configuration."
    fi
    
    print_success "Environment files created"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    print_status "Installing root dependencies..."
    npm install
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    cd server
    
    # Initialize database
    print_status "Initializing database..."
    npm run migrate
    
    cd ..
    
    print_success "Database setup completed"
}

# Function to start development servers
start_development() {
    print_status "Starting development servers..."
    
    # Start server in background
    cd server
    print_status "Starting server on port 3001..."
    npm run dev &
    SERVER_PID=$!
    cd ..
    
    # Wait a moment for server to start
    sleep 3
    
    # Start client
    cd client
    print_status "Starting client on port 5173..."
    npm run dev &
    CLIENT_PID=$!
    cd ..
    
    print_success "Development servers started!"
    print_status "Server: http://localhost:3001"
    print_status "Client: http://localhost:5173"
    print_status "Press Ctrl+C to stop all servers"
    
    # Wait for user to stop
    wait
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env-only           Setup environment files only"
    echo "  -d, --deps-only          Install dependencies only"
    echo "  -b, --db-only            Setup database only"
    echo "  -r, --run                Start development servers after setup"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                        # Complete setup"
    echo "  $0 -e                     # Setup environment files only"
    echo "  $0 -d                     # Install dependencies only"
    echo "  $0 -b                     # Setup database only"
    echo "  $0 -r                     # Complete setup and start servers"
}

# Main setup function
main() {
    local env_only=false
    local deps_only=false
    local db_only=false
    local run_servers=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--env-only)
                env_only=true
                shift
                ;;
            -d|--deps-only)
                deps_only=true
                shift
                ;;
            -b|--db-only)
                db_only=true
                shift
                ;;
            -r|--run)
                run_servers=true
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
    
    print_status "Starting setup..."
    
    # Check prerequisites
    check_prerequisites
    
    # Setup based on options
    if [ "$env_only" = true ]; then
        setup_environment
        print_success "Environment setup completed!"
        exit 0
    fi
    
    if [ "$deps_only" = true ]; then
        install_dependencies
        print_success "Dependencies installation completed!"
        exit 0
    fi
    
    if [ "$db_only" = true ]; then
        setup_database
        print_success "Database setup completed!"
        exit 0
    fi
    
    # Full setup
    setup_environment
    install_dependencies
    setup_database
    
    print_success "Setup completed successfully!"
    
    if [ "$run_servers" = true ]; then
        start_development
    else
        print_status "To start development servers, run: npm run dev"
    fi
}

# Run main function with all arguments
main "$@"
