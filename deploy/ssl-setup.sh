#!/bin/bash

# SSL Setup Script for Selfky.com
# Run this script after domain DNS is configured

echo "🔒 Setting up SSL certificate for selfky.com..."

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Stop nginx temporarily
echo "⏸️ Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Obtain SSL certificate
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d selfky.com -d www.selfky.com --non-interactive --agree-tos --email your-email@example.com

# Test certificate renewal
echo "🧪 Testing certificate renewal..."
sudo certbot renew --dry-run

# Start nginx
echo "▶️ Starting Nginx..."
sudo systemctl start nginx

# Update nginx config to force HTTPS
echo "🔧 Updating Nginx configuration for HTTPS..."
sudo sed -i 's/# return 301 https:\/\/$server_name$request_uri;/return 301 https:\/\/$server_name$request_uri;/' /etc/nginx/sites-available/selfky

# Test and reload nginx
echo "🧪 Testing Nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

echo "✅ SSL setup complete!"
echo "🌐 Your application is now available at: https://selfky.com"
echo "📝 Certificate will auto-renew every 60 days"
echo "📝 To check certificate status: sudo certbot certificates" 