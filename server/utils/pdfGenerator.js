const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
  }

  // Helper function to format date as dd/mm/yyyy
  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Generate admit card PDF
  async generateAdmitCard(applicationData, admitCardData) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `admit-card-${applicationData.applicationNumber}-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../uploads', filename);
        const stream = fs.createWriteStream(filepath);

        this.doc.pipe(stream);

        // Header Section
        this.doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('BANARAS HINDU UNIVERSITY', { align: 'center' })
          .moveDown(0.5);

        this.doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('ADMIT CARD', { align: 'center' })
          .moveDown(0.5);

        // Course name
        const courseName = applicationData.courseType === 'bpharm' ? 'Bachelor of Pharmacy (Ayurveda) 2025' : 'Master of Pharmacy (Ayurveda) 2025';
        this.doc
          .fontSize(14)
          .font('Helvetica')
          .text(courseName, { align: 'center' })
          .moveDown(2);

        // Application Details Table
        this.doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('APPLICANT DETAILS', { underline: true })
          .moveDown(1);

        // Create applicant details table
        const applicantTable = [
          ['Application Number:', admitCardData.applicationNumber],
          ['Full Name:', applicationData.personalDetails.fullName],
          ['Father\'s Name:', applicationData.personalDetails.fathersName],
          ['Category:', applicationData.personalDetails.category],
          ['Date of Birth:', this.formatDate(applicationData.personalDetails.dateOfBirth)]
        ];

        this.createTable(applicantTable, 50, this.doc.y, 500, 20);
        this.doc.moveDown(2);

        // Examination Details Table
        this.doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('EXAMINATION DETAILS', { underline: true })
          .moveDown(1);

        const examTable = [
          ['Exam Date:', this.formatDate(admitCardData.examDate)],
          ['Exam Time:', admitCardData.examTime],
          ['Exam Center:', admitCardData.examCenter],
          ['Center Address:', admitCardData.examCenterAddress]
        ];

        this.createTable(examTable, 50, this.doc.y, 500, 20);
        this.doc.moveDown(2);

        // Instructions Table
        this.doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('IMPORTANT INSTRUCTIONS', { underline: true })
          .moveDown(1);

        // Use dynamic instructions if available, otherwise use default
        const instructions = admitCardData.instructions || [
          'Please arrive at the exam center 1 hour before the exam time',
          'Carry this admit card and a valid photo ID proof',
          'No electronic devices are allowed in the examination hall',
          'Follow all COVID-19 protocols as per government guidelines',
          'Bring your own stationery (pen, pencil, eraser)',
          'Dress code: Formal attire'
        ];

        // Create instructions table
        const instructionRows = instructions.map((instruction, index) => [`${index + 1}.`, instruction]);
        this.createTable(instructionRows, 50, this.doc.y, 500, 15);
        this.doc.moveDown(2);

        // Signature Section
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('SIGNATURE SECTION', { underline: true })
          .moveDown(1);

        // Create signature table
        const signatureTable = [
          ['Applicant\'s Signature:', '_________________'],
          ['Authorized Signature:', '_________________'],
          ['Date:', '_________________']
        ];

        this.createTable(signatureTable, 50, this.doc.y, 500, 30);
        this.doc.moveDown(2);

        // Footer
        this.doc
          .fontSize(10)
          .font('Helvetica')
          .text('Generated on: ' + new Date().toLocaleString(), { align: 'center' })
          .moveDown(1);

        this.doc
          .fontSize(8)
          .text('This is a computer generated document. No signature required.', { align: 'center' })
          .moveDown(1);

        // Powered by Selfky
        this.doc
          .fontSize(8)
          .font('Helvetica')
          .text('Powered by Selfky', { align: 'center' });

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

  // Helper method to create tables
  createTable(data, x, y, width, rowHeight) {
    const colWidth = width / 2;
    
    data.forEach((row, index) => {
      const rowY = y + (index * rowHeight);
      
      // Draw cell borders
      this.doc
        .rect(x, rowY, colWidth, rowHeight)
        .rect(x + colWidth, rowY, colWidth, rowHeight)
        .stroke();
      
      // Add text
      this.doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(row[0], x + 5, rowY + 5)
        .font('Helvetica')
        .text(row[1], x + colWidth + 5, rowY + 5);
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
          .text('BANARAS HINDU UNIVERSITY', { align: 'center' })
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
        const headers = ['S.No', 'Application No', 'Name', 'Course', 'Category', 'Signature'];
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