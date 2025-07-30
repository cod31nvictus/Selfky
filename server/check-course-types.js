require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkCourseTypes() {
  try {
    console.log('Checking all applications and their course types...');
    
    // Get all applications
    const allApps = await Application.find().populate('userId', 'email name');
    console.log(`Total applications found: ${allApps.length}`);
    
    // Group by course type
    const courseTypeStats = {};
    allApps.forEach(app => {
      const courseType = app.courseType || 'unknown';
      if (!courseTypeStats[courseType]) {
        courseTypeStats[courseType] = [];
      }
      courseTypeStats[courseType].push(app);
    });
    
    // Display statistics
    console.log('\n=== Course Type Statistics ===');
    Object.keys(courseTypeStats).forEach(courseType => {
      const count = courseTypeStats[courseType].length;
      console.log(`${courseType.toUpperCase()}: ${count} applications`);
      
      // Show first few applications for each course type
      courseTypeStats[courseType].slice(0, 5).forEach(app => {
        console.log(`  - ${app.applicationNumber}: ${app.userId?.email} (${app.personalDetails?.category})`);
      });
      
      if (count > 5) {
        console.log(`  ... and ${count - 5} more`);
      }
    });
    
    // Check for any applications with missing course type
    const appsWithMissingCourseType = allApps.filter(app => !app.courseType);
    if (appsWithMissingCourseType.length > 0) {
      console.log('\n⚠️  Applications with missing course type:');
      appsWithMissingCourseType.forEach(app => {
        console.log(`  - ${app.applicationNumber}: ${app.userId?.email}`);
      });
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total applications: ${allApps.length}`);
    console.log(`BPharm applications: ${courseTypeStats['bpharm']?.length || 0}`);
    console.log(`MPharm applications: ${courseTypeStats['mpharm']?.length || 0}`);
    console.log(`Other/Unknown: ${Object.keys(courseTypeStats).filter(ct => !['bpharm', 'mpharm'].includes(ct)).length}`);
    
  } catch (error) {
    console.error('Error checking course types:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkCourseTypes(); 