# Email Setup Guide for Selfky

This guide explains how to configure email functionality for password reset and application notifications.

## Email Configuration

### 1. Environment Variables

Add the following environment variables to your `server/.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

### 2. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for your application

#### Step 2: Generate App Password
1. Go to Google Account → Security
2. Under "2-Step Verification", click "App passwords"
3. Generate a new app password for "Mail"
4. Use this password in your `EMAIL_PASSWORD` environment variable

#### Step 3: Update Environment Variables
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
FRONTEND_URL=https://selfky.com
```

### 3. Alternative Email Providers

#### Outlook/Hotmail
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Custom SMTP Server
```env
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASSWORD=your-password
EMAIL_SECURE=true
```

## Email Features Implemented

### 1. Password Reset Flow
- **Forgot Password**: User requests password reset via email
- **Reset Token**: Secure token generated and sent via email
- **Reset Password**: User sets new password using token
- **Token Expiry**: Tokens expire after 1 hour for security

### 2. Application Notifications
- **Application Submitted**: Email sent when application is successfully submitted
- **Payment Completed**: Email sent when payment is successfully processed
- **Admit Card Ready**: Email sent when admit card is generated

### 3. Email Templates
All emails include:
- Professional HTML templates
- Selfky branding
- Clear call-to-action buttons
- Mobile-responsive design
- Security information

## Testing Email Configuration

### 1. Verify Email Setup
```bash
# In your server directory
node -e "
const emailService = require('./utils/emailService');
emailService.verifyEmailConfig().then(result => {
  console.log('Email config result:', result);
});
"
```

### 2. Test Password Reset
1. Go to `/forgot-password`
2. Enter your email address
3. Check your email for the reset link
4. Click the link to test the reset flow

### 3. Test Application Notifications
1. Submit a test application
2. Complete payment
3. Generate admit card
4. Check emails at each step

## Troubleshooting

### Common Issues

#### 1. "Invalid credentials" error
- Verify your email and password are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check that 2-Factor Authentication is enabled

#### 2. "Connection timeout" error
- Check your internet connection
- Verify the email service settings
- Try a different email provider

#### 3. Emails not being sent
- Check server logs for error messages
- Verify environment variables are set correctly
- Test email configuration using the verification function

### Debug Mode

Enable debug logging by adding to your `.env`:
```env
DEBUG_EMAIL=true
```

This will log detailed email sending information to help troubleshoot issues.

## Production Deployment

### 1. Update Environment Variables
```env
NODE_ENV=production
FRONTEND_URL=https://selfky.com
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@selfky.com
EMAIL_PASSWORD=your-production-app-password
```

### 2. Email Service Recommendations
- **Gmail**: Good for development and small scale
- **SendGrid**: Recommended for production (free tier available)
- **Amazon SES**: Cost-effective for high volume
- **Mailgun**: Good for transactional emails

### 3. Domain Configuration
For production, consider:
- Using a custom domain for emails (e.g., noreply@selfky.com)
- Setting up SPF and DKIM records
- Configuring email authentication

## Security Considerations

### 1. Password Reset Security
- Tokens expire after 1 hour
- Tokens are single-use only
- Secure token generation using crypto
- No user enumeration (same response for existing/non-existing emails)

### 2. Email Security
- Use App Passwords instead of regular passwords
- Enable 2-Factor Authentication
- Use HTTPS for all email links
- Implement rate limiting for email requests

### 3. Data Protection
- Emails don't contain sensitive information
- Reset tokens are hashed in database
- Email addresses are validated before sending

## Monitoring and Logging

### 1. Email Logging
All email operations are logged:
- Successful email sends
- Failed email attempts
- Configuration errors

### 2. Monitoring
Monitor email delivery rates and bounce rates in production.

### 3. Error Handling
- Email failures don't break application functionality
- Graceful degradation when email service is unavailable
- User-friendly error messages

## Support

If you encounter issues with email setup:
1. Check the troubleshooting section above
2. Verify your email provider settings
3. Test with a different email provider
4. Check server logs for detailed error messages 