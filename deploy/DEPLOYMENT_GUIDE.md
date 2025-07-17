# 🚀 Selfky EC2 Deployment Guide

## 📋 **Prerequisites**

1. **EC2 Instance Running** ✅
2. **Domain Configured** (selfky.com) ✅
3. **SSH Access** to EC2 instance
4. **GitHub Repository** updated with latest code ✅

## 🔧 **Step-by-Step Deployment**

### **Step 1: Connect to Your EC2 Instance**

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### **Step 2: Navigate to Application Directory**

```bash
cd /home/ubuntu
```

### **Step 3: Run the Deployment Script**

```bash
# Make the script executable
chmod +x Selfky/deploy/deploy-with-email.sh

# Run the deployment
./Selfky/deploy/deploy-with-email.sh
```

### **Step 4: Configure Environment Variables**

After deployment, update the production environment variables:

```bash
nano Selfky/server/.env
```

**Update these critical values:**

```env
# JWT Secret (generate a secure random string)
JWT_SECRET=your_very_secure_jwt_secret_key_here_change_this_in_production

# Gmail App Password (from your Gmail setup)
GMAIL_APP_PASSWORD=djqd uecz sdgv rwuf

# Razorpay Keys (from your Razorpay dashboard)
RAZORPAY_KEY_ID=your_actual_razorpay_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_secret
```

### **Step 5: Restart the Application**

```bash
pm2 restart selfky-backend
```

### **Step 6: Test the Application**

1. **Frontend**: https://selfky.com
2. **Backend API**: https://selfky.com/api
3. **Email System**: Test password reset flow

## 🔍 **Verification Steps**

### **Check Application Status**

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs selfky-backend

# Check nginx status
sudo systemctl status nginx
```

### **Test Email System**

```bash
cd Selfky/server
node test-gmail-setup.js
```

### **Test API Endpoints**

```bash
# Test health endpoint
curl https://selfky.com/api/health

# Test password reset (if needed)
curl -X POST https://selfky.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Port 5000 not accessible**
   ```bash
   sudo ufw allow 5000
   ```

2. **Nginx configuration error**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **PM2 process not starting**
   ```bash
   pm2 delete selfky-backend
   pm2 start ecosystem.config.js
   ```

4. **Email not working**
   ```bash
   cd Selfky/server
   node test-gmail-setup.js
   ```

### **Log Locations**

- **Application Logs**: `/home/ubuntu/Selfky/server/logs/`
- **PM2 Logs**: `pm2 logs selfky-backend`
- **Nginx Logs**: `/var/log/nginx/`

## 🔒 **Security Setup**

### **SSL Certificate (Recommended)**

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d selfky.com -d www.selfky.com
```

### **Firewall Configuration**

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

## 📊 **Monitoring**

### **Application Monitoring**

```bash
# Real-time logs
pm2 logs selfky-backend --lines 100

# Application status
pm2 monit

# System resources
htop
```

### **Database Monitoring**

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check database size
mongo selfky --eval "db.stats()"
```

## 🔄 **Updates and Maintenance**

### **Deploy Updates**

```bash
# Pull latest code
cd /home/ubuntu/Selfky
git pull origin main

# Reinstall dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Rebuild frontend
cd client && npm run build && cd ..

# Restart application
pm2 restart selfky-backend
```

### **Backup Database**

```bash
# Create backup
mongodump --db selfky --out /home/ubuntu/backups/$(date +%Y%m%d)

# Restore backup (if needed)
mongorestore --db selfky /home/ubuntu/backups/20241201/selfky/
```

## 📞 **Support**

If you encounter issues:

1. Check logs: `pm2 logs selfky-backend`
2. Check nginx: `sudo nginx -t`
3. Check system: `htop`
4. Restart services: `pm2 restart selfky-backend`

## ✅ **Deployment Checklist**

- [ ] EC2 instance running
- [ ] Domain DNS configured
- [ ] Deployment script executed
- [ ] Environment variables updated
- [ ] Application restarted
- [ ] Email system tested
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring set up

**Your Selfky application is now live at https://selfky.com! 🎉** 