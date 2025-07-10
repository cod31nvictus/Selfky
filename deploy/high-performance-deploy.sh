#!/bin/bash

# High Performance Selfky Deployment Script
# Optimized for 5000+ concurrent users
# Includes Redis caching, load balancing, and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Update system and install dependencies
update_system() {
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install essential packages
    sudo apt install -y nginx redis-server htop iotop nethogs
}

# Configure Redis for high performance
configure_redis() {
    log "Configuring Redis for high performance..."
    
    # Backup original config
    sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
    
    # Optimize Redis configuration
    sudo tee -a /etc/redis/redis.conf << EOF

# High performance settings
maxmemory 512mb
maxmemory-policy allkeys-lru
save ""
appendonly no
tcp-keepalive 300
timeout 0
tcp-backlog 511
EOF
    
    sudo systemctl restart redis-server
    sudo systemctl enable redis-server
}

# Configure Nginx for high performance
configure_nginx() {
    log "Configuring Nginx for high performance..."
    
    # Backup original config
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Optimize Nginx configuration
    sudo tee /etc/nginx/nginx.conf << EOF
user www-data;
worker_processes auto;
worker_cpu_affinity auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/s;
    
    # Upstream for load balancing
    upstream backend {
        least_conn;
        server 127.0.0.1:5000 max_fails=3 fail_timeout=30s;
        server 127.0.0.1:5001 max_fails=3 fail_timeout=30s;
        server 127.0.0.1:5002 max_fails=3 fail_timeout=30s;
        server 127.0.0.1:5003 max_fails=3 fail_timeout=30s;
    }
    
    server {
        listen 80;
        server_name selfky.com www.selfky.com;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        
        # API with rate limiting
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            proxy_read_timeout 300;
            proxy_connect_timeout 300;
            proxy_send_timeout 300;
        }
        
        # Login with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }
        
        # File uploads with caching
        location /uploads {
            alias /home/ubuntu/Selfky/server/uploads;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Static files with aggressive caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            root /var/www/selfky;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
        
        # Main application
        location / {
            root /var/www/selfky;
            try_files \$uri \$uri/ /index.html;
            index index.html;
            
            # Cache HTML for 1 hour
            location ~* \.html$ {
                expires 1h;
                add_header Cache-Control "public";
            }
        }
    }
}
EOF
    
    sudo nginx -t && sudo systemctl restart nginx
}

# Install PM2 for process management
install_pm2() {
    log "Installing PM2 process manager..."
    npm install -g pm2
    
    # Create PM2 ecosystem file
    cat > /home/ubuntu/Selfky/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'selfky-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      cwd: '/home/ubuntu/Selfky/server',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '1G',
      error_file: '/home/ubuntu/Selfky/logs/err.log',
      out_file: '/home/ubuntu/Selfky/logs/out.log',
      log_file: '/home/ubuntu/Selfky/logs/combined.log',
      time: true
    }
  ]
};
EOF
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create logs directory
    mkdir -p /home/ubuntu/Selfky/logs
    
    # Install monitoring tools
    sudo apt install -y htop iotop nethogs
    
    # Create monitoring script
    cat > /home/ubuntu/Selfky/monitor.sh << 'EOF'
#!/bin/bash

# Monitoring script for Selfky
LOG_FILE="/home/ubuntu/Selfky/logs/monitor.log"

echo "$(date): === System Status ===" >> $LOG_FILE

# CPU Usage
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%" >> $LOG_FILE

# Memory Usage
echo "Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')" >> $LOG_FILE

# Disk Usage
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')" >> $LOG_FILE

# Active connections
echo "Active Connections: $(netstat -an | grep :80 | wc -l)" >> $LOG_FILE

# PM2 Status
echo "PM2 Status:" >> $LOG_FILE
pm2 status >> $LOG_FILE

echo "" >> $LOG_FILE
EOF
    
    chmod +x /home/ubuntu/Selfky/monitor.sh
    
    # Add to crontab for monitoring every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/Selfky/monitor.sh") | crontab -
}

# Deploy application
deploy_app() {
    log "Deploying Selfky application..."
    
    cd /home/ubuntu/Selfky
    
    # Pull latest changes
    git pull origin main
    
    # Install backend dependencies
    cd server
    npm install --production
    
    # Build frontend
    cd ../client
    npm install --production
    npm run build
    
    # Copy build to nginx directory
    sudo cp -r build/* /var/www/selfky/
    
    # Start application with PM2
    cd ../server
    pm2 delete selfky-backend || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
}

# Main deployment function
main() {
    log "Starting high-performance deployment..."
    
    update_system
    configure_redis
    configure_nginx
    install_pm2
    setup_monitoring
    deploy_app
    
    log "Deployment completed successfully!"
    log "Application is now optimized for high load"
    
    # Show status
    echo ""
    echo "=== Deployment Status ==="
    pm2 status
    echo ""
    echo "=== System Resources ==="
    free -h
    echo ""
    echo "=== Redis Status ==="
    sudo systemctl status redis-server --no-pager
    echo ""
    echo "=== Nginx Status ==="
    sudo systemctl status nginx --no-pager
}

# Run main function
main "$@" 