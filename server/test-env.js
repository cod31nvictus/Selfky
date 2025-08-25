console.log('🔍 Testing Environment Variables...');
console.log('Current working directory:', process.cwd());

// Try to load dotenv
try {
  require('dotenv').config({ path: './.env' });
  console.log('✅ dotenv loaded successfully');
} catch (error) {
  console.error('❌ Error loading dotenv:', error.message);
}

// Check if dotenv package is installed
try {
  const dotenv = require('dotenv');
  console.log('✅ dotenv package found');
} catch (error) {
  console.error('❌ dotenv package not found:', error.message);
}

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing');

// Try to read .env file directly
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve('./.env');
  console.log('\n📁 .env file path:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 .env file size:', envContent.length, 'characters');
    
    // Check for AWS variables in the file
    if (envContent.includes('AWS_REGION')) {
      console.log('✅ AWS_REGION found in .env file');
    } else {
      console.log('❌ AWS_REGION NOT found in .env file');
    }
    
    if (envContent.includes('S3_BUCKET_NAME')) {
      console.log('✅ S3_BUCKET_NAME found in .env file');
    } else {
      console.log('❌ S3_BUCKET_NAME NOT found in .env file');
    }
  } else {
    console.log('❌ .env file does not exist at:', envPath);
  }
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
}
