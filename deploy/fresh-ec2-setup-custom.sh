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

# Clone the repository (UPDATE THIS WITH YOUR GITHUB USERNAME)
echo "📥 Cloning Selfky repository..."
cd /home/ubuntu
git clone https://github.com/YOUR_GITHUB_USERNAME/Selfky.git
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

# Create environment file for backend
echo "🔧 Creating backend environment file..."
cd ../server
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/selfky
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
EOF

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Start backend with PM2
echo "🚀 Starting backend with PM2..."
pm2 start server.js --name "selfky-backend"

# Configure Nginx for IP-based access (UPDATE WITH YOUR DOMAIN WHEN READY)
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/selfky << EOF
server {
    listen 80;
    server_name 51.20.53.228;  # UPDATE THIS WITH YOUR DOMAIN WHEN READY

    # Frontend
    location / {
        root /home/ubuntu/Selfky/client/build;
        try_files \$uri \$uri/ /index.html;
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

# Enable the site
sudo ln -s /etc/nginx/sites-available/selfky /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Fresh EC2 setup completed!"
echo "🌐 Your application should be accessible at: http://51.20.53.228"
echo "📝 Next steps:"
echo "   1. Test the application at http://51.20.53.228"
echo "   2. Update JWT_SECRET in .env file for security"
echo "   3. Set up your domain DNS to point to 51.20.53.228"
echo "   4. Update Nginx config with your domain name"
echo "   5. Set up SSL certificate for HTTPS" 