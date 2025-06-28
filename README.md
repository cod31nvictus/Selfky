# Selfky - Application Management System

A full-stack web application for managing course applications with user authentication, document uploads, payment processing, and PDF generation.

## 🚀 Features

- **User Authentication**: Register and login with JWT tokens
- **Multi-step Application Form**: Guided application process
- **Document Upload**: Photo and document management
- **Payment Integration**: Secure payment processing
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
   JWT_SECRET=your_jwt_secret_key_here
   MONGO_URI=mongodb://localhost:27017/selfky
   PORT=5000
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

## 📋 Current Progress

### ✅ Completed
- [x] Project setup and folder structure
- [x] MongoDB connection and User model
- [x] User registration and login with JWT
- [x] React frontend with authentication UI
- [x] Basic routing and navigation

### 🚧 In Progress
- [ ] Multi-step application form
- [ ] Document upload functionality
- [ ] Payment gateway integration
- [ ] PDF generation
- [ ] Admin panel

## 🔧 Development

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/health` - Health check

### Available Scripts

**Server:**
```bash
cd server
node server.js
```

**Client:**
```bash
cd client
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request 