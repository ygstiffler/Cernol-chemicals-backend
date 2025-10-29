const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const validator = require('validator');
require('dotenv').config();

const Contact = require('./models/Contact');
const Quote = require('./models/Quote');
const emailService = require('./services/emailServiceSendGrid');
const InputSanitizer = require('./utils/inputSanitizer');

const app = express();
const PORT = process.env.PORT || 5000;

// Environment validation
console.log('🔧 Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- PORT:', PORT);
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Set (Atlas)' : 'Not set (using localhost)');

// Enhanced Email Service Status Check
console.log('📧 Email Service Status:');
if (process.env.SENDGRID_API_KEY) {
  console.log('  ✅ SendGrid API Key: Configured');
  console.log(`  📧 Sender Email: ${process.env.EMAIL_FROM || 'Not configured (EMAIL_FROM missing)'}`);
  console.log(`  👤 Admin Email: ${process.env.ADMIN_EMAIL || 'Not configured (ADMIN_EMAIL missing)'}`);
  
  // Test if email service is properly initialized
  let isEmailServiceReady = false;
  try {
    // Only initialize if not already done by the email service
    if (!process.sgMailInitialized) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      process.sgMailInitialized = true; // Mark as initialized
    }
    isEmailServiceReady = true;
    console.log('  🟢 Email Service: Ready to send emails');
  } catch (error) {
    console.error('  🔴 Email Service: Initialization failed -', error.message);
    // Don't throw here, let the application start but mark service as unavailable
  }
} else {
  console.log('  🔴 Email Service: Not configured (SENDGRID_API_KEY missing)');
}

// Validate critical environment variables
if (!process.env.ADMIN_EMAIL) {
  console.warn('  ⚠️ Warning: ADMIN_EMAIL not set, using fallback');
}

console.log('🚀 Starting Cernol Chemicals Backend Server...');

// Middleware with better error handling
app.use(cors());
app.use(bodyParser.json({
  limit: '10mb' // Increase payload limit
}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Additional CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Basic security middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// MongoDB connection with detailed logging
console.log('🔄 Connecting to MongoDB...');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cernol')
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:');
  console.error('   Error:', err.message);
  console.error('   Code:', err.code);
  console.error('   Name:', err.name);
  if (err.code === 11000) {
    console.error('   💡 This might be due to authentication or network issues');
  }
  console.error('🔧 Troubleshooting:');
  console.error('   1. Check your MongoDB Atlas password');
  console.error('   2. Verify your IP is whitelisted in Atlas');
  console.error('   3. Ensure Atlas cluster is running');
  process.exit(1);
});

// Email service test endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-email', async (req, res) => {
    try {
      // Test email configuration
      const testEmail = {
        firstName: 'Test',
        lastName: 'User',
        email: process.env.ADMIN_EMAIL || 'test@example.com',
        subject: 'Email Service Test',
        message: 'This is a test email to verify the email service is working correctly.',
        service: 'general-inquiry'
      };

      const result = await emailService.sendConfirmationEmail(testEmail);

      if (result.success) {
        res.json({
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to send test email',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        error: 'Test email failed',
        details: error.message
      });
    }
  });
} else {
  // In production, return 404 for test endpoint
  app.get('/api/test-email', (req, res) => {
    res.status(404).json({ error: 'Test endpoint not available in production' });
  });
}

