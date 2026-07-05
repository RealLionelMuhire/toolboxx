import { Resend } from 'resend';

const resend = new Resend('<YOUR_RESEND_API_KEY>');

console.log('🔍 Checking recent email activity...\n');

try {
  // Get recent emails
  const emails = await resend.emails.list({ limit: 10 });
  
  console.log('📊 Recent emails sent:\n');
  
  if (emails.data && emails.data.data) {
    emails.data.data.forEach((email, index) => {
      console.log(`${index + 1}. Email ID: ${email.id}`);
      console.log(`   To: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Status: ${email.last_event || 'pending'}`);
      console.log(`   Created: ${email.created_at}`);
      console.log('');
    });
  } else {
    console.log('No emails found or unexpected response format');
    console.log('Response:', JSON.stringify(emails, null, 2));
  }
  
} catch (error) {
  console.error('❌ Error checking emails:', error.message);
  console.log('\nThis might mean:');
  console.log('1. API key might not have permission to list emails');
  console.log('2. Account might need verification');
  console.log('3. Domain verification might be required\n');
  
  console.log('Full error:', error);
}
