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