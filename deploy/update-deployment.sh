#!/bin/bash

# Selfky Deployment Update Script (Wrapper)
# This script now calls the robust deployment script for better reliability
# Usage: Run this script on your EC2 instance to deploy the latest code from GitHub

echo "🔄 Using robust deployment script for better reliability..."
echo "📋 This script will handle all common deployment issues automatically"

# Check if robust deployment script exists
if [ -f "deploy/robust-deployment.sh" ]; then
    chmod +x deploy/robust-deployment.sh
    ./deploy/robust-deployment.sh
else
    echo "❌ Robust deployment script not found. Please pull latest changes first."
    echo "💡 Run: git pull origin main"
    exit 1
fi 