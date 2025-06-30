#!/bin/bash

# Selfky Deployment Script for AWS EC2 with selfky.com domain
# Run this script after setting up the EC2 instance

echo "🚀 Deploying Selfky to AWS EC2 with selfky.com domain..."

# Set variables
APP_DIR="/var/www/selfky"
REPO_URL="https://github.com/cod31nvictus/Selfky.git"

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown ubuntu:ubuntu $APP_DIR

# Clone repository
echo "📥 Cloning repository..."
cd $APP_DIR
git clone $REPO_URL .

# Install dependencies
echo "📦 Installing dependencies..."
npm run install-all

# Create environment file
echo "🔧 Setting up environment variables..."
cat > server/.env << EOF
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret_key_here
MONGO_URI=mongodb://localhost:27017/selfky
PORT=5000
EOF

# Build React app
echo "🔨 Building React application..."
cd client
npm run build
cd ..

# Set up PM2 ecosystem
echo "⚙️ Setting up PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'selfky-server',
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
sudo ln -s /etc/nginx/sites-available/selfky /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo ""
echo "🌐 Next steps for domain setup:"
echo "1. Go to GoDaddy DNS settings for selfky.com"
echo "2. Add A record: @ → your-ec2-public-ip"
echo "3. Add A record: www → your-ec2-public-ip"
echo "4. Wait 5-10 minutes for DNS propagation"
echo "5. Run SSL setup: ./deploy/ssl-setup.sh"
echo ""
echo "📝 Your application is available at:"
echo "   HTTP: http://selfky.com (temporary)"
echo "   HTTPS: https://selfky.com (after SSL setup)"
echo ""
echo "📝 To check application status: pm2 status"
echo "📝 To view logs: pm2 logs selfky-server" 