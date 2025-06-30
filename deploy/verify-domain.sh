#!/bin/bash

# Domain Verification Script for Selfky.com
# Run this script to check if your domain is properly configured

echo "🔍 Verifying selfky.com domain configuration..."

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "📍 EC2 Public IP: $EC2_IP"

# Check DNS resolution
echo ""
echo "🌐 Checking DNS resolution..."

echo "Checking selfky.com..."
SELFKY_IP=$(nslookup selfky.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')
if [ "$SELFKY_IP" = "$EC2_IP" ]; then
    echo "✅ selfky.com resolves to correct IP: $SELFKY_IP"
else
    echo "❌ selfky.com resolves to: $SELFKY_IP (expected: $EC2_IP)"
fi

echo "Checking www.selfky.com..."
WWW_IP=$(nslookup www.selfky.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')
if [ "$WWW_IP" = "$EC2_IP" ]; then
    echo "✅ www.selfky.com resolves to correct IP: $WWW_IP"
else
    echo "❌ www.selfky.com resolves to: $WWW_IP (expected: $EC2_IP)"
fi

# Check HTTP accessibility
echo ""
echo "🌐 Checking HTTP accessibility..."

echo "Testing http://selfky.com..."
if curl -s -I http://selfky.com | grep -q "HTTP/1.1 200"; then
    echo "✅ http://selfky.com is accessible"
else
    echo "❌ http://selfky.com is not accessible"
fi

echo "Testing http://www.selfky.com..."
if curl -s -I http://www.selfky.com | grep -q "HTTP/1.1 200"; then
    echo "✅ http://www.selfky.com is accessible"
else
    echo "❌ http://www.selfky.com is not accessible"
fi

# Check SSL certificate (if exists)
echo ""
echo "🔒 Checking SSL certificate..."

if sudo certbot certificates | grep -q "selfky.com"; then
    echo "✅ SSL certificate found for selfky.com"
    echo "Testing https://selfky.com..."
    if curl -s -I https://selfky.com | grep -q "HTTP/1.1 200"; then
        echo "✅ https://selfky.com is accessible"
    else
        echo "❌ https://selfky.com is not accessible"
    fi
else
    echo "⚠️  SSL certificate not found. Run ./deploy/ssl-setup.sh after DNS propagation"
fi

# Check application status
echo ""
echo "📊 Checking application status..."

if pm2 list | grep -q "selfky-server"; then
    echo "✅ Selfky server is running"
else
    echo "❌ Selfky server is not running"
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

if sudo systemctl is-active --quiet mongod; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is not running"
fi

echo ""
echo "🎯 Summary:"
echo "   Domain: selfky.com"
echo "   EC2 IP: $EC2_IP"
echo "   HTTP: http://selfky.com"
echo "   HTTPS: https://selfky.com (after SSL setup)"
echo "   API: https://selfky.com/api/health" 