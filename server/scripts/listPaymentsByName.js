#!/usr/bin/env node
/*
  List all payments for an applicant by full name (case-insensitive).

  Usage:
    node server/scripts/listPaymentsByName.js "Anjali Yadav"

  Env vars used for DB connection:
    MONGODB_URI (preferred) or MONGO_URI
*/

/* eslint-disable no-console */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Application = require('../models/Application');
const Payment = require('../models/Payment');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/selfky';

async function main() {
  const nameArg = (process.argv[2] || '').trim();
  if (!nameArg) {
    console.error('Usage: node server/scripts/listPaymentsByName.js "Full Name"');
    process.exit(1);
  }

  const regex = new RegExp(`^${nameArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 60000,
    });

    // Find applications for the given name
    const applications = await Application.find({ 'personalDetails.fullName': { $regex: regex } })
      .select('_id applicationNumber courseType personalDetails.fullName payment')
      .lean();

    if (applications.length === 0) {
      console.log('No applications found for name:', nameArg);
      return;
    }

    console.log(`Found ${applications.length} application(s) for: ${nameArg}`);

    const appIds = applications.map(a => a._id);
    const payments = await Payment.find({ applicationId: { $in: appIds } })
      .sort({ createdAt: 1 })
      .lean();

    for (const app of applications) {
      console.log('------------------------------------------------------------');
      console.log('Applicant Name      :', app.personalDetails?.fullName || 'N/A');
      console.log('Application Number  :', app.applicationNumber);
      console.log('Course Type         :', app.courseType);
      console.log('App Payment Status  :', app.payment?.status || 'N/A');
      console.log('App Transaction ID  :', app.payment?.transactionId || 'N/A');

      const rows = payments.filter(p => String(p.applicationId) === String(app._id));
      if (rows.length === 0) {
        console.log('Payments            : none');
      } else {
        console.log(`Payments            : ${rows.length}`);
        rows.forEach((p, i) => {
          console.log(`  ${i + 1}. status=${p.status} amount=₹${p.amount} orderId=${p.razorpayOrderId || 'N/A'} paymentId=${p.razorpayPaymentId || 'N/A'} created=${p.createdAt ? new Date(p.createdAt).toISOString() : 'N/A'}`);
        });
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}


