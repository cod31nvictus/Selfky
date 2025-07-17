const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Email configuration
const emailConfig = {
  // Gmail SMTP Configuration (Primary)
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER || 'teamselfky@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD // Gmail App Password
    }
  },
  // Amazon SES Configuration (Fallback - requires production access)
  ses: {
    host: 'email-smtp.eu-north-1.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  }
};

// Create transporter based on available configuration
const createTransporter = () => {
  // Try Gmail first, then SES as fallback
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('Using Gmail SMTP for email service');
    return nodemailer.createTransport(emailConfig.gmail);
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Using Amazon SES for email service');
    return nodemailer.createTransport(emailConfig.ses);
  } else {
    console.warn('No email configuration found. Email service will be disabled.');
    return null;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, message: 'No email configuration found' };
  }

  try {
    await transporter.verify();
    return { success: true, message: 'Email configuration verified successfully' };
  } catch (error) {
    return { success: false, message: `Email configuration failed: ${error.message}` };
  }
};

// Send email function
const sendEmail = async (to, subject, htmlContent, textContent = '') => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email service not configured');
    return { success: false, message: 'Email service not configured' };
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER || 'teamselfky@gmail.com';

  const mailOptions = {
    from: `"Selfky Institute" <${fromEmail}>`,
    to: to,
    subject: subject,
    html: htmlContent,
    text: textContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  passwordReset: (resetLink, userName) => ({
    subject: 'Password Reset Request - Selfky',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://selfky.com/selfky-logo.png" alt="Selfky Logo" style="height: 60px;">
          <h1 style="color: #101418; margin-top: 20px;">Password Reset Request</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Hello ${userName || 'there'},
          </p>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password for your Selfky account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #101418; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #5c728a; font-size: 14px; margin-top: 20px;">
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
        
        <div style="text-align: center; color: #5c728a; font-size: 12px;">
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetLink}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf1; 
                    text-align: center; color: #5c728a; font-size: 12px;">
          <p>© 2024 Selfky. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  applicationSubmitted: (applicationNumber, courseType, userName) => ({
    subject: `Application Submitted - ${applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://selfky.com/selfky-logo.png" alt="Selfky Logo" style="height: 60px;">
          <h1 style="color: #101418; margin-top: 20px;">Application Submitted Successfully</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Hello ${userName},
          </p>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Your application has been submitted successfully! Here are the details:
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #101418; margin-bottom: 15px;">Application Details</h3>
            <p><strong>Application Number:</strong> ${applicationNumber}</p>
            <p><strong>Course:</strong> ${courseType === 'bpharm' ? 'BPharm (Ay.)' : 'MPharm (Ay.)'}</p>
            <p><strong>Status:</strong> <span style="color: #f59e0b;">Payment Pending</span></p>
          </div>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Please complete the payment to finalize your application. You can access your application 
            and complete payment by logging into your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://selfky.com/dashboard" 
               style="background-color: #101418; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              View Application
            </a>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf1; 
                    text-align: center; color: #5c728a; font-size: 12px;">
          <p>© 2024 Selfky. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  paymentCompleted: (applicationNumber, courseType, userName, amount) => ({
    subject: `Payment Completed - ${applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://selfky.com/selfky-logo.png" alt="Selfky Logo" style="height: 60px;">
          <h1 style="color: #101418; margin-top: 20px;">Payment Completed Successfully</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Hello ${userName},
          </p>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Your payment has been processed successfully! Your application is now complete.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #101418; margin-bottom: 15px;">Payment Details</h3>
            <p><strong>Application Number:</strong> ${applicationNumber}</p>
            <p><strong>Course:</strong> ${courseType === 'bpharm' ? 'BPharm (Ay.)' : 'MPharm (Ay.)'}</p>
            <p><strong>Amount Paid:</strong> ₹${amount}</p>
            <p><strong>Status:</strong> <span style="color: #10b981;">Payment Completed</span></p>
          </div>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            You can now download your admit card from your dashboard. The admit card will be 
            available for download within 24 hours.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://selfky.com/dashboard" 
               style="background-color: #101418; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              View Admit Card
            </a>
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf1; 
                    text-align: center; color: #5c728a; font-size: 12px;">
          <p>© 2024 Selfky. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  admitCardReady: (applicationNumber, courseType, userName) => ({
    subject: `Admit Card Ready - ${applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://selfky.com/selfky-logo.png" alt="Selfky Logo" style="height: 60px;">
          <h1 style="color: #101418; margin-top: 20px;">Admit Card Ready</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Hello ${userName},
          </p>
          
          <p style="color: #5c728a; font-size: 16px; margin-bottom: 20px;">
            Your admit card is now ready for download! Please download and print your admit card 
            as you'll need to bring it to the examination center.
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #101418; margin-bottom: 15px;">Admit Card Details</h3>
            <p><strong>Application Number:</strong> ${applicationNumber}</p>
            <p><strong>Course:</strong> ${courseType === 'bpharm' ? 'BPharm (Ay.)' : 'MPharm (Ay.)'}</p>
            <p><strong>Exam Date:</strong> March 15, 2025</p>
            <p><strong>Exam Time:</strong> 10:00 AM - 01:00 PM</p>
            <p><strong>Exam Center:</strong> Selfky Institute of Pharmacy, Lucknow</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://selfky.com/admit-card/${applicationNumber}" 
               style="background-color: #101418; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; 
                      display: inline-block;">
              Download Admit Card
            </a>
          </div>
          
          <p style="color: #5c728a; font-size: 14px; margin-top: 20px;">
            <strong>Important:</strong> Please bring a printed copy of your admit card and a valid 
            photo ID to the examination center.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaedf1; 
                    text-align: center; color: #5c728a; font-size: 12px;">
          <p>© 2024 Selfky. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

// Email service functions
const emailService = {
  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      const template = emailTemplates.passwordReset(resetLink, userName);
      
      const mailOptions = {
        from: `"Selfky Institute" <${process.env.EMAIL_FROM || process.env.GMAIL_USER || 'teamselfky@gmail.com'}>`,
        to: email,
        subject: template.subject,
        html: template.html
      };

      const result = await sendEmail(email, template.subject, template.html);
      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send application submitted email
  async sendApplicationSubmittedEmail(email, applicationNumber, courseType, userName) {
    try {
      const template = emailTemplates.applicationSubmitted(applicationNumber, courseType, userName);
      
      const mailOptions = {
        from: `"Selfky Institute" <${process.env.EMAIL_FROM || process.env.GMAIL_USER || 'teamselfky@gmail.com'}>`,
        to: email,
        subject: template.subject,
        html: template.html
      };

      const result = await sendEmail(email, template.subject, template.html);
      return result;
    } catch (error) {
      console.error('Error sending application submitted email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send payment completed email
  async sendPaymentCompletedEmail(email, applicationNumber, courseType, userName, amount) {
    try {
      const template = emailTemplates.paymentCompleted(applicationNumber, courseType, userName, amount);
      
      const mailOptions = {
        from: `"Selfky Institute" <${process.env.EMAIL_FROM || process.env.GMAIL_USER || 'teamselfky@gmail.com'}>`,
        to: email,
        subject: template.subject,
        html: template.html
      };

      const result = await sendEmail(email, template.subject, template.html);
      return result;
    } catch (error) {
      console.error('Error sending payment completed email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send admit card ready email
  async sendAdmitCardReadyEmail(email, applicationNumber, courseType, userName) {
    try {
      const template = emailTemplates.admitCardReady(applicationNumber, courseType, userName);
      
      const mailOptions = {
        from: `"Selfky Institute" <${process.env.EMAIL_FROM || process.env.GMAIL_USER || 'teamselfky@gmail.com'}>`,
        to: email,
        subject: template.subject,
        html: template.html
      };

      const result = await sendEmail(email, template.subject, template.html);
      return result;
    } catch (error) {
      console.error('Error sending admit card ready email:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate reset token
  generateResetToken() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  },

  // Verify email configuration
  async verifyEmailConfig() {
    const result = await verifyEmailConfig();
    return result;
  }
};

module.exports = emailService; 