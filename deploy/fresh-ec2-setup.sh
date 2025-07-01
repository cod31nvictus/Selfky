#!/bin/bash

# Fresh EC2 Setup Script for Selfky
# Run this on a new Ubuntu 22.04 EC2 instance

echo "🚀 Starting fresh EC2 setup for Selfky..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install nginx -y

# Install MongoDB
echo "📦 Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
echo "🔧 Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Git
echo "📦 Installing Git..."
sudo apt install git -y

# Clone the repository
echo "📥 Cloning Selfky repository..."
cd /home/ubuntu
git clone https://github.com/cod31nvictus/Selfky.git
cd Selfky

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

# Create proper web directory and copy files
echo "📁 Setting up web directory..."
sudo mkdir -p /var/www/selfky
sudo cp -r build/* /var/www/selfky/
sudo chown -R www-data:www-data /var/www/selfky

# Create environment file for backend
echo "🔧 Creating backend environment file..."
cd ../server
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/selfky
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
EOF

# Create uploads directory with proper permissions
echo "📁 Creating uploads directory..."
mkdir -p uploads
sudo chown -R www-data:www-data uploads
sudo chmod -R 755 uploads

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start server.js --name "selfky-backend"

# Configure Nginx with proper paths and SSL support
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/selfky << EOF
server {
    listen 80;
    listen 443 ssl;
    server_name selfky.com www.selfky.com;

    # SSL configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/selfky.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/selfky.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/selfky;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # File uploads
    location /uploads {
        alias /home/ubuntu/Selfky/server/uploads;
    }
}
EOF

# Enable the site and remove default
sudo ln -s /etc/nginx/sites-available/selfky /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Fresh EC2 setup completed!"
echo "🌐 Your application should be accessible at: http://your-ec2-ip"
echo "📝 Next steps:"
echo "   1. Update the Nginx config with your actual domain"
echo "   2. Set up SSL certificate with Certbot"
echo "   3. Update JWT_SECRET in .env file"
echo "   4. Configure your domain DNS to point to this EC2 instance"
echo "   5. Run: sudo certbot --nginx -d selfky.com -d www.selfky.com" 