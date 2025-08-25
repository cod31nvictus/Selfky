const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const s3Service = require('./s3Service');

class PDFGenerator {
  constructor() {
    // Default constructor - not used in new implementation
  }

  // Generate admit card PDF
  generateAdmitCard(applicationData) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting PDF generation for application:', applicationData.applicationNumber);
        
        // Create PDF document with A4 size and optimized margins
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
          }
        });

        const chunks = [];
        doc.on('data', chunk => {
          console.log('PDF chunk received, size:', chunk.length);
          chunks.push(chunk);
        });
        
        doc.on('end', () => {
          console.log('PDF generation completed, total chunks:', chunks.length);
          const buffer = Buffer.concat(chunks);
          console.log('Final PDF buffer size:', buffer.length);
          resolve(buffer);
        });

        doc.on('error', (error) => {
          console.error('PDF generation error:', error);
          reject(error);
        });

        // Set font sizes for A4 optimization
        const titleFontSize = 18;
        const headingFontSize = 14;
        const bodyFontSize = 10;
        const smallFontSize = 8;

        console.log('Adding content to PDF...');

        // Header with logo and title
        doc.fontSize(titleFontSize).font('Helvetica-Bold').text('ADMIT CARD', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(bodyFontSize).font('Helvetica').text(applicationData.courseInfo?.fullName || 'Course Information', { align: 'center' });
        doc.moveDown(1);

        // Two-column layout for applicant and exam details
        const leftX = 50;
        const rightX = 300;
        const startY = 120;
        let currentY = startY;

        // Applicant Details (Left Column)
        doc.fontSize(headingFontSize).font('Helvetica-Bold').text('Applicant Details', leftX, currentY);
        currentY += 20;

        const applicantDetails = [
          ['Application Number:', applicationData.applicationNumber || 'N/A'],
          ['Full Name:', applicationData.formData?.fullName || 'N/A'],
          ['Father\'s Name:', applicationData.formData?.fathersName || 'N/A'],
          ['Category:', applicationData.formData?.category || 'N/A'],
          ['Date of Birth:', applicationData.formData.dateOfBirth ? 
            new Date(applicationData.formData.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'
          ]
        ];

        applicantDetails.forEach(([label, value]) => {
          doc.fontSize(bodyFontSize).font('Helvetica').text(label, leftX, currentY);
          doc.fontSize(bodyFontSize).font('Helvetica-Bold').text(value, leftX + 120, currentY);
          currentY += 15;
        });

        // Examination Details (Right Column)
        currentY = startY;
        doc.fontSize(headingFontSize).font('Helvetica-Bold').text('Examination Details', rightX, currentY);
        currentY += 20;

        const examDetails = [
          ['Exam Date:', '31-08-2025'],
          ['Exam Time:', '11:00 am to 1:00 pm'],
          ['Exam Center:', 'NLT Institute of Medical Sciences BHU'],
          ['Center Address:', 'BHU, Varanasi, Uttar Pradesh - 221005']
        ];

        examDetails.forEach(([label, value]) => {
          doc.fontSize(bodyFontSize).font('Helvetica').text(label, rightX, currentY);
          doc.fontSize(bodyFontSize).font('Helvetica-Bold').text(value, rightX + 120, currentY);
          currentY += 15;
        });

        // Photo and Signature Section
        currentY = Math.max(currentY, startY + 100);
        doc.fontSize(headingFontSize).font('Helvetica-Bold').text('Applicant Photo', leftX, currentY);
        doc.fontSize(headingFontSize).font('Helvetica-Bold').text('Applicant Signature', rightX, currentY);
        currentY += 20;

        // Photo placeholder
        doc.rect(leftX, currentY, 60, 80).stroke();
        doc.fontSize(smallFontSize).font('Helvetica').text('Photo', leftX + 25, currentY + 35);

        // Signature placeholder
        doc.rect(rightX, currentY, 120, 40).stroke();
        doc.fontSize(smallFontSize).font('Helvetica').text('Signature', rightX + 50, currentY + 20);

        // Instructions
        currentY += 100;
        doc.fontSize(headingFontSize).font('Helvetica-Bold').text('Important Instructions', 50, currentY);
        currentY += 20;

        const instructions = [
          'Please arrive at the exam center 1 hour before the exam time',
          'Carry this admit card and a valid photo ID proof',
          'No electronic devices are allowed in the examination hall',
          'Follow all COVID-19 safety protocols as per institute guidelines',
          'Report to the examination hall 30 minutes before the exam starts'
        ];

        instructions.forEach((instruction, index) => {
          doc.fontSize(bodyFontSize).font('Helvetica').text(`• ${instruction}`, 50, currentY);
          currentY += 15;
        });

        // Signature lines at bottom
        currentY += 20;
        doc.lineCap('butt').moveTo(50, currentY).lineTo(200, currentY).stroke();
        doc.fontSize(smallFontSize).font('Helvetica').text('Applicant\'s Signature', 100, currentY + 5);

        doc.lineCap('butt').moveTo(300, currentY).lineTo(450, currentY).stroke();
        doc.fontSize(smallFontSize).font('Helvetica').text('Authorized Signature', 350, currentY + 5);

        console.log('Finalizing PDF...');
        doc.end();
        
      } catch (error) {
        console.error('Error in generateAdmitCard:', error);
        reject(error);
      }
    });
  }

  // Generate invigilator sheet PDF
  generateInvigilatorSheet(applications) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('INVIGILATOR SHEET', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica').text('NLT Institute of Medical Sciences BHU', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Examination Date: 31-08-2025 | Time: 11:00 AM - 1:00 PM', { align: 'center' });
        doc.moveDown(2);

        // Table headers
        const headers = ['S.No.', 'Application No.', 'Full Name', 'Category', 'Signature'];
        const colWidths = [40, 80, 150, 80, 80];
        let x = 50;
        let y = 150;

        // Draw table headers
        headers.forEach((header, index) => {
          doc.fontSize(10).font('Helvetica-Bold').text(header, x, y);
          x += colWidths[index];
        });

        // Draw header lines
        y += 20;
        doc.moveTo(50, y).lineTo(430, y).stroke();

        // Add application data
        applications.forEach((app, index) => {
          y += 25;
          if (y > 700) { // Check if we need a new page
            doc.addPage();
            y = 150;
          }

          x = 50;
          doc.fontSize(9).font('Helvetica').text((index + 1).toString(), x, y);
          x += colWidths[0];
          
          doc.fontSize(9).font('Helvetica').text(app.applicationNumber || 'N/A', x, y);
          x += colWidths[1];
          
          doc.fontSize(9).font('Helvetica').text(app.formData?.fullName || 'N/A', x, y);
          x += colWidths[2];
          
          doc.fontSize(9).font('Helvetica').text(app.formData?.category || 'N/A', x, y);
          x += colWidths[3];
          
          // Signature space
          doc.rect(x, y - 5, 70, 20).stroke();
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator; 