#!/usr/bin/env node

const BackupManager = require('./utils/backup');
const logger = require('./utils/logger');

async function runBackup() {
  try {
    console.log('🚀 Starting Selfky backup process...');
    
    const backupManager = new BackupManager();
    
    // Create complete backup
    const manifest = await backupManager.createCompleteBackup();
    
    console.log('✅ Backup completed successfully!');
    console.log('📋 Backup manifest:', manifest);
    
    // List available backups
    const backups = backupManager.listBackups();
    console.log('📁 Available backups:', backups);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

// Run backup if this script is executed directly
if (require.main === module) {
  runBackup();
}

module.exports = runBackup; 