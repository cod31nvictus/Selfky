# Selfky Deployment Guide

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
MONGODB_URI=mongodb+srv://selfky-user:ZnAD0kF6FxvGB8oT@selfky-cluster.e5jmlu.mongodb.net/selfky?retryWrites=true&w=majority&appName=selfky-cluster

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here

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

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=eu-north-1
S3_BUCKET_NAME=selfky-applications-2025

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

    # API proxy
    location /api/ {
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

    # File serving
    location /api/files/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/selfky /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Setup (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d selfky.com -d www.selfky.com
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check application status
pm2 status
pm2 logs selfky-backend

# Check Nginx
sudo systemctl status nginx

# Check database connection
curl http://localhost:5000/api/health
```

### Logs

```bash
# Application logs
pm2 logs selfky-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx
```

### Updates

```bash
# Pull latest changes
cd /home/ubuntu/Selfky
git pull origin main

# Restart backend
cd server
pm2 restart selfky-backend

# Rebuild frontend
cd ../client
npm run build
sudo cp -r build/* /var/www/html/
```

## Troubleshooting

### Common Issues

1. **Port 5000 not accessible**
   - Check if backend is running: `pm2 status`
   - Check firewall: `sudo ufw status`

2. **Database connection issues**
   - Verify MongoDB Atlas connection string
   - Check network connectivity

3. **File upload failures**
   - Verify S3 credentials and permissions
   - Check bucket configuration

4. **SSL certificate issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

### Performance Optimization

1. **Enable Gzip compression** in Nginx
2. **Configure caching** for static assets
3. **Monitor memory usage** with PM2
4. **Set up log rotation** for application logs

## Security Considerations

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Backup Strategy**
   - Database backups from MongoDB Atlas
   - S3 bucket versioning
   - Application code in Git

## Support

For deployment issues:
1. Check application logs: `pm2 logs`
2. Verify environment variables
3. Test database connectivity
4. Review Nginx configuration 