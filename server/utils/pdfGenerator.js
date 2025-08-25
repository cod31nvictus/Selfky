const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const s3Service = require('./s3Service');

class PDFGenerator {
  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
  }

  // Generate admit card PDF
  generateAdmitCard(applicationData) {
    return new Promise((resolve, reject) => {
      try {
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
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Set font sizes for A4 optimization
        const titleFontSize = 18;
        const headingFontSize = 14;
        const bodyFontSize = 10;
        const smallFontSize = 8;

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

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate invigilator sheet (for admin)
  async generateInvigilatorSheet(applications) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `invigilator-sheet-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../uploads', filename);
        const stream = fs.createWriteStream(filepath);

        this.doc.pipe(stream);

        // Header
        this.doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('SELFKY INSTITUTE OF PHARMACY', { align: 'center' })
          .moveDown(0.5);

        this.doc
          .fontSize(16)
          .font('Helvetica')
          .text('INVIGILATOR SHEET', { align: 'center' })
          .moveDown(1);

        this.doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Exam Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
          .moveDown(2);

        // Table headers
        const headers = ['S.No', 'Roll No', 'Name', 'Course', 'Category', 'Signature'];
        const startX = 50;
        const startY = this.doc.y;
        const colWidth = 80;

        headers.forEach((header, index) => {
          this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(header, startX + (index * colWidth), startY);
        });

        this.doc.moveDown(1);

        // Application data
        applications.forEach((app, index) => {
          const rowY = this.doc.y;
          
          this.doc
            .fontSize(9)
            .font('Helvetica')
            .text((index + 1).toString(), startX, rowY)
            .text(app.applicationNumber || 'N/A', startX + colWidth, rowY)
            .text(app.personalDetails.fullName, startX + (colWidth * 2), rowY)
            .text(app.courseType === 'bpharm' ? 'BPharm' : 'MPharm', startX + (colWidth * 3), rowY)
            .text(app.personalDetails.category, startX + (colWidth * 4), rowY)
            .text('', startX + (colWidth * 5), rowY); // Signature column

          this.doc.moveDown(0.8);
        });

        this.doc.end();

        stream.on('finish', () => {
          resolve({
            filename,
            filepath,
            success: true
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFGenerator; 