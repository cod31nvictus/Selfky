#!/bin/bash

# Robust Selfky Deployment Script
# Handles all common deployment issues and provides comprehensive error handling
# Usage: Run this script on your EC2 instance to deploy the latest code from GitHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to kill hanging processes
kill_hanging_processes() {
    log "Checking for hanging processes..."
    
    # Kill any hanging npm/node processes
    if pgrep -f "npm install" > /dev/null; then
        warn "Found hanging npm install process, killing..."
        sudo pkill -9 -f "npm install" || true
    fi
    
    if pgrep -f "node.*build" > /dev/null; then
        warn "Found hanging node build process, killing..."
        sudo pkill -9 -f "node.*build" || true
    fi
    
    # Kill any other hanging processes
    sudo pkill -9 -f npm || true
    sudo pkill -9 -f node || true
    
    sleep 2
}

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check available memory
    available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7*100/$2}')
    if [ "$available_mem" -lt 20 ]; then
        warn "Low memory available (${available_mem}%). Consider freeing up memory."
    fi
    
    # Check disk space
    disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 80 ]; then
        warn "High disk usage (${disk_usage}%). Consider cleaning up."
    fi
}

# Function to backup current build
backup_current_build() {
    log "Creating backup of current build..."
    
    if [ -d "/home/ubuntu/Selfky/client/build" ]; then
        cp -r /home/ubuntu/Selfky/client/build /home/ubuntu/Selfky/client/build.backup.$(date +%Y%m%d_%H%M%S) || true
        log "Backup created"
    fi
}

# Function to install frontend dependencies with multiple fallback strategies
install_frontend_dependencies() {
    log "Installing frontend dependencies..."
    cd /home/ubuntu/Selfky/client
    
    # Clear npm cache
    npm cache clean --force
    
    # Set npm configuration
    export NPM_CONFIG_TIMEOUT=300000  # 5 minutes timeout
    export NPM_CONFIG_FUND=false
    export NPM_CONFIG_AUDIT=false
    
    # Strategy 1: Try with legacy peer deps
    log "Attempting npm install with legacy peer deps..."
    if timeout 600 npm install --no-audit --no-fund --legacy-peer-deps --silent; then
        log "Frontend dependencies installed successfully"
        return 0
    fi
    
    # Strategy 2: Try with force
    warn "First attempt failed, trying with force..."
    if timeout 600 npm install --no-audit --no-fund --legacy-peer-deps --force --silent; then
        log "Frontend dependencies installed successfully with force"
        return 0
    fi
    
    # Strategy 3: Try with yarn
    warn "npm failed, trying with yarn..."
    if command -v yarn > /dev/null 2>&1; then
        if timeout 600 yarn install --silent; then
            log "Frontend dependencies installed successfully with yarn"
            return 0
        fi
    else
        log "Installing yarn..."
        npm install -g yarn
        if timeout 600 yarn install --silent; then
            log "Frontend dependencies installed successfully with yarn"
            return 0
        fi
    fi
    
    # Strategy 4: Try with pnpm
    warn "yarn failed, trying with pnpm..."
    if command -v pnpm > /dev/null 2>&1; then
        if timeout 600 pnpm install --silent; then
            log "Frontend dependencies installed successfully with pnpm"
            return 0
        fi
    else
        log "Installing pnpm..."
        npm install -g pnpm
        if timeout 600 pnpm install --silent; then
            log "Frontend dependencies installed successfully with pnpm"
            return 0
        fi
    fi
    
    error "All dependency installation strategies failed"
    return 1
}

# Function to fix common dependency issues
fix_dependency_issues() {
    log "Checking for common dependency issues..."
    cd /home/ubuntu/Selfky/client
    
    # Fix ajv version conflict (common issue we encountered)
    if [ -f "package.json" ]; then
        log "Installing compatible ajv version..."
        npm install ajv@^8.0.0 --save-dev --no-audit --no-fund --silent || true
    fi
}

