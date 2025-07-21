# 🔒 Selfky Backup Strategy

This document outlines the comprehensive backup strategy for the Selfky application.

## 📋 **Backup Overview**

### **What We're Backing Up**
1. **Database**: MongoDB Atlas data (users, applications, payments)
2. **Files**: AWS S3 stored documents and images
3. **Configuration**: Environment variables and settings
4. **Code**: Git repository (GitHub)

---

## 🗄️ **Database Backups**

### **1. MongoDB Atlas Built-in Backups**
✅ **Automatic Daily Backups**: Atlas creates daily backups automatically
✅ **Point-in-Time Recovery**: Can restore to any point in the last 7 days
✅ **Cloud Storage**: Backups stored securely in AWS cloud
✅ **No Manual Work**: Atlas handles everything automatically

**How to Access Atlas Backups**:
1. Log into MongoDB Atlas dashboard
2. Go to your cluster
3. Click "Backup" tab
4. View available backups and restore points

### **2. Manual Database Exports**
We've created a backup utility that exports Atlas data locally:

```bash
# Run manual backup
cd /home/ubuntu/Selfky/server
node backup-script.js

# Or run the backup manager directly
node -e "
const BackupManager = require('./utils/backup');
const backup = new BackupManager();
backup.createCompleteBackup().then(console.log);
"
```

**Backup Location**: `/home/ubuntu/Selfky/backups/`

---

## 📁 **File Backups (AWS S3)**

### **1. S3 Versioning**
✅ **Automatic Versioning**: Every file change creates a new version
✅ **Accidental Deletion Protection**: Can restore previous versions
✅ **Cross-Region Replication**: Can replicate to another region

### **2. S3 Lifecycle Policies**
Configure automatic archiving of old files:
- Move to cheaper storage after 30 days
- Delete after 1 year (if needed)

---

## ⚙️ **Configuration Backups**

### **1. Environment Variables**
Our backup system automatically backs up:
- Database connection strings
- API keys (redacted for security)
- Application settings
- S3 configuration

### **2. Server Configuration**
- Nginx configuration
- PM2 ecosystem files
- SSL certificates

---

## 🔄 **Automated Backup Schedule**

### **Daily Backups**
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /home/ubuntu/Selfky/server && node backup-script.js >> /home/ubuntu/backup.log 2>&1
```

### **Weekly Backups**
```bash
# Add to crontab for weekly backups on Sundays at 3 AM
0 3 * * 0 cd /home/ubuntu/Selfky/server && node backup-script.js >> /home/ubuntu/backup-weekly.log 2>&1
```

---

## 🛠️ **Backup Management**

### **1. Manual Backup**
```bash
# Create backup immediately
curl -X POST http://localhost:5000/api/admin/backup

# List available backups
curl http://localhost:5000/api/admin/backups
```

### **2. Check Backup Status**
```bash
# View backup directory
ls -la /home/ubuntu/Selfky/backups/

# Check backup logs
tail -f /home/ubuntu/backup.log
```

### **3. Restore from Backup**
```bash
# Restore database from backup
cd /home/ubuntu/Selfky/server
node -e "
const BackupManager = require('./utils/backup');
const backup = new BackupManager();
backup.restoreDatabase('/path/to/backup/directory');
"
```

---

## 🔐 **Security Considerations**

### **1. Backup Encryption**
- All backups are encrypted at rest
- S3 backups use AWS encryption
- Local backups should be encrypted (TODO)

### **2. Access Control**
- Backup API endpoints require admin authentication
- S3 backups have restricted access
- Local backups have proper file permissions

### **3. Backup Retention**
- Daily backups: Keep for 30 days
- Weekly backups: Keep for 1 year
- Monthly backups: Keep for 3 years

---

## 🚨 **Disaster Recovery Plan**

### **1. Database Recovery**
```bash
# Option 1: Use Atlas point-in-time recovery
# Log into Atlas dashboard and restore

# Option 2: Use local backup
mongorestore --uri="mongodb+srv://..." /path/to/backup
```

### **2. File Recovery**
```bash
# Restore from S3 version
aws s3 cp s3://bucket/backups/file-version /local/path

# Or use S3 console to restore previous version
```

### **3. Configuration Recovery**
```bash
# Restore .env file from backup
cp /home/ubuntu/Selfky/backups/config-2024-01-01.json /home/ubuntu/Selfky/server/.env
```

---

## 📊 **Backup Monitoring**

### **1. Health Checks**
```bash
# Check if backups are running
pm2 logs selfky-backend | grep backup

# Check backup directory size
du -sh /home/ubuntu/Selfky/backups/
```

### **2. Backup Alerts**
- Monitor backup script exit codes
- Alert if backup size is too small
- Alert if backup is older than 24 hours

---

## 📈 **Backup Performance**

### **1. Database Backup**
- **Size**: ~10-50 MB (depending on data)
- **Time**: 1-5 minutes
- **Frequency**: Daily

### **2. Configuration Backup**
- **Size**: ~1-5 KB
- **Time**: < 1 second
- **Frequency**: Daily

### **3. S3 Backup**
- **Size**: Varies by file uploads
- **Time**: Depends on file size
- **Frequency**: Real-time (versioning)

---

## ✅ **Current Backup Status**

### **✅ Working**
- MongoDB Atlas automatic backups
- S3 file versioning
- Git code repository
- Manual backup scripts

### **⚠️ Needs Setup**
- Automated backup scheduling (cron jobs)
- Backup monitoring and alerts
- Local backup encryption
- Backup retention policies

### **❌ Missing**
- Cross-region S3 replication
- Backup testing procedures
- Disaster recovery drills

---

## 🎯 **Next Steps**

1. **Set up automated backups**:
   ```bash
   # Add to crontab
   crontab -e
   # Add daily backup at 2 AM
   0 2 * * * cd /home/ubuntu/Selfky/server && node backup-script.js
   ```

2. **Test backup restoration**:
   ```bash
   # Test database restore
   node -e "
   const BackupManager = require('./utils/backup');
   const backup = new BackupManager();
   backup.restoreDatabase('/path/to/test/backup');
   "
   ```

3. **Monitor backup health**:
   ```bash
   # Check backup status daily
   curl http://localhost:5000/api/admin/backups
   ```

---

## 📞 **Backup Support**

If you encounter backup issues:

1. **Check logs**: `tail -f /home/ubuntu/backup.log`
2. **Verify MongoDB Atlas**: Check Atlas dashboard for automatic backups
3. **Test S3 access**: `aws s3 ls s3://your-bucket/backups/`
4. **Check disk space**: `df -h /home/ubuntu/Selfky/backups/`

**Your data is protected with multiple layers of backup! 🛡️** 