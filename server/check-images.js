require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const fs = require('fs');
const path = require('path');

async function checkImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/selfky');
    console.log('Connected to MongoDB');

    // Find the application with roll number RN1603
    const application = await Application.findOne({
      'admitCard.rollNumber': 'RN1603'
    });

    if (!application) {
      console.log('No application found with roll number RN1603');
      return;
    }

    console.log('Application found:');
    console.log('Application Number:', application.applicationNumber);
    console.log('Roll Number:', application.admitCard?.rollNumber);
    console.log('Course Type:', application.courseType);
    console.log('Documents:', application.documents);

    // Check if photo file exists
    if (application.documents?.photo) {
      const photoPath = path.join(__dirname, 'uploads', application.documents.photo);
      console.log('Photo path:', photoPath);
      console.log('Photo file exists:', fs.existsSync(photoPath));
    } else {
      console.log('No photo document found');
    }

    // Check if signature file exists
    if (application.documents?.signature) {
      const signaturePath = path.join(__dirname, 'uploads', application.documents.signature);
      console.log('Signature path:', signaturePath);
      console.log('Signature file exists:', fs.existsSync(signaturePath));
    } else {
      console.log('No signature document found');
    }

    // List all files in uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads directory:', files);
    } else {
      console.log('Uploads directory does not exist');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkImages(); 