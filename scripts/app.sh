#!/bin/bash

# Spending Finance Tracker Application Management Script
# This script manages the application lifecycle (start, stop, restart)

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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# PID file locations
SERVER_PID_FILE="$PROJECT_ROOT/server/.server.pid"
CLIENT_PID_FILE="$PROJECT_ROOT/client/.client.pid"

# Log file locations
LOG_DIR="$PROJECT_ROOT/logs"
SERVER_LOG="$LOG_DIR/server.log"
CLIENT_LOG="$LOG_DIR/client.log"

# Function to create log directory
setup_logs() {
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        print_status "Created logs directory: $LOG_DIR"
    fi
}

# Function to detect environment
detect_environment() {
    local env_file="$PROJECT_ROOT/server/.env"
    
    if [ ! -f "$env_file" ]; then
        echo "development"
        return
    fi
    
    local node_env=$(grep "^NODE_ENV=" "$env_file" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
    
    if [ -n "$node_env" ]; then
        echo "$node_env"
    else
        echo "development"
    fi
}

# Function to check if process is running
is_running() {
    local pid_file="$1"
    
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    local pid=$(cat "$pid_file")
    
    if [ -z "$pid" ]; then
        return 1
    fi
    
    # Check if process is actually running
    if ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        # Clean up stale PID file
        rm -f "$pid_file"
        return 1
    fi
}

# Function to start the server
start_server() {
    print_status "Starting server..."
    
    if is_running "$SERVER_PID_FILE"; then
        local pid=$(cat "$SERVER_PID_FILE")
        print_warning "Server is already running (PID: $pid)"
        return 0
    fi
    
    cd "$PROJECT_ROOT/server"
    
    # Start server in background and capture PID
    nohup npm start > "$SERVER_LOG" 2>&1 &
    local server_pid=$!
    
    # Save PID to file
    echo "$server_pid" > "$SERVER_PID_FILE"
    
    # Wait a moment and check if it's still running
    sleep 2
    
    if is_running "$SERVER_PID_FILE"; then
        print_success "Server started successfully (PID: $server_pid)"
        print_status "Server log: $SERVER_LOG"
        return 0
    else
        print_error "Server failed to start. Check logs: $SERVER_LOG"
        return 1
    fi
}

# Function to start the client
start_client() {
    print_status "Starting client..."
    
    if is_running "$CLIENT_PID_FILE"; then
        local pid=$(cat "$CLIENT_PID_FILE")
        print_warning "Client is already running (PID: $pid)"
        return 0
    fi
    
    cd "$PROJECT_ROOT/client"
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        print_error "Client build not found. Run './scripts/deploy.sh -b' first."
        return 1
    fi
    
    # Start client in background and capture PID (using serve instead of vite preview)
    print_status "Starting client with 'serve' package (no host checking)..."
    nohup npm run serve-simple > "$CLIENT_LOG" 2>&1 &
    local client_pid=$!
    
    # Save PID to file
    echo "$client_pid" > "$CLIENT_PID_FILE"
    
    # Wait a moment and check if it's still running
    sleep 2
    
    if is_running "$CLIENT_PID_FILE"; then
        print_success "Client started successfully (PID: $client_pid)"
        print_status "Client log: $CLIENT_LOG"
        return 0
    else
        print_error "Client failed to start. Check logs: $CLIENT_LOG"
        return 1
    fi
}

# Function to stop the server
stop_server() {
    print_status "Stopping server..."
    
    if ! is_running "$SERVER_PID_FILE"; then
        print_warning "Server is not running"
        return 0
    fi
    
    local pid=$(cat "$SERVER_PID_FILE")
    
    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && is_running "$SERVER_PID_FILE"; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if is_running "$SERVER_PID_FILE"; then
        print_warning "Server did not stop gracefully, forcing shutdown..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Clean up PID file
    rm -f "$SERVER_PID_FILE"
    
    print_success "Server stopped"
}

# Function to stop the client
stop_client() {
    print_status "Stopping client..."
    
    if ! is_running "$CLIENT_PID_FILE"; then
        print_warning "Client is not running"
        return 0
    fi
    
    local pid=$(cat "$CLIENT_PID_FILE")
    
    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt 10 ] && is_running "$CLIENT_PID_FILE"; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if is_running "$CLIENT_PID_FILE"; then
        print_warning "Client did not stop gracefully, forcing shutdown..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Clean up PID file
    rm -f "$CLIENT_PID_FILE"
    
    print_success "Client stopped"
}

