#!/usr/bin/env node
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('📧 Testing SMTP Email Configuration...\n');

// Check required env variables
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('Configuration:');
console.log(`  Host: ${process.env.SMTP_HOST}`);
console.log(`  Port: ${process.env.SMTP_PORT}`);
console.log(`  User: ${process.env.SMTP_USER}`);
console.log(`  Pass: ${process.env.SMTP_PASS?.substring(0, 4)}****`);
console.log(`  From: ${process.env.SMTP_FROM_EMAIL}`);
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('🔍 Verifying SMTP connection...');

try {
  // Verify connection
  await transporter.verify();
  console.log('✅ SMTP connection verified!\n');
  
  // Send test email
  console.log('📤 Sending test email...');
  
  const info = await transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME || 'Toolbay'} <${process.env.SMTP_FROM_EMAIL}>`,
    to: process.env.SMTP_USER, // Send to yourself
    subject: '✅ Test Email from Toolbay - SMTP Working!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #000000; margin: 0;">✅ SMTP Configuration Working!</h1>
            </div>
            
            <p style="color: #333333; line-height: 1.6;">
              Your SMTP email configuration is working correctly. This test email was sent successfully from your Toolbay application.
            </p>
            
            <div style="background-color: #f4f4f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333333;">Configuration Details:</h3>
              <p style="margin: 5px 0; color: #666666;"><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>User:</strong> ${process.env.SMTP_USER}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL}</p>
              <p style="margin: 5px 0; color: #666666;"><strong>Sent at:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <p style="color: #666666; font-size: 14px; margin-top: 30px;">
              Email verification and password reset emails will now be delivered successfully! 🎉
            </p>
          </div>
        </body>
      </html>
    `,
  });
  
  console.log('✅ Test email sent successfully!');
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Accepted: ${info.accepted.join(', ')}`);
  console.log('');
  console.log('✅ SMTP Configuration is working correctly!');
  console.log('   Registration and password reset emails will be delivered.');
  
} catch (error) {
  console.error('❌ SMTP Test Failed:', error.message);
  console.error('');
  console.error('Common issues:');
  console.error('  1. Gmail App Password not generated or incorrect');
  console.error('  2. App Password has spaces (remove them)');
  console.error('  3. 2-Step Verification not enabled on Gmail account');
  console.error('  4. Using regular Gmail password instead of App Password');
  console.error('');
  console.error('Fix:');
  console.error('  1. Go to: https://myaccount.google.com/apppasswords');
  console.error('  2. Generate a new App Password for Mail');
  console.error('  3. Copy the 16-character password (remove spaces)');
  console.error('  4. Update SMTP_PASS in your .env file');
  console.error('  5. Restart the server');
  console.error('');
  process.exit(1);
}
