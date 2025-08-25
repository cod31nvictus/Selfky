const s3Service = require('./utils/s3Service');
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function testS3Connection() {
  try {
    console.log('🔍 Testing S3 Connection...');
    console.log('Bucket:', process.env.S3_BUCKET_NAME);
    console.log('Region:', process.env.AWS_REGION);
    
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
