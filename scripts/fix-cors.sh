#!/bin/bash

# Quick CORS Fix Script for Production Deployment
# This script fixes CORS issues for local network deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_status "Fixing CORS configuration for production deployment..."

# Check if server/.env exists
if [ ! -f "$PROJECT_ROOT/server/.env" ]; then
    print_error "server/.env file not found. Please run deploy.sh first."
    exit 1
fi

# Get local IP address (macOS compatible)
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    print_error "Could not detect local IP address. Please manually add your IP to ALLOWED_ORIGINS in server/.env"
    exit 1
fi

print_status "Detected local IP: $LOCAL_IP"

# Update CORS origins
CORS_ORIGINS="http://localhost:5173,http://localhost:4173,http://$LOCAL_IP:4173,http://$LOCAL_IP:5173,http://192.168.20.22:4173"

# Update the .env file
cd "$PROJECT_ROOT"
cp server/.env server/.env.backup
sed -i.bak "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$CORS_ORIGINS|" server/.env
sed -i.bak "s|NODE_ENV=.*|NODE_ENV=production|" server/.env

print_success "Updated CORS configuration:"
print_status "ALLOWED_ORIGINS=$CORS_ORIGINS"
print_status "NODE_ENV=production"

# Show current .env CORS settings
print_status "Current server/.env CORS settings:"
grep "ALLOWED_ORIGINS\|NODE_ENV" server/.env

print_warning "Please restart your server for changes to take effect:"
print_status "cd server && npm start"

print_success "CORS configuration updated successfully!"
print_status "Your app should now be accessible from: http://$LOCAL_IP:4173"
