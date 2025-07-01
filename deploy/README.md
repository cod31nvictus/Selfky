# AWS EC2 Deployment Guide for Selfky.com

This guide will help you deploy Selfky on a free AWS EC2 instance with your selfky.com domain.

## Prerequisites

- AWS Account (Free tier eligible)
- GoDaddy domain: selfky.com
- Basic knowledge of AWS EC2 and DNS
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)

## Step-by-Step Deployment

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose Amazon Machine Image (AMI): Ubuntu Server 22.04 LTS
3. Choose Instance Type: t2.micro (Free tier eligible)
4. Configure Security Group: Allow SSH (22), HTTP (80), HTTPS (443)
5. Create/Select Key Pair (save the .pem file)
6. **Note your EC2 Public IP** - you'll need this for DNS configuration

### 2. Configure GoDaddy DNS

1. **Login to GoDaddy** and go to your selfky.com domain
2. **Click "DNS"** in the domain management section
3. **Add A Records:**
   - **Type:** A
   - **Name:** @ (or leave blank)
   - **Value:** Your EC2 Public IP
   - **TTL:** 600 (or default)
   
   - **Type:** A
   - **Name:** www
   - **Value:** Your EC2 Public IP
   - **TTL:** 600 (or default)
4. **Save changes** and wait 5-10 minutes for DNS propagation

### 3. Connect to EC2 Instance

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

### 4. Run Setup Script

```bash
wget https://raw.githubusercontent.com/cod31nvictus/Selfky/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 5. Deploy Application

```bash
wget https://raw.githubusercontent.com/cod31nvictus/Selfky/main/deploy/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 6. Set Up SSL Certificate

**Wait for DNS propagation** (check with: `nslookup selfky.com`), then:

```bash
# Edit SSL script with your email
nano deploy/ssl-setup.sh
# Change "your-email@example.com" to your actual email

# Run SSL setup
chmod +x deploy/ssl-setup.sh
./deploy/ssl-setup.sh
```

## Environment Variables

Edit `/var/www/selfky/server/.env`:

```env
NODE_ENV=production
JWT_SECRET=your_very_secure_jwt_secret_key_here
MONGO_URI=mongodb://localhost:27017/selfky
PORT=5000
```

## Domain Verification

After DNS propagation, verify your domain:

```bash
# Check if domain resolves to your EC2 IP
nslookup selfky.com
nslookup www.selfky.com

# Test HTTP access
curl -I http://selfky.com
curl -I http://www.selfky.com
```

## Monitoring Commands

```bash
pm2 status                    # Check application status
pm2 logs selfky-server        # View application logs
sudo nginx -t                 # Test nginx configuration
sudo systemctl status mongod  # Check MongoDB status
sudo certbot certificates     # Check SSL certificate status
```

## SSL Certificate Management

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# View certificate details
sudo certbot certificates --cert-name selfky.com
```

## Troubleshooting

### Domain not resolving
- Check GoDaddy DNS settings
- Verify A records point to correct EC2 IP
- Wait longer for DNS propagation (up to 24 hours)

### SSL certificate issues
```bash
sudo certbot --nginx -d selfky.com -d www.selfky.com --force-renewal
sudo systemctl reload nginx
```

### Application not accessible
```bash
pm2 status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## Cost Optimization

- Free tier limits: 750 hours/month for t2.micro
- Monitor usage in AWS Billing Dashboard
- Set up billing alerts to avoid unexpected charges
- Domain renewal: ~$12/year on GoDaddy
- SSL certificate: Free with Let's Encrypt

## Final URLs

After successful deployment:
- **Production URL:** https://selfky.com
- **API Health Check:** https://selfky.com/api/health
- **Admin Access:** https://selfky.com/admin (when implemented)

# Selfky Deployment Scripts

This directory contains deployment scripts for the Selfky application. Each script is designed for different scenarios and provides different levels of reliability and speed.

## Available Scripts

### 1. `robust-deployment.sh` (Recommended)
**Use this for:**
- Regular deployments
- When you want maximum reliability
- When you've made significant changes
- Production deployments

