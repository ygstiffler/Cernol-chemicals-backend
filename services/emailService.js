const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Use SendGrid if available, fallback to Gmail
    if (process.env.SENDGRID_API_KEY) {
      this.useSendGrid = true;
      this.sgMail = require('@sendgrid/mail');
      this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      this.useSendGrid = false;
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
  }

  // Send confirmation email to the user
  async sendConfirmationEmail(contactData) {
    try {
      if (this.useSendGrid) {
        const msg = {
          to: contactData.email,
          from: process.env.EMAIL_USER,
          subject: `Thank you for contacting Cernol Chemicals - ${contactData.subject}`,
          html: this.getConfirmationEmailTemplate(contactData)
        };
        const info = await this.sgMail.send(msg);
        console.log('Confirmation email sent via SendGrid:', info[0].headers['x-message-id']);
        return { success: true, messageId: info[0].headers['x-message-id'] };
      } else {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: contactData.email,
          subject: `Thank you for contacting Cernol Chemicals - ${contactData.subject}`,
          html: this.getConfirmationEmailTemplate(contactData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification email to admin
  async sendAdminNotification(contactData) {
    try {
      if (this.useSendGrid) {
        const msg = {
          to: process.env.ADMIN_EMAIL,
          from: process.env.EMAIL_USER,
          subject: `New Contact Form Submission - ${contactData.subject}`,
          html: this.getAdminNotificationTemplate(contactData)
        };
        const info = await this.sgMail.send(msg);
        console.log('Admin notification sent via SendGrid:', info[0].headers['x-message-id']);
        return { success: true, messageId: info[0].headers['x-message-id'] };
      } else {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `New Contact Form Submission - ${contactData.subject}`,
          html: this.getAdminNotificationTemplate(contactData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Admin notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error('Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Email template for user confirmation
  getConfirmationEmailTemplate(contactData) {
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Poppins', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f5f7fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #0056b3 0%, #003366 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .logo {
          max-width: 180px;
          height: auto;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px;
          color: #4a5568;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8fafc;
          color: #718096;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .highlight-box {
          background: #f8fafc;
          border-left: 4px solid #3182ce;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 4px 4px 0;
        }
        .message-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          line-height: 1.7;
        }
        .btn-primary {
          display: inline-block;
          background: #3182ce;
          color: white !important;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 4px;
          font-weight: 500;
          margin: 15px 0;
        }
        .social-icons {
          margin: 25px 0 15px;
        }
        .social-icon {
          display: inline-block;
          margin: 0 8px;
          color: #4a5568;
          text-decoration: none;
          font-size: 20px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0;
          }
          .content, .header {
            padding: 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px 0; background-color: #f5f7fa;">
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="${logoUrl}" alt="Cernol Chemicals Logo" class="logo">
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <h2 style="color: #2d3748; margin-top: 0;">Thank You for Contacting Us, ${contactData.firstName}!</h2>
          
          <p>We've received your message and our team will review it shortly. Here's a summary of your inquiry:</p>
          
          <div class="highlight-box">
            <h3 style="margin-top: 0; color: #2d3748; font-size: 18px;">Inquiry Details</h3>
            <table cellpadding="0" cellspacing="0" style="width: 100%;">
              <tr>
                <td style="width: 100px; padding: 5px 0; color: #718096;">Name:</td>
                <td style="padding: 5px 0; font-weight: 500;">${contactData.firstName} ${contactData.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #718096;">Email:</td>
                <td style="padding: 5px 0; font-weight: 500;">${contactData.email}</td>
              </tr>
              ${contactData.phone ? `
              <tr>
                <td style="padding: 5px 0; color: #718096;">Phone:</td>
                <td style="padding: 5px 0; font-weight: 500;">${contactData.phone}</td>
              </tr>
              ` : ''}
              ${contactData.company ? `
              <tr>
                <td style="padding: 5px 0; color: #718096;">Company:</td>
                <td style="padding: 5px 0; font-weight: 500;">${contactData.company}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 5px 0; color: #718096;">Subject:</td>
                <td style="padding: 5px 0; font-weight: 500;">${contactData.subject}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #718096;">Inquiry Type:</td>
                <td style="padding: 5px 0; font-weight: 500;">${this.getServiceDisplayName(contactData.service)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #718096;">Date:</td>
                <td style="padding: 5px 0; font-weight: 500;">${new Date().toLocaleString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</td>
              </tr>
            </table>
          </div>
          
          <h4 style="margin-bottom: 10px; color: #2d3748;">Your Message:</h4>
          <div class="message-box">
            ${contactData.message.replace(/\n/g, '<br>')}
          </div>
          
          <p style="margin: 25px 0 15px;">We'll respond to your inquiry as soon as possible, typically within 24 hours. For urgent matters, please don't hesitate to contact us directly.</p>
          
          <a href="tel:+263242775211" class="btn-primary" style="background: #3182ce; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; display: inline-block; margin: 10px 10px 10px 0;">
            Call Us Now
          </a>
          <a href="mailto:info@cernol.co.zw" class="btn-primary" style="background: #2c5282; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; display: inline-block; margin: 10px 0;">
            Email Us
          </a>
          
          <div class="social-icons">
            <a href="https://www.facebook.com/cernolchemicals" target="_blank" class="social-icon" style="color: #3b5998;">
              <i class="fab fa-facebook"></i>
            </a>
            <a href="https://www.linkedin.com/company/cernol-chemicals" target="_blank" class="social-icon" style="color: #0077b5;">
              <i class="fab fa-linkedin"></i>
            </a>
            <a href="https://twitter.com/cernolchemicals" target="_blank" class="social-icon" style="color: #1da1f2;">
              <i class="fab fa-twitter"></i>
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0 0 10px 0;">© ${currentYear} Cernol Chemicals (Pvt) Ltd. All rights reserved.</p>
          <p style="margin: 0; font-size: 12px; color: #a0aec0;">
            This email was sent to ${contactData.email} because you contacted us through our website.
          </p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #a0aec0;">
            <a href="https://cernol.co.zw/privacy-policy" style="color: #4a5568; text-decoration: none;">Privacy Policy</a> | 
            <a href="https://cernol.co.zw/terms" style="color: #4a5568; text-decoration: none;">Terms of Service</a> | 
            <a href="#" style="color: #4a5568; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Email template for admin notification
  getAdminNotificationTemplate(contactData) {
    const currentYear = new Date().getFullYear();
    const logoUrl = 'https://cernol.co.zw/wp-content/uploads/2023/03/Cernol-Chemicals-Logo-1.png';
    const faviconUrl = 'https://cernol.co.zw/wp-content/uploads/2023/03/cropped-cernol-favicon-32x32.png';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission - Cernol Chemicals</title>
      <link rel="icon" href="${faviconUrl}" type="image/x-icon">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Poppins', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          background-color: #f5f7fa;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          padding: 25px 20px;
          text-align: center;
          color: white;
        }
        .logo {
          max-width: 180px;
          height: auto;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px;
          color: #4a5568;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f8fafc;
          color: #718096;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .alert-badge {
          display: inline-block;
          background: #ef4444;
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .info-card {
          background: #f8fafc;
          border-left: 4px solid #3182ce;
          padding: 15px;
          border-radius: 4px;
        }
        .info-label {
          font-size: 13px;
          color: #718096;
          margin-bottom: 5px;
        }
        .info-value {
          font-weight: 500;
          color: #2d3748;
          word-break: break-all;
        }
        .message-box {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 6px;
          padding: 20px;
          margin: 25px 0;
          line-height: 1.7;
          color: #4a5568;
        }
        .action-buttons {
          margin: 25px 0 15px;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
          margin: 0 5px 10px;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: #3182ce;
          color: white !important;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748 !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            border-radius: 0;
          }
          .content, .header {
            padding: 20px !important;
          }
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px 0; background-color: #f5f7fa;">
      <div class="container">
        <!-- Header with Logo -->
        <div class="header">
          <img src="${logoUrl}" alt="Cernol Chemicals Logo" class="logo">
          <div class="alert-badge">New Contact Submission</div>
          <h1 style="margin: 10px 0 5px; font-size: 24px;">You have a new message from ${contactData.firstName} ${contactData.lastName}</h1>
          <p style="margin: 0; opacity: 0.9;">Submitted on ${new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Name</div>
              <div class="info-value">${contactData.firstName} ${contactData.lastName}</div>
            </div>
            
            <div class="info-card">
              <div class="info-label">Email</div>
              <div class="info-value">${contactData.email}</div>
            </div>
            
            <div class="info-card">
              <div class="info-label">Phone</div>
              <div class="info-value">${contactData.phone || 'Not provided'}</div>
            </div>
            
            ${contactData.company ? `
            <div class="info-card">
              <div class="info-label">Company</div>
              <div class="info-value">${contactData.company}</div>
            </div>
            ` : ''}
            
            <div class="info-card">
              <div class="info-label">Inquiry Type</div>
              <div class="info-value">${this.getServiceDisplayName(contactData.service)}</div>
            </div>
            
            <div class="info-card">
              <div class="info-label">Subject</div>
              <div class="info-value">${contactData.subject || 'No subject'}</div>
            </div>
          </div>
          
          <h3 style="color: #2d3748; margin: 25px 0 10px;">Message:</h3>
          <div class="message-box">
            ${contactData.message.replace(/\n/g, '<br>')}
          </div>
          
          <div class="action-buttons">
            <a href="mailto:${contactData.email}?subject=Re: ${encodeURIComponent(contactData.subject || 'Your Inquiry')}" class="btn btn-primary">
              Reply to ${contactData.firstName}
            </a>
            <a href="${process.env.ADMIN_PANEL_URL || '#'}" class="btn btn-secondary">
              View in Admin Panel
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin: 20px 0 0; text-align: center;">
            <strong>Action Required:</strong> Please respond to this inquiry within 24 hours.
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0 0 10px 0;">© ${currentYear} Cernol Chemicals (Pvt) Ltd. All rights reserved.</p>
          <p style="margin: 0; font-size: 12px; color: #a0aec0;">
            This is an automated notification. Do not reply to this email.
          </p>
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
      if (this.useSendGrid) {
        const msg = {
          to: quoteData.email,
          from: process.env.EMAIL_USER,
          subject: 'Quote Request Received - Cernol Chemicals',
          html: this.getQuoteConfirmationTemplate(quoteData)
        };
        const info = await this.sgMail.send(msg);
        console.log('Quote confirmation sent via SendGrid:', info[0].headers['x-message-id']);
        return { success: true, messageId: info[0].headers['x-message-id'] };
      } else {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: quoteData.email,
          subject: 'Quote Request Received - Cernol Chemicals',
          html: this.getQuoteConfirmationTemplate(quoteData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Quote confirmation sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error('Error sending quote confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send quote notification email to admin
  async sendQuoteAdminNotification(quoteData) {
    try {
      if (this.useSendGrid) {
        const msg = {
          to: process.env.ADMIN_EMAIL,
          from: process.env.EMAIL_USER,
          subject: `New Quote Request - ${quoteData.company}`,
          html: this.getQuoteAdminTemplate(quoteData)
        };
        const info = await this.sgMail.send(msg);
        console.log('Quote admin notification sent via SendGrid:', info[0].headers['x-message-id']);
        return { success: true, messageId: info[0].headers['x-message-id'] };
      } else {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `New Quote Request - ${quoteData.company}`,
          html: this.getQuoteAdminTemplate(quoteData)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log('Quote admin notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      }
    } catch (error) {
      console.error('Error sending quote admin notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Email template for quote confirmation
  getQuoteConfirmationTemplate(quoteData) {
    const servicesList = Array.isArray(quoteData.services)
      ? quoteData.services.map(service => this.getServiceDisplayName(service)).join(', ')
      : 'Not specified';

    return `
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
    `;
  }

  // Email template for quote admin notification
  getQuoteAdminTemplate(quoteData) {
    const servicesList = Array.isArray(quoteData.services)
      ? quoteData.services.map(service => this.getServiceDisplayName(service)).join(', ')
      : 'Not specified';

    return `
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
    `;
  }
}

module.exports = new EmailService();
