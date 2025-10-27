const validator = require('validator');
const sanitizeHtml = require('sanitize-html');
const xss = require('xss');

/**
 * Comprehensive input sanitization utility
 */
class InputSanitizer {

  /**
   * Sanitize text input - removes HTML, escapes special characters
   * @param {string} input - Input string to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized string
   */
  static sanitizeText(input, options = {}) {
    if (typeof input !== 'string') return '';

    const defaultOptions = {
      maxLength: 1000,
      allowHtml: false,
      ...options
    };

    let sanitized = input.trim();

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Limit length
    if (sanitized.length > defaultOptions.maxLength) {
      sanitized = sanitized.substring(0, defaultOptions.maxLength);
    }

    // Remove HTML if not allowed
    if (!defaultOptions.allowHtml) {
      sanitized = sanitizeHtml(sanitized, {
        allowedTags: [],
        allowedAttributes: {},
        textFilter: function(text) {
          return text.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
        }
      });
    }

    return sanitized;
  }

  /**
   * Sanitize email address
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  static sanitizeEmail(email) {
    if (typeof email !== 'string') return '';

    return validator.normalizeEmail(email.trim().toLowerCase(), {
      gmail_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      outlookdotcom_lowercase: true,
      yahoo_lowercase: true,
      icloud_lowercase: true
    }) || '';
  }

  /**
   * Sanitize phone number - remove all non-digit characters except +
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone
   */
  static sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';

    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '').trim();
  }

  /**
   * Sanitize array of services (no modification needed for controlled input)
   * @param {Array} services - Array of service strings
   * @returns {Array} Services array as-is (validation happens in model)
   */
  static sanitizeServices(services) {
    if (!Array.isArray(services)) return [];

    // Services come from controlled checkboxes, just validate they're strings
    return services
      .filter(service => typeof service === 'string' && service.trim().length > 0)
      .map(service => service.trim())
      .slice(0, 10); // Max 10 services
  }

  /**
   * Sanitize select field values
   * @param {string} value - Select field value
   * @param {Array} allowedValues - Array of allowed values
   * @returns {string} Sanitized value or empty string if invalid
   */
  static sanitizeSelect(value, allowedValues) {
    if (typeof value !== 'string') return '';

    const sanitized = this.sanitizeText(value, { maxLength: 50 });

    // Check if sanitized value is in allowed values
    return allowedValues.includes(sanitized) ? sanitized : '';
  }

  /**
   * Comprehensive sanitization for contact form data
   * @param {Object} data - Raw form data
   * @returns {Object} Sanitized data
   */
  static sanitizeContactData(data) {
    return {
      firstName: this.sanitizeText(data.firstName, { maxLength: 50 }),
      lastName: this.sanitizeText(data.lastName, { maxLength: 50 }),
      email: this.sanitizeEmail(data.email),
      phone: this.sanitizePhone(data.phone),
      company: this.sanitizeText(data.company, { maxLength: 100 }),
      subject: this.sanitizeText(data.subject, { maxLength: 200 }),
      message: this.sanitizeText(data.message, { maxLength: 2000, allowHtml: false })
    };
  }

  /**
   * Comprehensive sanitization for quote form data
   * @param {Object} data - Raw form data
   * @returns {Object} Sanitized data
   */
  static sanitizeQuoteData(data) {
    const validIndustries = ['mining', 'manufacturing', 'agriculture', 'water-treatment', 'food-beverage', 'pharmaceuticals', 'textiles', 'other'];
    const validServices = ['industrial-chemicals', 'lab-supplies', 'water-treatment', 'mining-chemicals', 'food-beverage', 'consulting'];
    const validBudgets = ['under-1000', '1000-5000', '5000-10000', '10000-25000', 'over-25000', 'discuss'];
    const validTimelines = ['urgent', 'normal', 'flexible', 'discuss'];

    return {
      firstName: this.sanitizeText(data.firstName, { maxLength: 50 }),
      lastName: this.sanitizeText(data.lastName, { maxLength: 50 }),
      email: this.sanitizeEmail(data.email),
      phone: this.sanitizePhone(data.phone),
      company: this.sanitizeText(data.company, { maxLength: 100 }),
      industry: this.sanitizeSelect(data.industry, validIndustries),
      address: this.sanitizeText(data.address, { maxLength: 200 }),
      services: this.sanitizeServices(data.services || []),
      budget: this.sanitizeSelect(data.budget, validBudgets) || 'discuss',
      timeline: this.sanitizeSelect(data.timeline, validTimelines) || 'discuss',
      requirements: this.sanitizeText(data.requirements, { maxLength: 2000, allowHtml: false }),
      newsletter: Boolean(data.newsletter)
    };
  }

  /**
   * Validate that required fields are not empty after sanitization
   * @param {Object} sanitizedData - Sanitized data object
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  static validateRequiredFields(sanitizedData, requiredFields) {
    const errors = [];

    requiredFields.forEach(field => {
      const value = sanitizedData[field];

      if (value === undefined || value === null || value === '') {
        errors.push(`${field} is required`);
      }

      // Special validation for arrays
      if (Array.isArray(value) && value.length === 0) {
        errors.push(`${field} must contain at least one item`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = InputSanitizer;
