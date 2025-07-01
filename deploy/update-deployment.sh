#!/bin/bash

# Selfky Deployment Update Script
# Supports: Admin panel, admit card, file uploads, payment, and all recent features
# Usage: Run this script on your EC2 instance to deploy the latest code from GitHub

set -e

echo "🚀 Starting deployment update for Selfky..."

# Navigate to project directory
cd /home/ubuntu/Selfky

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "🔎 Last commit deployed:"
git log -1 --oneline

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install --no-audit --no-fund --silent

# Install frontend dependencies with timeout and retry
echo "📦 Installing frontend dependencies..."
cd ../client

# Clear npm cache and set timeout
npm cache clean --force
export NPM_CONFIG_TIMEOUT=300000  # 5 minutes timeout

# Try npm install with different strategies
echo "Attempting npm install..."
if ! timeout 600 npm install --no-audit --no-fund --silent; then
    echo "First attempt failed, trying with legacy peer deps..."
    if ! timeout 600 npm install --no-audit --no-fund --legacy-peer-deps --silent; then
        echo "Second attempt failed, trying with force..."
        timeout 600 npm install --no-audit --no-fund --force --silent
    fi
fi

# Build frontend
echo "🔨 Building frontend..."
if ! timeout 300 npm run build; then
    echo "Build failed, trying with legacy peer deps..."
    npm install --legacy-peer-deps --silent
    timeout 300 npm run build
fi

# Restart backend (using pm2, process name: selfky-backend)
echo "🔄 Restarting backend server..."
cd ../server
pm2 restart selfky-backend || pm2 start server.js --name selfky-backend

# Reload Nginx for static/frontend updates
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment update completed!"
echo "🌐 Your application is now updated and running!" 