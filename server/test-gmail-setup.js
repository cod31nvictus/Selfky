const nodemailer = require('nodemailer');
require('dotenv').config();

async function testGmailSetup() {
  console.log('🧪 Testing Gmail SMTP Setup...\n');

  // Check if environment variables are set
  console.log('1. Checking environment variables...');
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  if (!gmailUser || !gmailPassword || !emailFrom) {
    console.error('❌ Missing environment variables:');
    console.error(`   GMAIL_USER: ${gmailUser ? '✅ Set' : '❌ Missing'}`);
    console.error(`   GMAIL_APP_PASSWORD: ${gmailPassword ? '✅ Set' : '❌ Missing'}`);
    console.error(`   EMAIL_FROM: ${emailFrom ? '✅ Set' : '❌ Missing'}`);
    console.error('\nPlease check your .env file and ensure all variables are set.');
    return;
  }

  console.log('✅ All environment variables are set');

  // Test SMTP connection
  console.log('\n2. Testing SMTP connection...');
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailPassword
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    // Test email sending
    console.log('\n3. Testing email sending...');
    const testEmail = 'test@example.com'; // Replace with your email for testing
    
    const mailOptions = {
      from: emailFrom,
      to: testEmail,
      subject: 'Selfky - Gmail SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Selfky Email Test</h2>
          <p>This is a test email to verify that Gmail SMTP is working correctly.</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>SMTP Host: smtp.gmail.com</li>
            <li>Port: 587</li>
            <li>From: ${emailFrom}</li>
            <li>To: ${testEmail}</li>
          </ul>
          <p style="color: #059669;">✅ If you receive this email, Gmail SMTP is working!</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully');
    console.log('   Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Common Solutions:');
      console.error('1. Make sure 2-Factor Authentication is enabled on your Gmail account');
      console.error('2. Generate a new App Password from Google Account settings');
      console.error('3. Use the 16-character App Password (not your regular Gmail password)');
      console.error('4. Remove spaces from the App Password if any');
    }
  }
}

testGmailSetup().catch(console.error); 