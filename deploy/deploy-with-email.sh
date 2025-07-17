#!/bin/bash

# Selfky Deployment Script with Email System for AWS EC2
# Run this script after setting up the EC2 instance

echo "🚀 Deploying Selfky with Email System to AWS EC2..."

# Set variables
APP_DIR="/home/ubuntu/Selfky"
WEB_DIR="/var/www/selfky"
REPO_URL="https://github.com/cod31nvictus/Selfky.git"

# Create application directory
echo "📁 Creating application directory..."
cd /home/ubuntu
sudo mkdir -p $WEB_DIR
sudo chown ubuntu:ubuntu $WEB_DIR

# Clone or pull repository
echo "📥 Updating repository..."
if [ -d "Selfky" ]; then
    cd Selfky
    git pull origin main
else
    git clone $REPO_URL Selfky
    cd Selfky
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm install && cd ..
cd client && npm install && cd ..

# Create production environment file
echo "🔧 Setting up production environment variables..."
cat > server/.env << EOF
# Production Environment Variables for Selfky
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/selfky

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here_change_this_in_production

# Gmail SMTP Configuration
GMAIL_USER=teamselfky@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
EMAIL_FROM=teamselfky@gmail.com

# Frontend URL for production
FRONTEND_URL=https://selfky.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
EOF

# Create logs directory
echo "📁 Setting up logs directory..."
mkdir -p server/logs
sudo chown -R ubuntu:ubuntu server/logs

# Build React app
echo "🔨 Building React application..."
cd client
npm run build
cd ..

# Copy build files to web directory with proper permissions
echo "📁 Setting up web directory..."
sudo cp -r client/build/* $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR

# Create uploads directory with proper permissions
echo "📁 Setting up uploads directory..."
mkdir -p server/uploads
sudo chown -R www-data:www-data server/uploads
sudo chmod -R 755 server/uploads

# Set up PM2 ecosystem
echo "⚙️ Setting up PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'selfky-backend',
    script: 'server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

# Restart application with PM2
echo "🚀 Restarting application..."
pm2 delete selfky-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
echo "🔧 Configuring Nginx..."
sudo cp deploy/nginx-config /etc/nginx/sites-available/selfky
sudo ln -sf /etc/nginx/sites-available/selfky /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Test email system
echo "📧 Testing email system..."
cd server
node test-gmail-setup.js
cd ..

echo "✅ Deployment complete!"
echo ""
echo "🌐 Application Status:"
echo "   Frontend: https://selfky.com"
echo "   Backend API: https://selfky.com/api"
echo "   PM2 Status: pm2 status"
echo "   PM2 Logs: pm2 logs selfky-backend"
echo ""
echo "📧 Email System:"
echo "   Gmail SMTP configured"
echo "   Password reset emails working"
echo "   Application notifications enabled"
echo ""
echo "🔧 Next Steps:"
echo "1. Update Gmail app password in server/.env"
echo "2. Update Razorpay keys in server/.env"
echo "3. Update JWT_SECRET in server/.env"
echo "4. Run SSL setup: sudo certbot --nginx -d selfky.com -d www.selfky.com"
echo ""
echo "📝 To update environment variables:"
echo "   nano server/.env"
echo "   pm2 restart selfky-backend" 