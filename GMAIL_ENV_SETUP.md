# Gmail Environment Setup

## 📝 **Create .env File**

Create a file named `.env` in the `server` directory with the following content:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/selfky

# Server Configuration
PORT=5000
NODE_ENV=development

# Gmail SMTP Configuration
GMAIL_USER=teamselfky@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password_here
EMAIL_FROM=teamselfky@gmail.com

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/app.log
ERROR_LOG_FILE=./logs/error.log
```

## 🔑 **Important Steps**

### **1. Replace the App Password**
Replace `your_16_character_app_password_here` with the actual 16-character App Password you generated from Gmail.

**Example:**
```env
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

### **2. Update Other Values**
- Replace `your_jwt_secret_here` with a secure random string
- Replace `your_razorpay_key_id` and `your_razorpay_secret` with your actual Razorpay credentials

## 🧪 **Test the Setup**

After creating the `.env` file, test the email configuration:

```bash
cd server
node test-email.js
```

## ✅ **Expected Result**

If everything is configured correctly, you should see:
```
✅ Configuration result: Gmail SMTP configured successfully
✅ Test email sent successfully
``` 