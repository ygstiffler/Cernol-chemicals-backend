require('dotenv').config();
const emailService = require('./services/emailServiceSendGrid');

async function testSendGrid() {
  try {
    console.log('Testing SendGrid email service...');
    
    // Test data
    const testData = {
      firstName: 'Test',
      email: process.env.ADMIN_EMAIL || 'test@example.com',
      subject: 'Test Email from Cernol',
      message: 'This is a test email to verify the SendGrid email service.'
    };

    console.log('Sending test email to:', testData.email);
    const result = await emailService.sendConfirmationEmail(testData);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error in test script:');
    console.error(error);
  }
}

// Run the test
testSendGrid();
