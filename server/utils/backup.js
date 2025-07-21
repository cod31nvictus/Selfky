const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const logger = require('./logger');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.s3 = new AWS.S3();
  }

  // Create backup directory
  createBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Backup MongoDB Atlas data
  async backupDatabase() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const backupPath = path.join(this.backupDir, `db-${date}`);
      
      this.createBackupDir();
      
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      logger.info('Starting MongoDB Atlas backup...');
      
      // Export database using mongodump
      const command = `mongodump --uri="${mongoUri}" --out="${backupPath}"`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('Database backup failed:', error);
            reject(error);
            return;
          }
          
          logger.info('Database backup completed successfully');
          logger.info(`Backup saved to: ${backupPath}`);
          resolve(backupPath);
        });
      });
    } catch (error) {
      logger.error('Database backup error:', error);
      throw error;
    }
  }

  // Backup environment configuration
  async backupConfig() {
    try {
      const date = new Date().toISOString().split('T')[0];
      const configBackupPath = path.join(this.backupDir, `config-${date}.json`);
      
      this.createBackupDir();
      
      // Read current .env file
      const envPath = path.join(__dirname, '../.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Create config backup object
      const configBackup = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        envContent: envContent,
        databaseUri: process.env.MONGODB_URI ? '***REDACTED***' : 'NOT_SET',
        s3Bucket: process.env.S3_BUCKET_NAME || 'NOT_SET',
        redisHost: process.env.REDIS_HOST || 'NOT_SET'
      };
      
      // Save config backup
      fs.writeFileSync(configBackupPath, JSON.stringify(configBackup, null, 2));
      
      logger.info('Configuration backup completed');
      logger.info(`Config backup saved to: ${configBackupPath}`);
      
      return configBackupPath;
    } catch (error) {
      logger.error('Configuration backup error:', error);
      throw error;
    }
  }

  // Upload backup to S3
  async uploadToS3(localPath, s3Key) {
    try {
      const fileContent = fs.readFileSync(localPath);
      
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `backups/${s3Key}`,
        Body: fileContent,
        ContentType: 'application/octet-stream'
      };
      
      const result = await this.s3.upload(params).promise();
      logger.info(`Backup uploaded to S3: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw error;
    }
  }

  // Create complete backup
  async createCompleteBackup() {
    try {
      logger.info('Starting complete backup process...');
      
      // Create backup directory
      this.createBackupDir();
      
      // Backup database
      const dbBackupPath = await this.backupDatabase();
      
      // Backup configuration
      const configBackupPath = await this.backupConfig();
      
      // Create backup manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        databaseBackup: dbBackupPath,
        configBackup: configBackupPath,
        version: '1.0.0'
      };
      
      const manifestPath = path.join(this.backupDir, `manifest-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      
      // Upload to S3 if configured
      if (process.env.S3_BUCKET_NAME) {
        try {
          await this.uploadToS3(dbBackupPath, `database-${new Date().toISOString().split('T')[0]}.tar.gz`);
          await this.uploadToS3(configBackupPath, `config-${new Date().toISOString().split('T')[0]}.json`);
          await this.uploadToS3(manifestPath, `manifest-${new Date().toISOString().split('T')[0]}.json`);
        } catch (s3Error) {
          logger.warn('S3 upload failed, keeping local backup only:', s3Error.message);
        }
      }
      
      logger.info('Complete backup process finished successfully');
      return manifest;
      
    } catch (error) {
      logger.error('Complete backup failed:', error);
      throw error;
    }
  }

  // List available backups
  listBackups() {
    try {
      this.createBackupDir();
      
      const files = fs.readdirSync(this.backupDir);
      const backups = {
        database: files.filter(f => f.startsWith('db-')),
        config: files.filter(f => f.startsWith('config-')),
        manifest: files.filter(f => f.startsWith('manifest-'))
      };
      
      logger.info('Available backups:', backups);
      return backups;
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  // Restore database from backup
  async restoreDatabase(backupPath) {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      logger.info(`Restoring database from: ${backupPath}`);
      
      const command = `mongorestore --uri="${mongoUri}" --drop "${backupPath}"`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('Database restore failed:', error);
            reject(error);
            return;
          }
          
          logger.info('Database restore completed successfully');
          resolve();
        });
      });
    } catch (error) {
      logger.error('Database restore error:', error);
      throw error;
    }
  }
}

module.exports = BackupManager; 