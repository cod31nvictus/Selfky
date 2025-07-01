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
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../client
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart backend (using pm2, process name: selfky-backend)
echo "🔄 Restarting backend server..."
cd ../server
pm2 restart selfky-backend || pm2 start server.js --name selfky-backend

# Reload Nginx for static/frontend updates
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment update completed!"
echo "🌐 Your application is now updated and running!" 