# AWS EC2 Deployment Guide for Selfky

This guide will help you deploy Selfky on a free AWS EC2 instance.

## Prerequisites

- AWS Account (Free tier eligible)
- Basic knowledge of AWS EC2
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)

## Step-by-Step Deployment

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose Amazon Machine Image (AMI): Ubuntu Server 22.04 LTS
3. Choose Instance Type: t2.micro (Free tier eligible)
4. Configure Security Group: Allow SSH (22), HTTP (80), HTTPS (443)
5. Create/Select Key Pair (save the .pem file)

### 2. Connect to EC2 Instance

For Windows (PuTTY):
```bash
# Convert .pem to .ppk using PuTTYgen
# Connect using PuTTY with your .ppk file
```

For Mac/Linux:
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Run Setup Script

```bash
wget https://raw.githubusercontent.com/cod31nvictus/Selfky/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 4. Deploy Application

```bash
wget https://raw.githubusercontent.com/cod31nvictus/Selfky/main/deploy/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

Edit `/var/www/selfky/server/.env`:

```env
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret_key_here
MONGO_URI=mongodb://localhost:27017/selfky
PORT=5000
```

## Monitoring Commands

```bash
pm2 status                    # Check application status
pm2 logs selfky-server        # View application logs
sudo nginx -t                 # Test nginx configuration
sudo systemctl status mongod  # Check MongoDB status
```

## Cost Optimization

- Free tier limits: 750 hours/month for t2.micro
- Monitor usage in AWS Billing Dashboard
- Set up billing alerts to avoid unexpected charges 