# Function to build frontend with retry logic
build_frontend() {
    log "Building frontend..."
    cd /home/ubuntu/Selfky/client
    
    # Fix dependency issues before building
    fix_dependency_issues
    
    # Try building with timeout
    if timeout 300 npm run build; then
        log "Frontend built successfully"
        return 0
    else
        warn "Build failed, trying with legacy peer deps..."
        npm install --legacy-peer-deps --silent
        if timeout 300 npm run build; then
            log "Frontend built successfully with legacy peer deps"
            return 0
        else
            error "Frontend build failed"
            return 1
        fi
    fi
}

# Function to restart backend
restart_backend() {
    log "Restarting backend server..."
    cd /home/ubuntu/Selfky/server
    
    # Check if PM2 is installed
    if ! command -v pm2 > /dev/null 2>&1; then
        log "Installing PM2..."
        npm install -g pm2
    fi
    
    # Restart or start backend
    if pm2 list | grep -q "selfky-backend"; then
        pm2 restart selfky-backend --update-env
    else
        pm2 start server.js --name selfky-backend
    fi
    
    # Wait for backend to start
    sleep 5
    
    # Check if backend is running
    if pm2 list | grep -q "selfky-backend.*online"; then
        log "Backend restarted successfully"
    else
        error "Backend failed to start"
        pm2 logs selfky-backend --lines 10
        return 1
    fi
}

# Function to reload Nginx
reload_nginx() {
    log "Reloading Nginx..."
    
    # Reload systemd daemon first
    sudo systemctl daemon-reload
    
    # Check Nginx configuration
    if sudo nginx -t; then
        sudo systemctl reload nginx
        log "Nginx reloaded successfully"
    else
        error "Nginx configuration test failed"
        sudo nginx -t
        return 1
    fi
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if backend is responding
    if curl -s -f http://localhost:5000/api/health > /dev/null; then
        log "Backend API is responding"
    else
        error "Backend API is not responding"
        return 1
    fi
    
    # Check if frontend is accessible
    if curl -s -f http://localhost > /dev/null; then
        log "Frontend is accessible"
    else
        error "Frontend is not accessible"
        return 1
    fi
    
    log "Deployment verification completed successfully"
}

# Main deployment function
main() {
    log "🚀 Starting robust deployment for Selfky..."
    
    # Check system resources
    check_system_resources
    
    # Kill any hanging processes
    kill_hanging_processes
    
    # Navigate to project directory
    cd /home/ubuntu/Selfky
    
    # Pull latest changes
    log "📥 Pulling latest changes from GitHub..."
    git pull origin main
    
    log "🔎 Last commit deployed:"
    git log -1 --oneline
    
    # Backup current build
    backup_current_build
    
    # Install backend dependencies
    log "📦 Installing backend dependencies..."
    cd server
    npm install --no-audit --no-fund --silent
    
    # Install frontend dependencies
    if ! install_frontend_dependencies; then
        error "Failed to install frontend dependencies"
        exit 1
    fi
    
    # Build frontend
    if ! build_frontend; then
        error "Failed to build frontend"
        exit 1
    fi
    
    # Restart backend
    if ! restart_backend; then
        error "Failed to restart backend"
        exit 1
    fi
    
    # Reload Nginx
    if ! reload_nginx; then
        error "Failed to reload Nginx"
        exit 1
    fi
    
    # Verify deployment
    if ! verify_deployment; then
        error "Deployment verification failed"
        exit 1
    fi
    
    log "✅ Robust deployment completed successfully!"
    log "🌐 Your application is now updated and running!"
    
    # Show final status
    log "📊 Final Status:"
    pm2 status
    sudo systemctl status nginx --no-pager -l
}

# Error handling
trap 'error "Deployment failed at line $LINENO. Check the logs above for details."' ERR

# Run main function
main "$@" 