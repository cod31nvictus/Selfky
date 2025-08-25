const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

class S3Service {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
  }

  // Get a signed URL for an S3 object (for temporary access)
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  // Download an S3 object to a local temporary file
  async downloadToTemp(key, tempDir = '/tmp') {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const tempPath = path.join(tempDir, `temp-${Date.now()}-${path.basename(key)}`);
      
      // Create write stream
      const writeStream = fs.createWriteStream(tempPath);
      const readStream = response.Body;
      
      return new Promise((resolve, reject) => {
        readStream.pipe(writeStream);
        writeStream.on('finish', () => resolve(tempPath));
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading from S3:', error);
      return null;
    }
  }

  // Check if a file exists in S3
  async fileExists(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  // Get the full S3 URL for a file
  getPublicUrl(key) {
    if (!key) return null;
    
    // If the key already contains the full URL, return it
    if (key.startsWith('http')) {
      return key;
    }
    
    // If it's just a filename, construct the full S3 URL
    if (!key.includes('/')) {
      return `${process.env.S3_PUBLIC_BASE}/${key}`;
    }
    
    // If it's a path, construct the full S3 URL
    return `${process.env.S3_PUBLIC_BASE}/${key}`;
  }

  // Extract the S3 key from various formats
  extractS3Key(filePath) {
    if (!filePath) return null;
    
    // If it's already a full S3 URL, extract the key
    if (filePath.includes(process.env.S3_BUCKET_NAME)) {
      const urlParts = filePath.split(process.env.S3_BUCKET_NAME + '/');
      return urlParts[1] || null;
    }
    
    // If it's a local path, extract just the filename
    if (filePath.includes(path.sep)) {
      return path.basename(filePath);
    }
    
    // If it's just a filename, return as is
    return filePath;
  }
}

module.exports = new S3Service();
