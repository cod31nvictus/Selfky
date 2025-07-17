require('dotenv').config();
const emailService = require('./utils/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');

  // Test 1: Verify email configuration
  console.log('1. Testing email configuration...');
  try {
    const configResult = await emailService.verifyEmailConfig();
    console.log('✅ Configuration result:', configResult);
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
  }

  console.log('\n2. Testing email sending...');
  
  // Test 2: Send a test email
  try {
    const testEmail = 'test@example.com'; // Replace with your email for testing
    const result = await emailService.sendPasswordResetEmail(
      testEmail,
      'test-token-123',
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.log('❌ Test email failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
  }

  console.log('\n3. Testing different email types...');
  
  // Test 3: Test application submitted email
  try {
    const result = await emailService.sendApplicationSubmittedEmail(
      'test@example.com',
      'TEST001',
      'bpharm',
      'Test User'
    );
    
    if (result.success) {
      console.log('✅ Application submitted email test successful!');
    } else {
      console.log('❌ Application submitted email test failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Application email error:', error.message);
  }

  console.log('\n📧 Email Service Test Complete!');
  console.log('\n💡 Tips:');
  console.log('- Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env');
  console.log('- Enable 2FA on your Gmail account');
  console.log('- Generate an App Password for this application');
  console.log('- Replace test@example.com with your actual email for testing');
}

// Run the test
testEmailService().catch(console.error); 