# Selfky - Application Management System

A full-stack web application for managing course applications with user authentication, document uploads, payment processing, and PDF generation.

## 🚀 Features

- **User Authentication**: Register and login with JWT tokens
- **Password Reset**: Secure email-based password reset flow
- **Multi-step Application Form**: Guided application process
- **Document Upload**: Photo and document management
- **Payment Integration**: Secure payment processing
- **Email Notifications**: Application status and payment confirmations
- **PDF Generation**: Admit cards and invigilator sheets
- **Admin Panel**: Application management and oversight

## 🛠️ Tech Stack

- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **File Storage**: Local storage (configurable for AWS S3)
- **Payment**: Razorpay/Stripe integration
- **PDF Generation**: PDFKit

## 📁 Project Structure

```
/selfky
├── /client                      # React frontend
│   ├── /public
│   └── /src
│       ├── /components
│       ├── /pages
│       └── App.js
├── /server                      # Node.js backend
│   ├── /controllers
│   ├── /models
│   ├── /routes
│   └── server.js
├── /uploads                     # Document storage
└── README.md
```

## 🚀 Quick Start

> **Do not commit real credentials. Use .env files and .gitignore.**

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd selfky
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   JWT_SECRET=your_jwt_secret
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=5000
   
   # Email Configuration (for password reset and notifications)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Start the application**
   
   **Terminal 1 - Start the server:**
   ```bash
   cd server
   node server.js
   ```
   
   **Terminal 2 - Start the client:**
   ```bash
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Email Setup (Optional but Recommended)

For password reset and email notifications to work:

1. **Configure Email Settings**
   - Update the email configuration in `server/.env`
   - See `EMAIL_SETUP.md` for detailed instructions

2. **Test Email Functionality**
   - Go to `/forgot-password` to test password reset
   - Submit an application to test email notifications

## 📋 Current Progress

### ✅ Completed (95% Complete)
- [x] **Core Infrastructure**: Complete React + Node.js setup with MongoDB Atlas
- [x] **User Authentication**: JWT-based auth with password reset and admin login
- [x] **Application Management**: Multi-step form with document uploads
- [x] **Payment Integration**: Complete Razorpay integration with webhooks
- [x] **PDF Generation**: Admit cards and invigilator sheets with PDFKit
- [x] **Email System**: Amazon SES integration with notifications
- [x] **Admin Panel**: Comprehensive admin dashboard with management features
- [x] **Frontend Application**: Complete React UI with responsive design
- [x] **Backend API**: RESTful API with 50+ endpoints
- [x] **Deployment**: Production-ready Railway deployment with SSL
- [x] **Security**: Rate limiting, CORS, helmet, input validation
- [x] **Monitoring**: Health checks, performance metrics, logging
- [x] **Backup Strategy**: Automated backup system

### 🚧 In Progress (5% Remaining)
- [ ] **Advanced Analytics Dashboard**: Real-time charts and statistics
- [ ] **Enhanced Admin Features**: Bulk operations and advanced filtering
- [ ] **Performance Optimizations**: Redis caching and database indexing
- [ ] **Testing & QA**: Unit tests, integration tests, automated pipeline

## 🔧 Development

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset