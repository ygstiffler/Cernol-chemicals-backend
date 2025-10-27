const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send confirmation email to the user
  async sendConfirmationEmail(contactData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contactData.email,
        subject: `Thank you for contacting Cernol Chemicals - ${contactData.subject}`,
        html: this.getConfirmationEmailTemplate(contactData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification email to admin
  async sendAdminNotification(contactData) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Form Submission - ${contactData.subject}`,
        html: this.getAdminNotificationTemplate(contactData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Admin notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Email template for user confirmation
  getConfirmationEmailTemplate(contactData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thank you for contacting Cernol Chemicals</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .highlight { background: #e2e8f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Cernol Chemicals!</h1>
          </div>
          <div class="content">
            <p>Dear <strong>${contactData.firstName} ${contactData.lastName}</strong>,</p>

            <p>Thank you for reaching out to Cernol Chemicals! We've received your message and our team will get back to you within 24 hours.</p>

            <div class="highlight">
              <h3>Your Message Details:</h3>
              <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
              ${contactData.company ? `<p><strong>Company:</strong> ${contactData.company}</p>` : ''}
              <p><strong>Subject:</strong> ${contactData.subject}</p>
              <p><strong>Inquiry Type:</strong> ${this.getServiceDisplayName(contactData.service)}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <p>Here's a copy of your message:</p>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #334155;">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>

            <p>If you have any urgent questions, please don't hesitate to call us directly.</p>

            <p>Best regards,<br>The Cernol Chemicals Team</p>
          </div>
          <div class="footer">
            <p>Cernol Chemicals - Leading Chemical Solutions in Zimbabwe</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email template for admin notification
  getAdminNotificationTemplate(contactData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .contact-info { background: #e2e8f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .message { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #ef4444; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="contact-info">
              <h3>Contact Information:</h3>
              <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : '<p><strong>Phone:</strong> Not provided</p>'}
              ${contactData.company ? `<p><strong>Company:</strong> ${contactData.company}</p>` : ''}
              <p><strong>Subject:</strong> ${contactData.subject}</p>
              <p><strong>Inquiry Type:</strong> ${this.getServiceDisplayName(contactData.service)}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>

            <h3>Message:</h3>

            <div class="message">
              ${contactData.message.replace(/\n/g, '<br>')}
            </div>

            <p><strong>Action Required:</strong> Please respond to this inquiry within 24 hours.</p>
          </div>
          <div class="footer">
            <p>Cernol Chemicals Admin System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helper function to get display name for service
  getServiceDisplayName(serviceValue) {
    const serviceNames = {
      'general-inquiry': 'General Inquiry',
      'quote-request': 'Quote Request',
      'technical-support': 'Technical Support',
      'partnership': 'Partnership',
      'industrial-chemicals': 'Industrial Chemicals',
      'lab-supplies': 'Laboratory Supplies',
      'water-treatment': 'Water Treatment',
      'mining-chemicals': 'Mining Chemicals',
      'food-beverage': 'Food & Beverage',
      'consulting': 'Consulting'
    };
    return serviceNames[serviceValue] || serviceValue || 'Not specified';
  }

  // Helper function to get display name for industry
  getIndustryDisplayName(industryValue) {
    const industryNames = {
      'mining': 'Mining',
      'manufacturing': 'Manufacturing',
      'agriculture': 'Agriculture',
      'water-treatment': 'Water Treatment',
      'food-beverage': 'Food & Beverage',
      'pharmaceuticals': 'Pharmaceuticals',
      'textiles': 'Textiles',
      'other': 'Other'
    };
    return industryNames[industryValue] || industryValue || 'Not specified';
  }

  // Helper function to get display name for budget
  getBudgetDisplayName(budgetValue) {
    const budgetNames = {
      'under-1000': 'Under $1,000',
      '1000-5000': '$1,000 - $5,000',
      '5000-10000': '$5,000 - $10,000',
      '10000-25000': '$10,000 - $25,000',
      'over-25000': 'Over $25,000'
    };
    return budgetNames[budgetValue] || budgetValue || 'Not specified';
  }

  // Helper function to get display name for timeline
  getTimelineDisplayName(timelineValue) {
    const timelineNames = {
      'urgent': 'Urgent (1-2 weeks)',
      'normal': 'Normal (1 month)',
      'flexible': 'Flexible (2+ months)'
    };
    return timelineNames[timelineValue] || timelineValue || 'Not specified';
  }

  // Send quote confirmation email to the user
  async sendQuoteConfirmation(quoteData) {
    try {
      const servicesList = Array.isArray(quoteData.services)
        ? quoteData.services.map(service => this.getServiceDisplayName(service)).join(', ')
        : 'Not specified';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: quoteData.email,
        subject: 'Quote Request Received - Cernol Chemicals',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Thank you for your quote request!</h2>
            <p>Dear ${quoteData.firstName} ${quoteData.lastName},</p>
            <p>Thank you for your interest in Cernol Chemicals. We have received your quote request and our team will review it carefully.</p>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Request Summary:</h3>
              <p><strong>Company:</strong> ${quoteData.company}</p>
              <p><strong>Services:</strong> ${servicesList}</p>
              <p><strong>Budget:</strong> ${this.getBudgetDisplayName(quoteData.budget)}</p>
              <p><strong>Timeline:</strong> ${this.getTimelineDisplayName(quoteData.timeline)}</p>
            </div>

            <p>Our technical team will analyze your requirements and get back to you within 24 hours with a detailed quote.</p>

            <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>

            <p>Best regards,<br>The Cernol Chemicals Team</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Quote confirmation email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending quote confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send quote notification email to admin
  async sendQuoteAdminNotification(quoteData) {
    try {
      const servicesList = Array.isArray(quoteData.services)
        ? quoteData.services.map(service => this.getServiceDisplayName(service)).join(', ')
        : 'Not specified';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Quote Request - ${quoteData.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">New Quote Request Received</h2>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Client Information:</h3>
              <p><strong>Name:</strong> ${quoteData.firstName} ${quoteData.lastName}</p>
              <p><strong>Email:</strong> ${quoteData.email}</p>
              <p><strong>Phone:</strong> ${quoteData.phone || 'Not provided'}</p>
              <p><strong>Company:</strong> ${quoteData.company}</p>
              <p><strong>Industry:</strong> ${quoteData.industry || 'Not specified'}</p>
              <p><strong>Address:</strong> ${quoteData.address || 'Not provided'}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Project Requirements:</h3>
              <p><strong>Services:</strong> ${servicesList}</p>
              <p><strong>Budget:</strong> ${this.getBudgetDisplayName(quoteData.budget)}</p>
              <p><strong>Timeline:</strong> ${this.getTimelineDisplayName(quoteData.timeline)}</p>
              <p><strong>Requirements:</strong> ${quoteData.requirements || 'Not provided'}</p>
              <p><strong>Newsletter:</strong> ${quoteData.newsletter ? 'Yes' : 'No'}</p>
            </div>

            <p><strong>Submitted:</strong> ${new Date(quoteData.createdAt).toLocaleString()}</p>

            <p>Please review this request and prepare a quote response.</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Quote admin notification sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending quote admin notification:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
