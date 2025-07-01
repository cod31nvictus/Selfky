#!/bin/bash

# Simple Selfky Deployment Script
# This script avoids npm install issues by only building if needed

set -e

echo "🚀 Starting simple deployment for Selfky..."

# Navigate to project directory
cd /home/ubuntu/Selfky

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "🔎 Last commit deployed:"
git log -1 --oneline

# Check if backend node_modules exists, if not install
echo "📦 Checking backend dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --no-audit --no-fund --silent
else
    echo "Backend dependencies already installed"
fi

# Check if frontend node_modules exists, if not install
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
sudo systemctl reload nginx

echo "✅ Simple deployment completed!"
echo "🌐 Your application is now updated and running!" 