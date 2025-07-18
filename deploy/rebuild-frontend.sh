#!/bin/bash

# Rebuild Frontend Script for Selfky
# This script rebuilds the React frontend with latest changes

echo "🔨 Rebuilding Selfky frontend..."

# Set variables
APP_DIR="/home/ubuntu/Selfky"
WEB_DIR="/var/www/selfky"

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
cd client && npm install && cd ..

# Build React app
echo "🔨 Building React application..."
cd client
npm run build
cd ..

# Copy build files to web directory with proper permissions
echo "📁 Updating web directory..."
sudo cp -r client/build/* $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR

echo "✅ Frontend rebuild complete!"
echo "🌐 Your updated frontend is now live at https://selfky.com" 