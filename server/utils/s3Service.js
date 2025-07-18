const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'selfky-applications-2025';

class S3Service {
  // Upload file to S3
  static async uploadFile(file, folder = 'uploads') {
    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: 'private'
      };

      const result = await s3.upload(params).promise();
      return {
        success: true,
        url: result.Location,
        key: fileName
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download file from S3
  static async downloadFile(fileKey) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey
      };

      const result = await s3.getObject(params).promise();
      return {
        success: true,
        data: result.Body,
        contentType: result.ContentType
      };
    } catch (error) {
      console.error('S3 download error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete file from S3
  static async deleteFile(fileKey) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey
      };

      await s3.deleteObject(params).promise();
      return {
        success: true
      };
    } catch (error) {
      console.error('S3 delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get signed URL for temporary access
  static async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Expires: expiresIn
      };

      const url = await s3.getSignedUrl('getObject', params);
      return {
        success: true,
        url: url
      };
    } catch (error) {
      console.error('S3 signed URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = S3Service; 