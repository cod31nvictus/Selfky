# Selfky Deployment Guide

> **Do not commit real credentials. Use .env files and .gitignore.**

This guide covers deploying the Selfky application to production using AWS EC2, MongoDB Atlas, and AWS S3.

## Architecture Overview

- **Frontend**: React.js served via Nginx
- **Backend**: Node.js/Express.js with PM2
- **Database**: MongoDB Atlas (cloud-hosted)
- **File Storage**: AWS S3
- **Web Server**: Nginx with SSL

## Prerequisites

1. **AWS EC2 Instance** (Ubuntu 22.04 LTS)
2. **MongoDB Atlas Cluster**
3. **AWS S3 Bucket**
4. **Domain Name** (optional but recommended)

## Quick Deployment

### 1. Initial Server Setup

```bash
# Run the fresh setup script
bash deploy/fresh-ec2-setup.sh
```

### 2. Environment Configuration

Update the server's `.env` file:

```bash
# Database Configuration - MongoDB Atlas
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Gmail SMTP Configuration
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail_address@gmail.com

# Frontend URL for production
FRONTEND_URL=https://yourdomain.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
```

### 3. Deploy Application

```bash
# Run the deployment script
bash deploy/deploy.sh
```

## Manual Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### 2. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/cod31nvictus/Selfky.git
cd Selfky
```

### 3. Backend Setup

```bash
cd server
npm install

# Create environment file
cat > .env << EOF
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

# Start backend with PM2
pm2 start server.js --name "selfky-backend"
pm2 save
pm2 startup
```

### 4. Frontend Setup

```bash
cd ../client
npm install
npm run build

# Copy build to Nginx
sudo cp -r build/* /var/www/html/
```

### 5. Nginx Configuration

```bash
# Create Nginx config
sudo tee /etc/nginx/sites-available/selfky << EOF
server {
    listen 80;
    server_name selfky.com www.selfky.com;

    root /var/www/html;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
``` 