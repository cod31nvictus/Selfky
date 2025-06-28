# Selfky - Architecture Document

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT for users; Admin via env-based static login
- **PDF Generation**: `pdfkit` or `puppeteer`
- **File Storage**: Local storage or AWS S3 (TBD)
- **Email Service**: Nodemailer (Gmail or SMTP)
- **Payment Gateway**: Razorpay or Stripe (via APIs)

---

## File + Folder Structure

```
/selfky
├── /client                      # React frontend
│   ├── /public
│   └── /src
│       ├── /components
│       ├── /pages
│       ├── /services            # API calls
│       ├── /hooks
│       └── App.js
│
├── /server                      # Node.js backend
│   ├── /controllers
│   ├── /models
│   ├── /routes
│   ├── /middlewares
│   ├── /utils                   # pdf generation, payment helpers
│   └── server.js
│
├── /.env                        # Contains admin credentials, DB, email, etc.
└── /uploads                     # For document/photo storage
```

---

## Modules + Responsibilities

### 1. **Authentication Module**
- **User Login/Register** with email & password
- **Password Reset** via email token
- **Admin Login** via static credentials in `.env`

**State**: Auth state managed via JWT (stored in React context or localStorage)

---

### 2. **Application Process Module**
**Stages:**
1. Application Form (multiple fields — text, dropdown, date)
2. Photo & Documents Upload (mandatory & optional)
3. Online Payment
4. Admit Card PDF Generation

**State**:
- User progress saved in MongoDB
- Client state handled via React context per form stage

---

### 3. **Payment Gateway Module**
- Integrate with API (e.g., Razorpay)
- Create payment order
- Verify payment response
- Sync payment status via webhook and manual status check

**State**: 
- Payment status stored in `UserApplication` collection

---

### 4. **PDF Generator Module**
- Admit Card with user info (PDF)
- Invigilator Sheet with all applicants (PDF with batch export)

**Tech**: `pdfkit` or `puppeteer`, saved temporarily then downloaded

---

### 5. **Admin Panel Module**
- Admin login
- Dashboard: List of all applicants with filters
- View individual applications
- Payment status management
- Generate invigilator sheet PDF

**State**: Admin session via cookie/session token

---

## Database Models

### User
```js
{
  email,
  passwordHash,
  resetToken,
  resetTokenExpiry
}
```

### UserApplication
```js
{
  userId,
  courseType,
  personalDetails: {},
  documents: {
    photo,
    idProof,
    optionalCert
  },
  payment: {
    status,
    transactionId
  },
  admitCardGenerated: Boolean
}
```

---

## Services Connection

- React frontend uses Axios to call Express APIs
- Express handles auth, form, upload, payment, PDF logic
- MongoDB stores users, applications, and logs
- Payment gateway API integrated in backend only