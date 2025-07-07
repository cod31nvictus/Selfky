#!/bin/bash

# Payment Polling Monitor Script
# This script monitors and manages payment polling tasks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/server/logs/payment-monitor.log"
PID_FILE="$PROJECT_DIR/server/payment-polling.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if Node.js is running
check_node_process() {
    if pgrep -f "node.*server.js" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Check if payment polling is active
check_payment_polling() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is dead
            rm -f "$PID_FILE"
            return 1
        fi
    else
        return 1
    fi
}

# Start payment polling
start_polling() {
    log "Starting payment polling..."
    
    if check_payment_polling; then
        warning "Payment polling is already running"
        return 1
    fi
    
    if ! check_node_process; then
        error "Node.js server is not running. Please start the server first."
        return 1
    fi
    
    cd "$PROJECT_DIR/server"
    
    # Start payment polling in background
    nohup node -e "
        const { startScheduledTasks } = require('./scheduledTasks');
        startScheduledTasks();
        console.log('Payment polling started');
        process.on('SIGINT', () => {
            console.log('Stopping payment polling...');
            process.exit(0);
        });
    " > "$LOG_FILE" 2>&1 &
    
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    if check_payment_polling; then
        success "Payment polling started with PID $pid"
        return 0
    else
        error "Failed to start payment polling"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Stop payment polling
stop_polling() {
    log "Stopping payment polling..."
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            kill "$pid"
            rm -f "$PID_FILE"
            success "Payment polling stopped"
            return 0
        else
            warning "Payment polling process not found, cleaning up PID file"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        warning "No PID file found, payment polling may not be running"
        return 1
    fi
}

# Restart payment polling
restart_polling() {
    log "Restarting payment polling..."
    stop_polling
    sleep 2
    start_polling
}

# Show status
show_status() {
    echo -e "${BLUE}=== Payment Polling Status ===${NC}"
    
    if check_node_process; then
        echo -e "Node.js Server: ${GREEN}Running${NC}"
    else
        echo -e "Node.js Server: ${RED}Not Running${NC}"
    fi
    
    if check_payment_polling; then
        local pid=$(cat "$PID_FILE")
        echo -e "Payment Polling: ${GREEN}Running (PID: $pid)${NC}"
    else
        echo -e "Payment Polling: ${RED}Not Running${NC}"
    fi
    
    # Show recent logs
    if [ -f "$LOG_FILE" ]; then
        echo -e "\n${BLUE}=== Recent Logs ===${NC}"
        tail -n 10 "$LOG_FILE"
    fi
}

# Check payment statistics
check_statistics() {
    log "Checking payment statistics..."
    
    if ! check_node_process; then
        error "Node.js server is not running"
        return 1
    fi
    
    cd "$PROJECT_DIR/server"
    
    # Run statistics check
    node -e "
        const Application = require('./models/Application');
        const mongoose = require('mongoose');
        
        mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
            .then(async () => {
                const stats = {
                    totalPayments: await Application.countDocuments({ paymentStatus: 'completed' }),
                    pendingPayments: await Application.countDocuments({ paymentStatus: 'pending' }),
                    failedPayments: await Application.countDocuments({ paymentStatus: 'failed' })
                };
                console.log('Payment Statistics:', JSON.stringify(stats, null, 2));
                process.exit(0);
            })
            .catch(err => {
                console.error('Error:', err);
                process.exit(1);
            });
    "
}

# Manual payment status check
check_payment_status() {
    local payment_id="$1"
    
    if [ -z "$payment_id" ]; then
        error "Payment ID is required"
        echo "Usage: $0 check-payment <payment_id>"
        return 1
    fi
    
    log "Checking payment status for: $payment_id"
    
    cd "$PROJECT_DIR/server"
    
    node -e "
        const { checkPaymentStatus } = require('./scheduledTasks');
        
        checkPaymentStatus('$payment_id')
            .then(status => {
                console.log('Payment Status:', status);
                process.exit(0);
            })
            .catch(err => {
                console.error('Error:', err);
                process.exit(1);
            });
    "
}

# Cleanup specific application
cleanup_application() {
    local application_id="$1"
    
    if [ -z "$application_id" ]; then
        error "Application ID is required"
        echo "Usage: $0 cleanup <application_id>"
        return 1
    fi
    
    log "Cleaning up application: $application_id"
    
    cd "$PROJECT_DIR/server"
    
    node -e "
        const { cleanupApplication } = require('./scheduledTasks');
        
        cleanupApplication('$application_id')
            .then(status => {
                console.log('Application Status:', status);
                process.exit(0);
            })
            .catch(err => {
                console.error('Error:', err);
                process.exit(1);
            });
    "
}

# Show help
show_help() {
    echo "Payment Polling Monitor Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start payment polling"
    echo "  stop        - Stop payment polling"
    echo "  restart     - Restart payment polling"
    echo "  status      - Show current status"
    echo "  stats       - Check payment statistics"
    echo "  check-payment <id> - Check specific payment status"
    echo "  cleanup <id>       - Cleanup specific application"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 check-payment pay_123456789"
    echo "  $0 cleanup 507f1f77bcf86cd799439011"
}

# Main script logic
case "$1" in
    start)
        start_polling
        ;;
    stop)
        stop_polling
        ;;
    restart)
        restart_polling
        ;;
    status)
        show_status
        ;;
    stats)
        check_statistics
        ;;
    check-payment)
        check_payment_status "$2"
        ;;
    cleanup)
        cleanup_application "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 