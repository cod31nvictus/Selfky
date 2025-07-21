# Gmail Environment Setup for Selfky

This guide helps you set up Gmail SMTP for sending emails in the Selfky application.

## Environment Variables

Add these to your `.env` file:

```bash
# Gmail SMTP Configuration
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_gmail_address@gmail.com

# Database Configuration - MongoDB Atlas
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
```

> **Do not commit real credentials. Use .env files and .gitignore.**

## Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the generated password** as `GMAIL_APP_PASSWORD`

## Testing Email Configuration

Run the test script to verify your email setup:

```bash
cd server
node test-email.js
```

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific app passwords
- Regularly rotate your app passwords
- Monitor email sending logs for any issues 