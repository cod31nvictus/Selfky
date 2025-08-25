require('dotenv').config({ path: './.env' });
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function searchS3Files() {
  try {
    console.log('🔍 Searching for user files in S3...');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    // Search for photos
    console.log('\n📸 Searching for photos...');
    const photoCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'photos/',
      MaxKeys: 100
    });
    
    const photoResponse = await s3Client.send(photoCommand);
    if (photoResponse.Contents && photoResponse.Contents.length > 0) {
      console.log('✅ Photos found:');
      photoResponse.Contents.forEach((object, index) => {
        console.log(`  ${index + 1}. ${object.Key} (${object.Size} bytes)`);
      });
    } else {
      console.log('❌ No photos found in photos/ folder');
    }
    
    // Search for signatures
    console.log('\n✍️ Searching for signatures...');
    const signatureCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: 'signatures/',
      MaxKeys: 100
    });
    
    const signatureResponse = await s3Client.send(signatureCommand);
    if (signatureResponse.Contents && signatureResponse.Contents.length > 0) {
      console.log('✅ Signatures found:');
      signatureResponse.Contents.forEach((object, index) => {
        console.log(`  ${index + 1}. ${object.Key} (${object.Size} bytes)`);
      });
    } else {
      console.log('❌ No signatures found in signatures/ folder');
    }
    
    // Search for any files with common image extensions
    console.log('\n🖼️ Searching for image files...');
    const imageCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1000
    });
    
    const imageResponse = await s3Client.send(imageCommand);
    if (imageResponse.Contents && imageResponse.Contents.length > 0) {
      console.log('✅ All files in bucket:');
      const imageFiles = imageResponse.Contents.filter(obj => 
        obj.Key.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
      );
      
      if (imageFiles.length > 0) {
        imageFiles.forEach((object, index) => {
          console.log(`  ${index + 1}. ${object.Key} (${object.Size} bytes)`);
        });
      } else {
        console.log('❌ No image files found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error searching S3:', error.message);
  }
}

// Run the search
searchS3Files();
