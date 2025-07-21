#!/bin/bash

# Selfky Deployment Script for AWS EC2 with selfky.com domain
# Do not commit real credentials. Use .env files and .gitignore.
# Run this script after setting up the EC2 instance

echo "🚀 Deploying Selfky to AWS EC2 with selfky.com domain..."

# Set variables
APP_DIR="/home/ubuntu/Selfky"
WEB_DIR="/var/www/selfky"
REPO_URL="https://github.com/cod31nvictus/Selfky.git"

# Create application directory
echo "📁 Creating application directory..."
cd /home/ubuntu
sudo mkdir -p $WEB_DIR
sudo chown ubuntu:ubuntu $WEB_DIR

# Clone repository
echo "📥 Cloning repository..."
git clone $REPO_URL Selfky
cd Selfky

# Install dependencies
echo "📦 Installing dependencies..."
cd server && npm install && cd ..
cd client && npm install && cd ..

# Create environment file
echo "🔧 Setting up environment variables..."
cat > server/.env << EOF
NODE_ENV=production
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail_address@gmail.com
FRONTEND_URL=https://yourdomain.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
EOF

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
    }
  }]
};
EOF

# Start application with PM2
echo "🚀 Starting application..."
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

echo "✅ Deployment complete!"
echo ""
echo "🌐 Next steps for domain setup:"
echo "1. Go to GoDaddy DNS settings for selfky.com"
echo "2. Add A record: @ → your-ec2-public-ip"
echo "3. Add A record: www → your-ec2-public-ip"
echo "4. Wait 5-10 minutes for DNS propagation"
echo "5. Run SSL setup: sudo certbot --nginx -d selfky.com -d www.selfky.com"
echo ""
echo "📝 Your application is available at:"
echo "   HTTP: http://selfky.com (temporary)"
echo "   HTTPS: https://selfky.com (after SSL setup)"
echo ""
echo "📝 To check application status: pm2 status"
echo "📝 To view logs: pm2 logs selfky-backend" 