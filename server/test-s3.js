// Load environment variables FIRST, before any other imports
require('dotenv').config({ path: './.env' });

const s3Service = require('./utils/s3Service');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function testS3Connection() {
  try {
    console.log('🔍 Testing S3 Connection...');
    console.log('Environment variables loaded:');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present' : 'Missing');
    
    if (!process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
      console.error('❌ Missing required environment variables');
      console.error('Current working directory:', process.cwd());
      console.error('Env file path:', require('path').resolve('./.env'));
      return;
    }
    
    // Test listing objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 10
    });
    
    const response = await s3Service.s3Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log('✅ S3 Connection Successful!');
      console.log('📁 Files found in bucket:');
      response.Contents.forEach((object, index) => {
        console.log(`  ${index + 1}. ${object.Key} (${object.Size} bytes)`);
      });
    } else {
      console.log('✅ S3 Connection Successful!');
      console.log('📁 Bucket is empty or no files found');
    }
    
    // Test if we can access a specific file (if any exists)
    if (response.Contents && response.Contents.length > 0) {
      const testFile = response.Contents[0];
      console.log(`\n🧪 Testing access to: ${testFile.Key}`);
      
      const exists = await s3Service.fileExists(testFile.Key);
      console.log(`File exists: ${exists}`);
      
      if (exists) {
        const publicUrl = s3Service.getPublicUrl(testFile.Key);
        console.log(`Public URL: ${publicUrl}`);
      }
    }
    
  } catch (error) {
    console.error('❌ S3 Connection Failed:', error.message);
    if (error.name === 'AccessDenied') {
      console.error('   This might be a permissions issue. Check your AWS credentials.');
    }
  }
}

// Run the test
testS3Connection();
