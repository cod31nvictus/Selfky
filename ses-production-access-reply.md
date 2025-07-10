# AWS SES Production Access Request Reply

**Subject: Re: Amazon SES Production Access Request - Selfky Pharmacy Admission Portal**

Dear AWS SES Team,

Thank you for your response. I'm writing to provide detailed information about our email sending use case for the Selfky Pharmacy Admission Portal.

## About Our Application

**Application Name:** Selfky Pharmacy Admission Portal  
**Website:** https://selfky.com  
**Business Type:** Educational Institution - Pharmacy Admission Portal  
**Primary Use:** Student application processing and communication

## Email Sending Use Case

### 1. **Email Types and Frequency**

**Transactional Emails (Primary Use):**
- **Password Reset Emails:** Sent when users request password recovery (1-2 emails per user per month)
- **Application Submission Confirmations:** Sent when students submit admission applications (1 email per application)
- **Payment Completion Notifications:** Sent when students complete application fees (1 email per payment)
- **Admit Card Notifications:** Sent when admit cards are ready for download (1 email per student)

**Volume Estimates:**
- **Monthly Volume:** 500-2,000 emails (depending on application season)
- **Peak Periods:** During admission seasons (March-July, September-December)
- **Average Daily Volume:** 10-50 emails during peak periods, 5-15 emails during off-season

### 2. **Recipient List Management**

**How we maintain recipient lists:**
- All recipients are **registered users** who have created accounts on our platform
- Email addresses are collected during user registration with explicit consent
- Users provide their email addresses voluntarily during the application process
- We do not purchase or use third-party email lists
- All recipients have opted in by creating accounts and submitting applications

**Data Collection Process:**
1. User registers with email address (explicit consent)
2. User submits application (additional consent for notifications)
3. User completes payment (consent for payment confirmations)
4. User receives admit card notifications (part of application process)

### 3. **Bounce and Complaint Management**

**Our bounce management process:**
- We immediately remove hard bounces from our database
- We track and remove soft bounces after 3 failed attempts
- We maintain a suppression list of bounced email addresses
- We do not send to email addresses that have previously bounced

**Complaint handling:**
- We provide clear unsubscribe links in all emails
- We immediately remove any email address that files a complaint
- We maintain a complaint suppression list
- We respond to all unsubscribe requests within 24 hours

**Unsubscribe process:**
- Every email includes a clear unsubscribe link
- Users can also unsubscribe through their account settings
- Unsubscribed users are immediately removed from all mailing lists
- We honor all unsubscribe requests within 24 hours

### 4. **Email Content Examples**

**Password Reset Email:**
```
Subject: Password Reset Request - Selfky
Content: Professional HTML email with Selfky branding, clear reset link, security notice, and contact information.
```

**Application Submission Email:**
```
Subject: Application Submitted - [Application Number]
Content: Confirmation of application submission, application details, next steps, and payment instructions.
```

**Payment Completion Email:**
```
Subject: Payment Completed - [Application Number]
Content: Payment confirmation, application status update, and admit card availability timeline.
```

**Admit Card Email:**
```
Subject: Admit Card Ready - [Application Number]
Content: Admit card download link, exam details, and important instructions.
```

### 5. **Email Quality and Best Practices**

**Content Quality:**
- All emails are **transactional** and directly related to user actions
- No marketing or promotional content
- Professional, educational tone
- Clear, actionable content
- Mobile-responsive HTML templates

**Technical Implementation:**
- Using Nodemailer with proper error handling
- Implementing proper authentication and security
- Following email best practices (proper headers, formatting)
- Using verified sender identity (teamselfky@gmail.com)

### 6. **Identity Verification**

**Current Setup:**
- **Verified Email Address:** teamselfky@gmail.com
- **Domain:** selfky.com (we can verify this domain if needed)
- **Sender Identity:** All emails sent from verified identity

### 7. **Monitoring and Compliance**

**Our monitoring process:**
- We track email delivery rates and bounce rates
- We monitor complaint rates and maintain them below 0.1%
- We regularly review and clean our email lists
- We maintain detailed logs of all email activities

**Compliance:**
- All emails comply with CAN-SPAM Act
- Clear sender identification in all emails
- Accurate subject lines
- Physical address included in emails
- Clear unsubscribe mechanism

### 8. **Technical Infrastructure**

**Email Service Setup:**
- Node.js backend with Nodemailer
- Amazon SES SMTP integration
- Proper error handling and retry logic
- Email templates with professional HTML design
- Secure token generation for password resets

**Security Measures:**
- Encrypted email transmission
- Secure token generation for password resets
- User authentication required for all email triggers
- Rate limiting on email sending

## Summary

Our use case is purely **transactional** - we only send emails that users explicitly request or that are essential to their application process. We do not send marketing emails, newsletters, or promotional content. All recipients are registered users who have opted in by creating accounts and submitting applications.

We are committed to maintaining high email quality, low bounce rates, and excellent user experience. Our email volume is moderate and predictable, with clear seasonal patterns.

We have verified our sender identity (teamselfky@gmail.com) and are ready to implement domain verification if required.

Thank you for considering our request. We look forward to your response.

**Best regards,**  
[Your Name]  
Selfky Pharmacy Admission Portal  
https://selfky.com

---

## Instructions for Sending

1. Copy the content above (excluding the markdown formatting)
2. Reply to the AWS SES email with this content
3. Replace `[Your Name]` with your actual name
4. Send the email to the address provided in the AWS message 