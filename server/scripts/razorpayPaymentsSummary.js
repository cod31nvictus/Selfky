#!/usr/bin/env node
/*
  Razorpay Successful Payments Summary

  Outputs:
    - Total successful (captured) payments count
    - Total captured amount
    - Total refunded amount (if any)
    - Net received = captured - refunded

  Usage:
    node server/scripts/razorpayPaymentsSummary.js                # last 365 days
    node server/scripts/razorpayPaymentsSummary.js 30             # last 30 days
    node server/scripts/razorpayPaymentsSummary.js 0 2025-01-01   # from 2025-01-01 to now
    node server/scripts/razorpayPaymentsSummary.js 0 2025-01-01 2025-09-09

  Env:
    RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET (required)
*/

/* eslint-disable no-console */
const Razorpay = require('razorpay');

function parseDateToEpochMs(dateStr) {
  return Math.floor(new Date(dateStr).getTime());
}

function getTimeRange(daysArg, fromArg, toArg) {
  const now = Date.now();
  if (fromArg) {
    const fromMs = parseDateToEpochMs(fromArg);
    const toMs = toArg ? parseDateToEpochMs(toArg) : now;
    return { from: Math.floor(fromMs / 1000), to: Math.floor(toMs / 1000) };
  }
  const days = Number.isFinite(+daysArg) && +daysArg > 0 ? +daysArg : 365;
  const from = Math.floor((now - days * 24 * 60 * 60 * 1000) / 1000);
  const to = Math.floor(now / 1000);
  return { from, to };
}

async function main() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    console.error('Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');
    process.exit(1);
  }

  const [daysArg, fromArg, toArg] = process.argv.slice(2);
  const { from, to } = getTimeRange(daysArg, fromArg, toArg);

  const rzp = new Razorpay({ key_id, key_secret });

  let capturedCount = 0;
  let capturedAmount = 0; // in paise
  let refundedAmount = 0; // in paise
  let currency = 'INR';

  const pageSize = 100;
  let skip = 0;

  console.log('Fetching Razorpay payments...');
  console.log('Range (epoch):', { from, to });

  // Paginate through payments
  /* eslint-disable no-constant-condition */
  while (true) {
    // payments.all returns up to 100
    // Filter by from/to; status filter is not supported directly, so filter client-side
    const res = await rzp.payments.all({ from, to, count: pageSize, skip });
    const items = res?.items || [];
    if (items.length === 0) break;

    for (const p of items) {
      if (p.currency) currency = p.currency;
      // Successful payments in Razorpay are status === 'captured'
      if (p.status === 'captured') {
        capturedCount += 1;
        capturedAmount += Number(p.amount || 0);
        refundedAmount += Number(p.amount_refunded || 0);
      }
    }

    if (items.length < pageSize) break;
    skip += pageSize;
  }

  const netAmount = capturedAmount - refundedAmount;

  function toCurrency(amountPaise) {
    return `${currency} ${ (amountPaise / 100).toFixed(2) }`;
  }

  console.log('--- Razorpay Successful Payments Summary ---');
  console.log('Time Range        :', new Date(from * 1000).toISOString(), 'to', new Date(to * 1000).toISOString());
  console.log('Successful Count  :', capturedCount);
  console.log('Total Captured    :', toCurrency(capturedAmount));
  console.log('Total Refunded    :', toCurrency(refundedAmount));
  console.log('Net Received      :', toCurrency(netAmount));
}

main().catch(err => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});


