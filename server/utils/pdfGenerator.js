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

  // Generate admit card PDF
  async generateAdmitCard(applicationData, admitCardData) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `admit-card-${applicationData.applicationNumber}-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, '../uploads', filename);
        const stream = fs.createWriteStream(filepath);

        this.doc.pipe(stream);

        // Header
        this.doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('SELFKY INSTITUTE OF PHARMACY', { align: 'center' })
          .moveDown(0.5);

        this.doc
          .fontSize(16)
          .font('Helvetica')
          .text('ADMIT CARD', { align: 'center' })
          .moveDown(2);

        // Add photo if available
        if (applicationData.documents && applicationData.documents.photo) {
          try {
            let photoPath;
            // Handle both old format (full path) and new format (just filename)
            if (applicationData.documents.photo.includes(path.sep)) {
              // Old format: full path
              photoPath = applicationData.documents.photo;
            } else {
              // New format: just filename
              photoPath = path.join(__dirname, '../uploads', applicationData.documents.photo);
            }
            
            if (fs.existsSync(photoPath)) {
              // Add photo to the right side of header
              this.doc
                .image(photoPath, 450, 80, { width: 80, height: 100 })
                .moveDown(0.5);
            }
          } catch (photoError) {
            console.error('Error adding photo to PDF:', photoError);
          }
        }

        // Application Details
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('APPLICANT DETAILS', { underline: true })
          .moveDown(1);

        const details = [
          ['Application Number:', applicationData.applicationNumber],
          ['Roll Number:', admitCardData.rollNumber],
          ['Full Name:', applicationData.personalDetails.fullName],
          ['Father\'s Name:', applicationData.personalDetails.fathersName],
          ['Category:', applicationData.personalDetails.category],
          ['Date of Birth:', new Date(applicationData.personalDetails.dateOfBirth).toLocaleDateString()],
          ['Course:', applicationData.courseType === 'bpharm' ? 'BPharm (Ay.)' : 'MPharm (Ay.)']
        ];

        details.forEach(([label, value]) => {
          this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(`: ${value}`)
            .moveDown(0.5);
        });

        this.doc.moveDown(1);

        // Examination Details
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('EXAMINATION DETAILS', { underline: true })
          .moveDown(1);

        const examDetails = [
          ['Exam Date:', new Date(admitCardData.examDate).toLocaleDateString()],
          ['Exam Time:', admitCardData.examTime],
          ['Exam Center:', admitCardData.examCenter],
          ['Center Address:', admitCardData.examCenterAddress]
        ];

        examDetails.forEach(([label, value]) => {
          this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(`: ${value}`)
            .moveDown(0.5);
        });

        this.doc.moveDown(2);

        // Instructions
        this.doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('IMPORTANT INSTRUCTIONS', { underline: true })
          .moveDown(1);

        const instructions = [
          '1. Please arrive at the exam center 1 hour before the exam time',
          '2. Carry this admit card and a valid photo ID proof',
          '3. No electronic devices are allowed in the examination hall',
          '4. Follow all COVID-19 protocols as per government guidelines',
          '5. Bring your own stationery (pen, pencil, eraser)',
          '6. Dress code: Formal attire'
        ];

        instructions.forEach(instruction => {
          this.doc
            .fontSize(10)
            .font('Helvetica')
            .text(instruction)
            .moveDown(0.3);
        });

        this.doc.moveDown(2);

        // Footer
        this.doc
          .fontSize(10)
          .font('Helvetica')
          .text('Generated on: ' + new Date().toLocaleString(), { align: 'center' })
          .moveDown(1);

        this.doc
          .fontSize(8)
          .text('This is a computer generated document. No signature required.', { align: 'center' });

        // Add signature if available
        if (applicationData.documents && applicationData.documents.signature) {
          try {
            let signaturePath;
            // Handle both old format (full path) and new format (just filename)
            if (applicationData.documents.signature.includes(path.sep)) {
              // Old format: full path
              signaturePath = applicationData.documents.signature;
            } else {
              // New format: just filename
              signaturePath = path.join(__dirname, '../uploads', applicationData.documents.signature);
            }
            if (fs.existsSync(signaturePath)) {
              // Add signature at the bottom
              this.doc
                .image(signaturePath, 100, this.doc.y + 20, { width: 60, height: 30 })
                .moveDown(1);
            }
          } catch (signatureError) {
            console.error('Error adding signature to PDF:', signatureError);
          }
        }

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
            .text(app.admitCard?.rollNumber || 'N/A', startX + colWidth, rowY)
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