// Health check endpoint with detailed service status
app.get('/api/health', async (req, res) => {
  try {
    // Check email service configuration
    const emailConfig = {
      sendgrid: !!process.env.SENDGRID_API_KEY,
      fromEmail: !!process.env.EMAIL_FROM,
      adminEmail: !!process.env.ADMIN_EMAIL
    };
    
    // Determine email service status
    let emailServiceStatus = 'misconfigured';
    if (emailConfig.sendgrid && emailConfig.fromEmail) {
      emailServiceStatus = 'ready';
    }

    res.json({
      status: 'ok',
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        email: emailServiceStatus,
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version
      },
      config: {
        email: {
          provider: 'SendGrid',
          fromConfigured: emailConfig.fromEmail,
          adminConfigured: emailConfig.adminEmail,
          apiKeyConfigured: emailConfig.sendgrid ? 'configured' : 'missing'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Background email processing function
async function processContactEmails(contactData) {
  try {
    // Send confirmation email
    await emailService.sendConfirmationEmail(contactData);
    
    // Send admin notification
    await emailService.sendAdminNotification(contactData);
    
    console.log(`✅ Emails processed for contact: ${contactData._id}`);
  } catch (error) {
    console.error(`❌ Error processing emails for contact ${contactData._id}:`, error);
    // Log the error but don't throw - we don't want to fail the main request
  }
}

// Contact form submission endpoint (optimized for speed)
app.post('/api/contact', async (req, res) => {
  try {
    const rawData = req.body;
    const startTime = Date.now();

    // Quick input sanitization (faster than full validation)
    const sanitizedData = InputSanitizer.sanitizeContactData(rawData);

    // Fast validation - only check critical fields
    const criticalFields = ['firstName', 'lastName', 'email', 'message'];
    const hasCriticalData = criticalFields.every(field =>
      sanitizedData[field] && sanitizedData[field].trim().length > 0
    );

    if (!hasCriticalData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: criticalFields
      });
    }

    // Enhanced email validation
    const emailRegex = /^[^\/\s@]+@[^\/\s@]+\.[^\/\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        field: 'email',
        message: 'Please enter a valid email address'
      });
    }

    // Map subject to service category (fast lookup)
    const serviceMap = {
      'general': 'general-inquiry',
      'quote': 'quote-request',
      'support': 'technical-support',
      'partnership': 'partnership'
    };
    const service = serviceMap[sanitizedData.subject] || 'general-inquiry';

    const contact = new Contact({
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      company: sanitizedData.company,
      subject: sanitizedData.subject,
      message: sanitizedData.message,
      service,
      emailStatus: 'pending' // Track email status
    });

    // Save to database (fast operation)
    const savedContact = await contact.save();
    
    // Process emails in the background
    process.nextTick(() => {
      processContactEmails(savedContact)
        .then(() => {
          // Update email status in database
          Contact.findByIdAndUpdate(savedContact._id, { emailStatus: 'sent' })
            .catch(err => console.error('Error updating email status:', err));
        })
        .catch(err => {
          console.error('Background email processing error:', err);
          Contact.findByIdAndUpdate(savedContact._id, { emailStatus: 'failed' })
            .catch(updateErr => console.error('Error updating failed status:', updateErr));
        });
    });

    // Respond immediately (don't wait for emails to be sent)
    const responseTime = Date.now() - startTime;
    console.log(`✅ Contact form processed in ${responseTime}ms`);
    
    res.status(202).json({
      success: true,
      message: 'Thank you for contacting us! We have received your message and will get back to you soon.',
      contactId: savedContact._id,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    console.error('❌ Contact form error:', error.message);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
        message: 'Please check your input data'
      });
    }

    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        success: false,
        error: 'Database temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while processing your request',
      message: 'Please try again later',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Quote form submission endpoint (optimized for speed)
app.post('/api/quote', async (req, res) => {
  try {
    const rawData = req.body;

    // Quick input sanitization
    const sanitizedData = InputSanitizer.sanitizeQuoteData(req.body);

    // Fast validation - only check critical fields
    const criticalFields = ['firstName', 'lastName', 'email', 'company', 'requirements'];
    const hasCriticalData = criticalFields.every(field =>
      sanitizedData[field] && sanitizedData[field].trim().length > 0
    );

    // Check if services array exists and has at least one item
    const hasValidServices = Array.isArray(sanitizedData.services) &&
                           sanitizedData.services.length > 0;

    if (!hasCriticalData) {
      return res.status(400).json({
        error: 'Please fill in all required fields',
        field: criticalFields.find(field => !sanitizedData[field] || sanitizedData[field].trim().length === 0)
      });
    }

    if (!hasValidServices) {
      return res.status(400).json({
        error: 'At least one service must be selected'
      });
    }

    // Enhanced email validation for quotes
    const emailRegex = /^[^\/\s@]+@[^\/\s@]+\.[^\/\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        field: 'email',
        message: 'Please enter a valid email address'
      });
    }

    const quote = new Quote({
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      company: sanitizedData.company,
      industry: sanitizedData.industry,
      address: sanitizedData.address,
      services: sanitizedData.services,
      budget: sanitizedData.budget,
      timeline: sanitizedData.timeline,
      requirements: sanitizedData.requirements,
      newsletter: sanitizedData.newsletter
    });
    // Save to database (fast operation)
    const savedQuote = await quote.save();

    // Send emails directly (immediate processing)
    const confirmationResult = await emailService.sendQuoteConfirmation(savedQuote);

    if (!confirmationResult.success) {
      // Continue anyway - admin notification is more important
    }

    const adminResult = await emailService.sendQuoteAdminNotification(savedQuote);

    if (!adminResult.success) {
      // Log error but don't fail request if email fails
      // Don't fail the request if email fails - data is saved successfully
    }

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully! We\'ll get back to you within 24 hours.',
      quoteId: savedQuote._id,
      responseTime: Date.now()
    });
  } catch (error) {
    // Log quote form error

    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return res.status(503).json({
        error: 'Database temporarily unavailable',
        message: 'Please try again in a few moments'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        details: errors,
        message: 'Please check your input data'
      });
    }

    console.error('❌ Quote form error:', error.message);
    res.status(500).json({
      error: 'Server error occurred while processing your request',
      message: 'Please try again later'
    });
  }
});

// Catch-all route for unmatched endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'POST /api/contact - Submit contact form',
      'POST /api/quote - Submit quote request',
      'GET /api/health - Check server status',
      'GET /api/quotes - Get all quotes (admin)',
      ...(process.env.NODE_ENV !== 'production' ? ['GET /api/test-email - Test email service'] : [])
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global error handler:', err.message);
  console.error('📍 Stack:', err.stack);

  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');

  try {
    // Close the server
    await new Promise((resolve) => {
      server.close(() => {
        console.log('✅ Server closed');
        resolve();
      });
    });

    // Close MongoDB connection (without callback)
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');

  try {
    // Close the server
    await new Promise((resolve) => {
      server.close(() => {
        console.log('✅ Server closed');
        resolve();
      });
    });

    // Close MongoDB connection (without callback)
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Graceful server startup with error handling
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 Test email: http://localhost:${PORT}/api/test-email (dev only)`);
  }
  console.log('🚀 Cernol Chemicals Backend is ready!');
  console.log('🔒 Security: Basic headers and error handling enabled');
  console.log('📧 Email service:', process.env.SENDGRID_API_KEY ? 'SendGrid configured' : 'not configured');
  console.log('🗄️  Database:', process.env.MONGODB_URI ? 'Atlas (production)' : 'Localhost (development)');
  console.log('🛡️  Endpoints protected with validation and sanitization');
})
.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('💡 Solutions:');
    console.error('   1. Kill processes: taskkill /f /im node.exe');
    console.error('   2. Change port: Set PORT=5001 in .env');
    console.error('   3. Check port usage: netstat -ano | findstr :5000');
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});

module.exports = app;
