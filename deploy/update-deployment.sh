#!/bin/bash

# Update Deployment Script for Selfky
# Run this when you want to deploy updates

echo "🚀 Starting deployment update..."

# Navigate to project directory
cd /home/ubuntu/Selfky

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

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

# Restart backend
echo "🔄 Restarting backend..."
cd ../server
pm2 restart selfky-backend

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment update completed!"
echo "🌐 Your application is now updated and running!" 