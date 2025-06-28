# Selfky - MVP Task List

## 🟢 PHASE 1: Setup & Auth

### Task 1: Setup basic folder structure for client and server
- Start + End: Create folders `/client`, `/server`, `/uploads`
- Test: Project folders exist and run basic React + Node apps

### Task 2: Configure MongoDB + Mongoose connection
- Start + End: Create MongoDB URI env config and connect in `server.js`
- Test: Server connects and logs success

### Task 3: Create User model with email, password hash
- Start + End: Define Mongoose schema
- Test: Can create user document manually

### Task 4: Implement user registration API
- Start + End: POST /api/auth/register
- Test: Creates user with hashed password

### Task 5: Implement login API with JWT token
- Start + End: POST /api/auth/login
- Test: Returns token on valid credentials

### Task 6: Build React login & register screens
- Start + End: Create form pages and hook to API
- Test: Able to register and login via UI

### Task 7: Add admin login via `.env` credentials
- Start + End: Middleware for static check in backend
- Test: Access `/admin` only with correct env credentials

---

## 🟢 PHASE 2: Application Process

### Task 8: Build multi-step application form (React)
- Start + End: 3-step form navigation (form, upload, payment)
- Test: Local form state saved and synced on stage completion

### Task 9: Create application form API + model
- Start + End: POST /api/application
- Test: Save form data to DB

### Task 10: Implement document/photo upload (multer or S3)
- Start + End: Add upload endpoint + React uploader
- Test: Uploads image and docs to /uploads or S3

### Task 11: Add field validation for mandatory documents
- Start + End: Conditional logic + backend checks
- Test: Missing mandatory uploads throw errors

---

## 🟢 PHASE 3: Payment Gateway Integration

### Task 12: Setup Razorpay/Stripe and create payment API
- Start + End: POST /api/payment/initiate
- Test: Creates order ID

### Task 13: Handle payment verification + webhook sync
- Start + End: POST /api/payment/verify, /webhook
- Test: Payment status reflected in DB

### Task 14: Show payment screen in React
- Start + End: Render payment component on stage 3
- Test: Payment processed and updated

---

## 🟢 PHASE 4: Admit Card + PDF Generation

### Task 15: Create PDF generator for Admit Card
- Start + End: Backend PDF with user info
- Test: Downloadable PDF is correct

### Task 16: Show Admit Card on final stage
- Start + End: Link on stage 4 after payment verified
- Test: PDF opens with user data

---

## 🟢 PHASE 5: Admin Panel

### Task 17: Admin dashboard: list of applications
- Start + End: Secure route + React table UI
- Test: Lists all applicants

### Task 18: Add filter + view details
- Start + End: Filters by course/payment
- Test: Admin can view full application

### Task 19: Generate Invigilator Sheet PDF
- Start + End: Batch PDF export with all applicants
- Test: PDF is generated and downloadable

---

## 🟢 PHASE 6: Password Reset Flow

### Task 20: Implement forgot password email
- Start + End: Send reset link via Nodemailer
- Test: Email received with token

### Task 21: Create reset password page
- Start + End: Verify token + change password
- Test: Password updates on success

---

## Final Cleanup
- Task 22: Error handling middleware
- Task 23: Form validation checks
- Task 24: Deployment configs