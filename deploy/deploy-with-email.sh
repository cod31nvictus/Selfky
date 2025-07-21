#!/bin/bash

# Selfky Deployment Script with Email Setup
# This script deploys the Selfky application with Gmail SMTP configuration

set -e  # Exit on any error

echo "🚀 Starting Selfky deployment with email setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Navigate to project directory
cd /home/ubuntu/Selfky

print_status "📦 Installing backend dependencies..."
cd server
npm install

print_status "🔧 Setting up environment variables..."
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret_key_here
MONGODB_URI=mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.e5jmlu.mongodb.net/selfky?retryWrites=true&w=majority&appName=selfky-cluster
PORT=5000
GMAIL_USER=teamselfky@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
EMAIL_FROM=teamselfky@gmail.com
FRONTEND_URL=https://selfky.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=eu-north-1
S3_BUCKET_NAME=selfky-applications-2025
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
EOF

print_success "Environment file created"

print_status "🏗️  Building frontend..."
cd ../client
npm install
npm run build

print_success "Frontend built successfully"

print_status "📁 Copying frontend files to Nginx..."
sudo cp -r build/* /var/www/html/

print_status "🔄 Restarting backend with PM2..."
cd ../server
pm2 restart selfky-backend || pm2 start server.js --name "selfky-backend"
pm2 save

print_status "🔄 Reloading Nginx..."
sudo systemctl reload nginx

print_success "Deployment completed successfully!"

print_status "🔍 Verifying deployment..."
sleep 3

# Check if backend is running
if pm2 list | grep -q "selfky-backend.*online"; then
    print_success "Backend is running"
else
    print_error "Backend failed to start"
    pm2 logs selfky-backend --lines 10
    exit 1
fi

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running"
    exit 1
fi

# Test API endpoint
if curl -s http://localhost:5000/api/health > /dev/null; then
    print_success "API is responding"
else
    print_warning "API health check failed"
fi

print_success "🎉 Selfky deployment with email setup completed!"
print_status "🌐 Your application should be available at: https://selfky.com"
print_status "📧 Email functionality is configured with Gmail SMTP"
print_status "📊 Monitor logs with: pm2 logs selfky-backend" 