**Features:**
- ✅ Comprehensive error handling
- ✅ Multiple fallback strategies for dependency installation
- ✅ Automatic hanging process cleanup
- ✅ System resource monitoring
- ✅ Build backup before deployment
- ✅ Dependency conflict resolution (ajv, etc.)
- ✅ Colored output with timestamps
- ✅ Deployment verification
- ✅ Support for npm, yarn, and pnpm

**Usage:**
```bash
chmod +x deploy/robust-deployment.sh
./deploy/robust-deployment.sh
```

### 2. `update-deployment.sh` (Legacy Wrapper)
**Use this for:**
- Backward compatibility
- When you want to use the robust script but prefer the old name

**Features:**
- 🔄 Wrapper that calls the robust deployment script
- 📋 Provides information about the robust script

**Usage:**
```bash
chmod +x deploy/update-deployment.sh
./deploy/update-deployment.sh
```

### 3. `quick-deploy.sh` (Emergency)
**Use this for:**
- Emergency deployments
- When you need speed over reliability
- When node_modules already exist
- Minor changes that don't affect dependencies

**Features:**
- ⚡ Fast deployment (skips dependency installation if node_modules exist)
- 🔄 Minimal error handling
- 📦 Only installs dependencies if missing

**Usage:**
```bash
chmod +x deploy/quick-deploy.sh
./deploy/quick-deploy.sh
```

### 4. `simple-deploy.sh` (Basic)
**Use this for:**
- Simple deployments
- When you want minimal complexity
- Testing deployments

**Features:**
- 📦 Basic dependency checking
- 🔨 Simple build process
- 🔄 Standard restart procedures

**Usage:**
```bash
chmod +x deploy/simple-deploy.sh
./deploy/simple-deploy.sh
```

## Common Issues and Solutions

### Issue: npm install hangs
**Solution:** The robust deployment script automatically handles this by:
- Killing hanging processes
- Using multiple package managers (npm, yarn, pnpm)
- Setting timeouts
- Using legacy peer deps

### Issue: ajv module not found
**Solution:** The robust script automatically fixes this by installing the correct ajv version.

### Issue: Build fails due to dependencies
**Solution:** The robust script tries multiple strategies:
1. Standard npm install
2. npm install with force
3. yarn install
4. pnpm install

### Issue: Backend won't start
**Solution:** The robust script:
- Checks PM2 installation
- Provides detailed error logs
- Verifies backend is responding

## Prerequisites

Before running any deployment script, ensure:

1. **SSH access** to your EC2 instance
2. **Git repository** cloned to `/home/ubuntu/Selfky`
3. **Node.js and npm** installed
4. **PM2** installed globally (`npm install -g pm2`)
5. **Nginx** configured and running
6. **MongoDB** running and accessible

## Manual Deployment Steps

If scripts fail, you can deploy manually:

```bash
# 1. Connect to server
ssh -i your-key.pem ubuntu@your-server-ip

# 2. Navigate to project
cd /home/ubuntu/Selfky

# 3. Pull latest changes
git pull origin main

# 4. Install backend dependencies
cd server
npm install

# 5. Install frontend dependencies
cd ../client
npm install --legacy-peer-deps

# 6. Build frontend
npm run build

# 7. Restart backend
cd ../server
pm2 restart selfky-backend

# 8. Reload Nginx
sudo systemctl reload nginx
```

## Troubleshooting

### Check if deployment was successful:
```bash
# Check backend status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost
```

### If deployment fails:
1. Check the error messages in the script output
2. Look at PM2 logs: `pm2 logs selfky-backend`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify system resources: `free -h` and `df -h`

## Best Practices

1. **Always use the robust deployment script** for production deployments
2. **Test deployments** on a staging environment first
3. **Monitor system resources** before deploying
4. **Keep backups** of working builds
5. **Document any custom configurations** you make

## Support

If you encounter issues:
1. Check the script output for error messages
2. Review the troubleshooting section above
3. Check system logs for additional information
4. Consider running the manual deployment steps 