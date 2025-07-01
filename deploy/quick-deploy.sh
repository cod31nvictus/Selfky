#!/bin/bash

# Quick Selfky Deployment Script
# For emergency deployments - skips dependency installation if node_modules exist
# Usage: Run this script when you need a fast deployment

set -e

echo "⚡ Quick deployment for Selfky..."

# Navigate to project directory
cd /home/ubuntu/Selfky

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "🔎 Last commit deployed:"
git log -1 --oneline

# Install backend dependencies only if needed
echo "📦 Checking backend dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --no-audit --no-fund --silent
else
    echo "Backend dependencies already installed"
fi

# Install frontend dependencies only if needed
echo "📦 Checking frontend dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --no-audit --no-fund --legacy-peer-deps --silent
else
    echo "Frontend dependencies already installed"
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart backend
echo "🔄 Restarting backend server..."
cd ../server
pm2 restart selfky-backend || pm2 start server.js --name selfky-backend

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl daemon-reload
sudo systemctl reload nginx

echo "✅ Quick deployment completed!"
echo "🌐 Your application is now updated and running!" 