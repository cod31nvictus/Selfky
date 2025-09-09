#!/usr/bin/env node
/*
  Detect duplicate successful payments for a single application.

  How it works:
  - Scans the `payments` collection for documents with status === 'completed'
    and a non-null `razorpayPaymentId`.
  - Groups by `applicationId` and flags groups with count > 1 as duplicates.
  - Fetches the corresponding application's `applicationNumber` for reporting.

  Run locally/production:
    NODE_ENV=production node server/scripts/checkDuplicatePayments.js

  It uses the same Mongo connection envs as the app:
    - MONGODB_URI (preferred)
    - MONGO_URI (fallback)
*/

/* eslint-disable no-console */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Payment = require('../models/Payment');
const Application = require('../models/Application');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/selfky';

async function connect() {
  await mongoose.connect(MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 60000,
  });
}

async function findDuplicateSuccessfulPayments() {
  const pipeline = [
    {
      $match: {
        status: 'completed',
        razorpayPaymentId: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$applicationId',
        count: { $sum: 1 },
        payments: {
          $push: {
            razorpayPaymentId: '$razorpayPaymentId',
            razorpayOrderId: '$razorpayOrderId',
            amount: '$amount',
            createdAt: '$createdAt',
            receipt: '$receipt',
          },
        },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
    { $sort: { count: -1 } },
  ];

  return Payment.aggregate(pipeline);
}

async function main() {
  const startedAt = new Date();
  console.log('=== Duplicate Successful Payments Checker ===');
  console.log('Started at:', startedAt.toISOString());

  try {
    await connect();
    console.log('Connected to MongoDB:', MONGO_URI.replace(/:\\w+@/, ':****@'));

    const duplicates = await findDuplicateSuccessfulPayments();

    if (!duplicates || duplicates.length === 0) {
      console.log('✅ No duplicate successful payments found.');
      return;
    }

    console.log(`❌ Found ${duplicates.length} application(s) with duplicate successful payments.`);
    console.log('');

    // Fetch application numbers for all duplicates in one go
    const appIds = duplicates.map((d) => d._id);
    const applications = await Application.find({ _id: { $in: appIds } }, 'applicationNumber courseType personalDetails.fullName')
      .lean();
    const appIdToInfo = new Map(applications.map((a) => [String(a._id), a]));

    let totalExtraPayments = 0;
    for (const dup of duplicates) {
      const appInfo = appIdToInfo.get(String(dup._id));
      const applicationNumber = appInfo?.applicationNumber || 'N/A';
      const applicantName = appInfo?.personalDetails?.fullName || 'N/A';
      const courseType = appInfo?.courseType || 'N/A';

      // Extra payments beyond the first
      totalExtraPayments += (dup.count - 1);

      console.log('------------------------------------------------------------');
      console.log('Application Number  :', applicationNumber);
      console.log('Applicant Name      :', applicantName);
      console.log('Course Type         :', courseType);
      console.log('Duplicate Count     :', dup.count);
      console.log('Successful Payments :');
      dup.payments
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .forEach((p, idx) => {
          console.log(`  ${idx + 1}. PaymentID=${p.razorpayPaymentId || 'NULL'} | OrderID=${p.razorpayOrderId} | Amount=₹${p.amount} | Created=${new Date(p.createdAt).toISOString()}`);
        });
      console.log('');
    }

    console.log('Summary:');
    console.log('  Duplicate applications   :', duplicates.length);
    console.log('  Total extra payments     :', totalExtraPayments);
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Finished at:', new Date().toISOString());
  }
}

if (require.main === module) {
  main();
}

module.exports = { findDuplicateSuccessfulPayments };


