require('dotenv').config();
const emailService = require('./utils/emailService');

async function testEmail() {
  console.log('Testing email configuration...');
  
  try {
    // Test 1: Verify email config
    console.log('\n1. Testing email configuration...');
    const configResult = await emailService.verifyEmailConfig();
    console.log('Config result:', configResult);
    
    // Test 2: Send test email
    console.log('\n2. Sending test email...');
    const testResult = await emailService.sendPasswordResetEmail(
      'your-actual-email@gmail.com', // Replace with your actual email
      'test-token-123',
      'Test User'
    );
    console.log('Test email result:', testResult);
    
    if (testResult.success) {
      console.log('✅ Email test successful! Check your inbox.');
    } else {
      console.log('❌ Email test failed:', testResult.error);
    }
    
  } catch (error) {
    console.error('❌ Email test error:', error);
  }
}

testEmail(); 