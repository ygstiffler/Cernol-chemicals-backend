const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },

  // Company Information
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: ['mining', 'manufacturing', 'agriculture', 'water-treatment', 'food-beverage', 'pharmaceuticals', 'textiles', 'other']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },

  // Project Requirements
  services: [{
    type: String,
    required: true,
    enum: ['industrial-chemicals', 'lab-supplies', 'water-treatment', 'mining-chemicals', 'food-beverage', 'consulting']
  }],
  budget: {
    type: String,
    enum: ['under-1000', '1000-5000', '5000-10000', '10000-25000', 'over-25000', 'discuss'],
    default: 'discuss'
  },
  timeline: {
    type: String,
    enum: ['urgent', 'normal', 'flexible', 'discuss'],
    default: 'discuss'
  },

  // Additional Information
  requirements: {
    type: String,
    required: [true, 'Requirements are required'],
    trim: true,
    maxlength: [2000, 'Requirements cannot exceed 2000 characters']
  },
  newsletter: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for better query performance
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ email: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
