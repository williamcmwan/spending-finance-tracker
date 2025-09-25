#!/bin/bash

# Simple Finance Tracker Management Script
# Optimized for Cloudflare proxy setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to deploy and start
deploy_and_start() {
    print_info "Deploying and starting Finance Tracker..."
    
    # Stop any running services
    ./scripts/app.sh stop 2>/dev/null || true
    
    # Kill any processes on port 4173
    lsof -ti:4173 | xargs -r kill -9 2>/dev/null || true
    
    # Ensure dependencies are installed
    print_info "Installing dependencies..."
    cd client && npm install && cd ..
    cd server && npm install && cd ..
    
    # Deploy
    ./scripts/deploy.sh -e production
    
    # Start services
    ./scripts/app.sh start
    
    print_success "Deployment complete!"
    print_info "Internal access: http://192.168.20.22:4173"
    print_info "Cloudflare access: https://finance.shopassist.dpdns.org"
}

# Function to restart
restart() {
    print_info "Restarting Finance Tracker..."
    
    ./scripts/app.sh stop
    sudo lsof -ti:4173 | xargs -r sudo kill -9 2>/dev/null || true
    sleep 2
    ./scripts/app.sh start
    
    print_success "Restart complete!"
}

# Function to stop
stop() {
    print_info "Stopping Finance Tracker..."
    
    ./scripts/app.sh stop
    sudo lsof -ti:4173 | xargs -r sudo kill -9 2>/dev/null || true
    
    print_success "Stopped successfully!"
}

# Function to show status
status() {
    ./scripts/app.sh status
    
    print_info "Testing connectivity..."
    
    # Test internal access
    if curl -s http://192.168.20.22:4173 > /dev/null; then
        print_success "Internal access: ✅ http://192.168.20.22:4173"
    else
        print_error "Internal access: ❌ http://192.168.20.22:4173"
    fi
    
    # Test Cloudflare access
    if curl -s https://finance.shopassist.dpdns.org > /dev/null; then
        print_success "Cloudflare access: ✅ https://finance.shopassist.dpdns.org"
    else
        print_error "Cloudflare access: ❌ https://finance.shopassist.dpdns.org"
    fi
}

# Main menu
case "${1:-}" in
    "deploy")
        deploy_and_start
        ;;
    "restart")
        restart
        ;;
    "stop")
        stop
        ;;
    "status")
        status
        ;;
    *)
        echo "Usage: $0 {deploy|restart|stop|status}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy and start the application"
        echo "  restart - Restart the application"
        echo "  stop    - Stop the application"
        echo "  status  - Show application status and test connectivity"
        echo ""
        echo "Access URLs:"
        echo "  Internal:   http://192.168.20.22:4173"
        echo "  Cloudflare: https://finance.shopassist.dpdns.org"
        exit 1
        ;;
esac
