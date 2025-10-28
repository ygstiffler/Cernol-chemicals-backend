require('dotenv').config();
const sgMail = require('@sendgrid/mail');

/**
 * Email Service for handling all email communications
 * Uses SendGrid exclusively for sending emails
 */
class EmailService {
  constructor() {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is required in environment variables');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.sgMail = sgMail;
    console.log('SendGrid email service initialized successfully');
  }

  /**
   * Send confirmation email to the user
   * @param {Object} contactData - User contact information
   * @returns {Promise<Object>} - Result of the email sending operation
   */
  async sendConfirmationEmail(contactData) {
    if (!contactData || !contactData.email || !contactData.subject) {
      const errorMsg = 'Invalid contact data for confirmation email';
      console.error(errorMsg, contactData);
      return { success: false, error: errorMsg };
    }

    const emailSubject = `Thank you for contacting Cernol Chemicals - ${contactData.subject}`;
    const fromEmail = process.env.EMAIL_FROM || 'harrisonchapeta44@gmail.com';
    
    try {
      const msg = {
        to: contactData.email,
        from: {
          email: fromEmail,
          name: 'Cernol Chemicals'
        },
        replyTo: process.env.ADMIN_EMAIL || fromEmail,
        subject: emailSubject,
        html: this.getConfirmationEmailTemplate(contactData)
      };

      console.log(`Sending confirmation email to: ${contactData.email}`);
      const [response] = await this.sgMail.send(msg);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        const messageId = response.headers['x-message-id'];
        console.log(`Confirmation email sent successfully. Message ID: ${messageId}`);
        return { 
          success: true, 
          messageId: messageId,
          service: 'SendGrid'
        };
      } else {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }
    } catch (error) {
      const errorMsg = `Error sending confirmation email: ${error.message}`;
      console.error(errorMsg);
      console.error('Error details:', error);
      
      return { 
        success: false, 
        error: errorMsg,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get confirmation email HTML template
   */
  getConfirmationEmailTemplate(contactData) {
    if (!contactData) return '';
    
    const currentYear = new Date().getFullYear();
    const logoUrl = 'https://cernol.co.zw/wp-content/uploads/2023/03/Cernol-Chemicals-Logo-1.png';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank you for contacting Cernol Chemicals</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { max-width: 200px; height: auto; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body style="margin: 0; padding: 20px 0; background-color: #f5f7fa;">
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Cernol Chemicals Logo" class="logo">
        </div>
        
        <div class="content">
          <h2>Thank you for contacting Cernol Chemicals</h2>
          <p>Dear ${contactData.firstName || 'Valued Customer'},</p>
          
          <p>We have received your message and our team will get back to you shortly.</p>
          
          <p><strong>Your Message:</strong></p>
          <p>${contactData.message || 'No message provided'}</p>
          
          <p>If you have any urgent inquiries, please don't hesitate to contact us directly.</p>
          
          <p>Best regards,<br>The Cernol Chemicals Team</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${currentYear} Cernol Chemicals. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

// Export a singleton instance
module.exports = new EmailService();