# Function to show status
show_status() {
    local environment=$(detect_environment)
    
    print_status "Application Status"
    print_status "Environment: $environment"
    echo ""
    
    # Server status
    if is_running "$SERVER_PID_FILE"; then
        local server_pid=$(cat "$SERVER_PID_FILE")
        print_success "Server: Running (PID: $server_pid)"
        print_status "  Log: $SERVER_LOG"
        print_status "  URL: http://localhost:3001"
    else
        print_warning "Server: Not running"
    fi
    
    # Client status
    if is_running "$CLIENT_PID_FILE"; then
        local client_pid=$(cat "$CLIENT_PID_FILE")
        print_success "Client: Running (PID: $client_pid)"
        print_status "  Log: $CLIENT_LOG"
        print_status "  URL: http://localhost:4173"
    else
        print_warning "Client: Not running"
    fi
    
    echo ""
    
    # Show recent logs if available
    if [ -f "$SERVER_LOG" ]; then
        print_status "Recent server log (last 5 lines):"
        tail -5 "$SERVER_LOG" 2>/dev/null || echo "  No recent logs"
    fi
    
    if [ -f "$CLIENT_LOG" ]; then
        print_status "Recent client log (last 5 lines):"
        tail -5 "$CLIENT_LOG" 2>/dev/null || echo "  No recent logs"
    fi
}

# Function to show logs
show_logs() {
    local component="$1"
    local lines="${2:-50}"
    
    case "$component" in
        "server")
            if [ -f "$SERVER_LOG" ]; then
                print_status "Server log (last $lines lines):"
                tail -"$lines" "$SERVER_LOG"
            else
                print_warning "No server log found"
            fi
            ;;
        "client")
            if [ -f "$CLIENT_LOG" ]; then
                print_status "Client log (last $lines lines):"
                tail -"$lines" "$CLIENT_LOG"
            else
                print_warning "No client log found"
            fi
            ;;
        "all"|"")
            show_logs "server" "$lines"
            echo ""
            show_logs "client" "$lines"
            ;;
        *)
            print_error "Invalid component: $component. Use 'server', 'client', or 'all'"
            exit 1
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo "Usage: $0 COMMAND [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [server|client|all]    Start application components [default: all]"
    echo "  stop [server|client|all]     Stop application components [default: all]"
    echo "  restart [server|client|all]  Restart application components [default: all]"
    echo "  status                       Show application status"
    echo "  logs [server|client|all] [lines]  Show logs [default: all, 50 lines]"
    echo "  help                         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                     # Start both server and client"
    echo "  $0 start server              # Start only server"
    echo "  $0 stop                      # Stop both server and client"
    echo "  $0 restart client            # Restart only client"
    echo "  $0 status                    # Show status of both components"
    echo "  $0 logs server 100           # Show last 100 lines of server log"
}

# Main function
main() {
    local command="$1"
    local component="${2:-all}"
    local extra_arg="$3"
    
    # Setup logs directory
    setup_logs
    
    case "$command" in
        "start")
            case "$component" in
                "server")
                    start_server
                    ;;
                "client")
                    start_client
                    ;;
                "all"|"")
                    start_server
                    if [ $? -eq 0 ]; then
                        start_client
                    fi
                    ;;
                *)
                    print_error "Invalid component: $component. Use 'server', 'client', or 'all'"
                    exit 1
                    ;;
            esac
            ;;
        "stop")
            case "$component" in
                "server")
                    stop_server
                    ;;
                "client")
                    stop_client
                    ;;
                "all"|"")
                    stop_client
                    stop_server
                    ;;
                *)
                    print_error "Invalid component: $component. Use 'server', 'client', or 'all'"
                    exit 1
                    ;;
            esac
            ;;
        "restart")
            case "$component" in
                "server")
                    stop_server
                    start_server
                    ;;
                "client")
                    stop_client
                    start_client
                    ;;
                "all"|"")
                    stop_client
                    stop_server
                    start_server
                    if [ $? -eq 0 ]; then
                        start_client
                    fi
                    ;;
                *)
                    print_error "Invalid component: $component. Use 'server', 'client', or 'all'"
                    exit 1
                    ;;
            esac
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$component" "$extra_arg"
            ;;
        "help"|"-h"|"--help"|"")
            show_usage
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
