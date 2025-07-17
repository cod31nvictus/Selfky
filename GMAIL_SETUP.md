# Gmail SMTP Setup Guide

Since Amazon SES production access was denied, we'll use Gmail SMTP as the primary email solution. This is a reliable and easy-to-setup alternative.

## 🔧 **Setup Instructions**

### **Step 1: Enable 2-Factor Authentication on Gmail**

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled
4. This is required to generate an App Password

### **Step 2: Generate Gmail App Password**

1. Go to Google Account settings: https://myaccount.google.com/
2. Navigate to "Security" → "2-Step Verification"
3. Scroll down and click "App passwords"
4. Select "Mail" as the app and "Other" as the device
5. Click "Generate"
6. **Copy the 16-character password** (you won't see it again)

### **Step 3: Update Environment Variables**

Add these to your `.env` file:

```env
# Gmail Configuration (Primary)
GMAIL_USER=teamselfky@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password_here

# Email From Address
EMAIL_FROM=teamselfky@gmail.com

# Optional: Keep SES config for future use
EMAIL_USER=your_ses_smtp_username
EMAIL_PASSWORD=your_ses_smtp_password
```

### **Step 4: Test Email Configuration**

Run this command to test the email setup:

```bash
cd server
node -e "
const emailService = require('./utils/emailService');
emailService.verifyEmailConfig().then(result => {
  console.log('Email config result:', result);
}).catch(error => {
  console.error('Email config error:', error);
});
"
```

## 📧 **Email Features Available**

With Gmail SMTP, you'll have access to:

- ✅ Password reset emails
- ✅ Application submission confirmations
- ✅ Payment completion notifications
- ✅ Admit card ready notifications
- ✅ Professional HTML templates

## 📊 **Gmail Limits**

- **Daily sending limit**: 500 emails per day
- **Rate limit**: 100 emails per hour
- **Perfect for**: Small to medium applications

## 🔄 **Migration from SES to Gmail**

The email service automatically detects and uses Gmail when:
- `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Falls back to SES if Gmail is not configured
- Graceful degradation if no email config is found

## 🚀 **Benefits of Gmail SMTP**

1. **Immediate Setup**: No approval process required
2. **Reliable**: Google's infrastructure
3. **Easy Configuration**: Simple SMTP setup
4. **Good Deliverability**: Gmail has excellent reputation
5. **Free**: No additional costs

## 🔒 **Security Notes**

- App passwords are more secure than regular passwords
- They can be revoked individually
- No access to your main Gmail account
- Specific to the application

## 📝 **Troubleshooting**

### **Common Issues:**

1. **"Invalid login" error**
   - Ensure 2FA is enabled
   - Verify app password is correct
   - Check GMAIL_USER is correct

2. **"Authentication failed"**
   - Regenerate app password
   - Ensure no spaces in the password

3. **"Connection timeout"**
   - Check internet connection
   - Verify firewall settings

### **Testing Email Sending:**

```bash
cd server
node test-email.js
```

## 🎯 **Next Steps**

1. Set up Gmail app password
2. Update environment variables
3. Test email configuration
4. Restart the server
5. Test password reset functionality

The application will continue to work perfectly with Gmail SMTP! 🚀 